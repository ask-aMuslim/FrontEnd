import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { take } from 'rxjs';
import type { LayerGroup, Map as LeafletMap } from 'leaflet';
import { MosqueDto, MosquesFacade } from '../../api/facades/mosques.facade';
import { toApiMediaUrl } from '../../core/helpers/media-url.helper';

interface MosqueCard {
  id: string;
  name: string;
  description: string;
  location: string;
  imamName: string | null;
  phoneNumber: string | null;
  phoneHref: string | null;
  email: string | null;
  emailHref: string | null;
  websiteUrl: string | null;
  googleMapsUrl: string | null;
  imageUrl: string | null;
  badges: string[];
  distanceLabel: string | null;
  latitude: number | null;
  longitude: number | null;
}

@Component({
  selector: 'app-mosques',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mosques.component.html',
  styleUrls: ['./mosques.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MosquesComponent implements OnInit, OnDestroy {
  private static readonly defaultPageSize = 9;
  private static readonly nearbyPageSize = 6;
  private static readonly highlightedNearbyPinCount = 3;
  private static readonly defaultNearbyRadiusInKm = 20;
  private static readonly expandedNearbyRadiusInKm = 100;
  private static readonly emptyDescription = 'No description has been added for this mosque yet.';
  private static readonly loadFailureMessage = 'Unable to load mosques right now.';
  private static readonly nearbyLoadFailureMessage = 'Unable to load nearby mosques right now.';

  private readonly mosquesFacade = inject(MosquesFacade);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly isLoading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly mosques = signal<MosqueDto[]>([]);
  readonly allMapMosques = signal<MosqueDto[]>([]);
  readonly searchTerm = signal('');
  readonly cityFilter = signal('');
  readonly currentPage = signal(1);
  readonly pageSize = signal(MosquesComponent.defaultPageSize);
  readonly totalPages = signal(1);
  readonly totalCount = signal(0);
  readonly hasNextPage = signal(false);
  readonly isNearbyLoading = signal(false);
  readonly nearbyError = signal<string | null>(null);
  readonly nearbyMosques = signal<MosqueDto[]>([]);
  readonly userLocation = signal<{ latitude: number; longitude: number } | null>(null);
  readonly hasRequestedNearbyMosques = signal(false);
  readonly nearbyMapElement = viewChild<ElementRef<HTMLDivElement>>('nearbyMap');

  readonly mosqueCards = computed<MosqueCard[]>(() =>
    this.mosques().map((mosque) => this.mapMosqueCard(mosque)),
  );
  readonly nearbyMosqueCards = computed<MosqueCard[]>(() =>
    this.nearbyMosques().map((mosque) => this.mapMosqueCard(mosque)),
  );
  readonly allMapMosquesWithCoordinates = computed(() =>
    this.allMapMosques().filter((mosque) => this.hasCoordinates(mosque)),
  );
  readonly mosquesWithCoordinates = computed(() =>
    this.mosques().filter((mosque) => this.hasCoordinates(mosque)),
  );
  readonly nearbyMosquesWithCoordinates = computed(() =>
    this.nearbyMosques().filter((mosque) => this.hasCoordinates(mosque)),
  );
  readonly mapMosques = computed(() =>
    this.mergeMosquesForMap(this.allMapMosquesWithCoordinates(), this.nearbyMosquesWithCoordinates()),
  );

  readonly hasMosques = computed(() => this.mosqueCards().length > 0);
  readonly hasNearbyMosques = computed(() => this.nearbyMosqueCards().length > 0);
  readonly hasNearbyMapData = computed(() => this.mapMosques().length > 0);
  readonly canHighlightNearestPins = computed(
    () => this.userLocation() !== null && this.mapMosques().length > 0,
  );
  readonly mapPinSummary = computed(() => {
    const count = this.mapMosques().length;
    return `${count} mosque pin${count === 1 ? '' : 's'} on the map`;
  });
  readonly mapLocationSummary = computed(() =>
    this.userLocation()
      ? 'Live location enabled. All mosque pins are loaded from the API.'
      : 'Showing all mosque locations loaded from the API',
  );
  readonly highlightedNearbyPinCount = computed(() =>
    this.canHighlightNearestPins()
      ? Math.min(MosquesComponent.highlightedNearbyPinCount, this.mapMosques().length)
      : 0,
  );
  readonly shouldShowNearbyEmptyState = computed(
    () =>
      !this.isNearbyLoading() &&
      this.userLocation() !== null &&
      !this.hasNearbyMosques() &&
      !this.nearbyError(),
  );
  readonly shouldShowNearbyPermissionPrompt = computed(
    () =>
      !this.isNearbyLoading() &&
      this.userLocation() === null &&
      !this.hasNearbyMosques() &&
      !this.nearbyError() &&
      !this.hasRequestedNearbyMosques(),
  );
  readonly hasFilters = computed(
    () => this.searchTerm().trim().length > 0 || this.cityFilter().trim().length > 0,
  );
  readonly isFirstPage = computed(() => this.currentPage() === 1);
  readonly showPagination = computed(
    () => this.currentPage() > 1 || this.hasNextPage() || this.totalPages() > 1,
  );

  private nearbyMap: LeafletMap | null = null;
  private nearbyLayer: LayerGroup | null = null;
  private leafletModulePromise: Promise<typeof import('leaflet')> | null = null;
  private nearbyMapResizeObserver: ResizeObserver | null = null;

  constructor() {
    if (!this.isBrowser) {
      return;
    }

    effect(() => {
      const mapElement = this.nearbyMapElement()?.nativeElement ?? null;
      const mapMosques = this.mapMosques();
      const userLocation = this.userLocation();

      if (!mapElement || mapMosques.length === 0) {
        this.destroyNearbyMap();
        return;
      }

      void this.syncNearbyMap(mapElement, userLocation, mapMosques);
    });
  }

  ngOnInit(): void {
    this.loadMosques();
    this.loadAllMapMosques();

    if (this.isBrowser) {
      this.loadNearbyMosques();
    }
  }

  ngOnDestroy(): void {
    this.disconnectNearbyMapResizeObserver();
    this.destroyNearbyMap();
  }

  trackById(_index: number, item: MosqueCard): string {
    return item.id;
  }

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
  }

  onCityInput(value: string): void {
    this.cityFilter.set(value);
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadMosques();
    this.loadAllMapMosques();
  }

  clearFilters(): void {
    if (!this.hasFilters()) {
      return;
    }

    this.searchTerm.set('');
    this.cityFilter.set('');
    this.currentPage.set(1);
    this.loadMosques();
    this.loadAllMapMosques();
  }

  prevPage(): void {
    if (this.isFirstPage()) {
      return;
    }

    this.currentPage.update((page) => Math.max(1, page - 1));
    this.loadMosques();
  }

  nextPage(): void {
    if (!this.hasNextPage()) {
      return;
    }

    this.currentPage.update((page) => page + 1);
    this.loadMosques();
  }

  recenterNearbyMap(): void {
    this.fitNearbyMapToData(this.userLocation(), this.mapMosques());
  }

  loadNearbyMosques(): void {
    this.hasRequestedNearbyMosques.set(true);

    if (!this.isBrowser) {
      this.nearbyError.set('Nearby mosque preview is only available in the browser.');
      return;
    }

    if (!('geolocation' in navigator)) {
      this.nearbyError.set('Your browser does not support geolocation.');
      return;
    }

    this.isNearbyLoading.set(true);
    this.nearbyError.set(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        this.userLocation.set(location);
        this.fetchNearbyMosques(location.latitude, location.longitude);
      },
      (error) => {
        this.userLocation.set(null);
        this.nearbyMosques.set([]);
        this.nearbyError.set(this.resolveGeolocationError(error));
        this.isNearbyLoading.set(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      },
    );
  }

  private loadMosques(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.mosquesFacade
      .getMosques({
        pageNumber: this.currentPage(),
        pageSize: this.pageSize(),
        name: this.searchTerm().trim() || undefined,
        city: this.cityFilter().trim() || undefined,
      })
      .subscribe({
        next: (result) => {
          this.mosques.set(result.items);
          this.currentPage.set(result.pageNumber);
          this.totalPages.set(result.totalPages);
          this.totalCount.set(result.totalCount);
          this.hasNextPage.set(result.hasNextPage);
          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          this.mosques.set([]);
          this.totalPages.set(1);
          this.totalCount.set(0);
          this.hasNextPage.set(false);
          this.loadError.set(this.resolveErrorMessage(error));
          this.isLoading.set(false);
        },
      });
  }

  private loadAllMapMosques(): void {
    this.mosquesFacade
      .getAllMosques({
        name: this.searchTerm().trim() || undefined,
        city: this.cityFilter().trim() || undefined,
      })
      .pipe(take(1))
      .subscribe({
        next: (mosques) => {
          this.allMapMosques.set(mosques);
        },
        error: () => {
          this.allMapMosques.set(this.mosques());
        },
      });
  }

  private fetchNearbyMosques(latitude: number, longitude: number): void {
    this.fetchNearbyMosquesWithRadius(
      latitude,
      longitude,
      MosquesComponent.defaultNearbyRadiusInKm,
      true,
    );
  }

  private fetchNearbyMosquesWithRadius(
    latitude: number,
    longitude: number,
    radiusInKm: number,
    allowExpandedRetry: boolean,
  ): void {
    this.mosquesFacade
      .getNearbyMosques({
        latitude,
        longitude,
        radiusInKm,
        pageSize: MosquesComponent.nearbyPageSize,
      })
      .pipe(take(1))
      .subscribe({
        next: (mosques) => {
          if (
            mosques.length === 0 &&
            allowExpandedRetry &&
            radiusInKm < MosquesComponent.expandedNearbyRadiusInKm
          ) {
            this.fetchNearbyMosquesWithRadius(
              latitude,
              longitude,
              MosquesComponent.expandedNearbyRadiusInKm,
              false,
            );
            return;
          }

          this.nearbyMosques.set(mosques);
          this.nearbyError.set(null);
          this.isNearbyLoading.set(false);
        },
        error: (error: unknown) => {
          this.nearbyMosques.set([]);
          this.nearbyError.set(this.resolveNearbyErrorMessage(error));
          this.isNearbyLoading.set(false);
        },
      });
  }

  private mapMosqueCard(mosque: MosqueDto): MosqueCard {
    return {
      id: mosque.id,
      name: mosque.name,
      description: mosque.description?.trim() || MosquesComponent.emptyDescription,
      location: this.resolveLocation(mosque),
      imamName: mosque.imamName,
      phoneNumber: mosque.phoneNumber,
      phoneHref: mosque.phoneNumber ? `tel:${mosque.phoneNumber}` : null,
      email: mosque.email,
      emailHref: mosque.email ? `mailto:${mosque.email}` : null,
      websiteUrl: mosque.websiteUrl,
      googleMapsUrl: mosque.googleMapsUrl,
      imageUrl: toApiMediaUrl(mosque.mainImageUrl),
      badges: this.resolveBadges(mosque),
      distanceLabel:
        mosque.distanceInKm !== null ? `${mosque.distanceInKm.toFixed(1)} km away` : null,
      latitude: mosque.latitude,
      longitude: mosque.longitude,
    };
  }

  private hasCoordinates(mosque: MosqueDto): boolean {
    return (
      mosque.latitude !== null &&
      mosque.longitude !== null &&
      Number.isFinite(mosque.latitude) &&
      Number.isFinite(mosque.longitude)
    );
  }

  private async syncNearbyMap(
    element: HTMLDivElement,
    userLocation: { latitude: number; longitude: number } | null,
    mosques: MosqueDto[],
  ): Promise<void> {
    const L = await this.loadLeaflet();

    if (!this.nearbyMap || this.nearbyMap.getContainer() !== element) {
      this.destroyNearbyMap();
      this.nearbyMap = L.map(element, {
        scrollWheelZoom: true,
        zoomControl: true,
        touchZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(this.nearbyMap);

      this.observeNearbyMapSize(element);
    }

    this.nearbyLayer?.remove();

    const highlightedMosqueIds = this.resolveHighlightedMosqueIds(mosques, userLocation);
    const mosqueMarkers = mosques.map((mosque) =>
      L.marker([mosque.latitude as number, mosque.longitude as number], {
        icon: this.createPinMarkerIcon(
          L,
          null,
          highlightedMosqueIds.has(mosque.id) ? '#f59e0b' : '#156b40',
        ),
        riseOnHover: true,
        zIndexOffset: highlightedMosqueIds.has(mosque.id) ? 450 : 150,
      }).bindTooltip(mosque.name, {
        direction: 'top',
        offset: [0, -32],
      }).bindPopup(this.buildMosquePinPopup(mosque, userLocation)),
    );

    const mapLayers = [...mosqueMarkers];
    const boundsPoints = mosques.map(
      (mosque) => [mosque.latitude as number, mosque.longitude as number] as [number, number],
    );

    if (userLocation) {
      const userMarker = L.marker([userLocation.latitude, userLocation.longitude], {
        icon: this.createPinMarkerIcon(L, null, '#2563eb', 38),
        riseOnHover: true,
        zIndexOffset: 800,
      }).bindTooltip('Your location', {
        direction: 'top',
        offset: [0, -40],
      });

      mapLayers.unshift(userMarker);
      boundsPoints.unshift([userLocation.latitude, userLocation.longitude]);
    }

    this.nearbyLayer = L.layerGroup(mapLayers).addTo(this.nearbyMap);

    this.fitNearbyMapToData(userLocation, mosques);
    this.nearbyMap.invalidateSize();
    this.scheduleNearbyMapResize();
  }

  private async loadLeaflet(): Promise<typeof import('leaflet')> {
    if (!this.leafletModulePromise) {
      this.leafletModulePromise = import('leaflet');
    }

    return this.leafletModulePromise;
  }

  private createPinMarkerIcon(
    leaflet: typeof import('leaflet'),
    label: string | null,
    color: string,
    size = 32,
  ) {
    const width = size + 16;
    const height = size + 24;
    const fontSize = label && label.length > 2 ? 10 : 13;
    const pinContent = label
      ? `<span class="leaflet-pin-marker__label">${this.escapeHtml(label)}</span>`
      : '<span class="leaflet-pin-marker__core"></span>';

    return leaflet.divIcon({
      className: 'leaflet-pin-marker-wrapper',
      html: `
        <span
          class="leaflet-pin-marker"
          style="--pin-color:${color};--pin-size:${size}px;--pin-label-size:${fontSize}px;"
        >
          <span class="leaflet-pin-marker__shape">
            ${pinContent}
          </span>
          <span class="leaflet-pin-marker__shadow"></span>
        </span>
      `,
      iconSize: [width, height],
      iconAnchor: [width / 2, height - 2],
      popupAnchor: [0, -height + 14],
      tooltipAnchor: [0, -height + 12],
    });
  }

  private resolveHighlightedMosqueIds(
    mosques: MosqueDto[],
    userLocation: { latitude: number; longitude: number } | null,
  ): Set<string> {
    if (!userLocation) {
      return new Set<string>();
    }

    const nearestMosques = [...mosques]
      .sort((left, right) => {
        const leftDistance = this.resolveMosqueDistanceKm(left, userLocation);
        const rightDistance = this.resolveMosqueDistanceKm(right, userLocation);

        if (leftDistance === null && rightDistance === null) {
          return left.name.localeCompare(right.name);
        }
        if (leftDistance === null) {
          return 1;
        }
        if (rightDistance === null) {
          return -1;
        }

        return leftDistance - rightDistance;
      })
      .slice(0, MosquesComponent.highlightedNearbyPinCount);

    return new Set(nearestMosques.map((mosque) => mosque.id));
  }

  private buildMosquePinPopup(
    mosque: MosqueDto,
    userLocation: { latitude: number; longitude: number } | null,
  ): string {
    const location = this.escapeHtml(this.resolveLocation(mosque) || 'Location unavailable');
    const distanceInKm = this.resolveMosqueDistanceKm(mosque, userLocation);
    const distance =
      distanceInKm !== null
        ? `<p class="leaflet-popup-card__distance">${distanceInKm.toFixed(1)} km away</p>`
        : '';
    const directionsLink = mosque.googleMapsUrl
      ? `<a class="leaflet-popup-card__action" href="${this.escapeHtml(mosque.googleMapsUrl)}" target="_blank" rel="noopener noreferrer">Open directions</a>`
      : '';

    return `
      <div class="leaflet-popup-card">
        <p class="leaflet-popup-card__eyebrow">Mosque</p>
        <h4 class="leaflet-popup-card__title">${this.escapeHtml(mosque.name)}</h4>
        <p class="leaflet-popup-card__meta">${location}</p>
        ${distance}
        ${directionsLink}
      </div>
    `;
  }

  private resolveMosqueDistanceKm(
    mosque: MosqueDto,
    userLocation: { latitude: number; longitude: number } | null,
  ): number | null {
    if (mosque.distanceInKm !== null) {
      return mosque.distanceInKm;
    }

    if (!userLocation || !this.hasCoordinates(mosque)) {
      return null;
    }

    return this.calculateDistanceKm(
      userLocation.latitude,
      userLocation.longitude,
      mosque.latitude as number,
      mosque.longitude as number,
    );
  }

  private calculateDistanceKm(
    startLatitude: number,
    startLongitude: number,
    endLatitude: number,
    endLongitude: number,
  ): number {
    const toRadians = (value: number) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const latitudeDelta = toRadians(endLatitude - startLatitude);
    const longitudeDelta = toRadians(endLongitude - startLongitude);
    const startLatitudeRadians = toRadians(startLatitude);
    const endLatitudeRadians = toRadians(endLatitude);
    const haversine =
      Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
      Math.cos(startLatitudeRadians) *
      Math.cos(endLatitudeRadians) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);

    return 2 * earthRadiusKm * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  }

  private mergeMosquesForMap(primaryMosques: MosqueDto[], secondaryMosques: MosqueDto[]): MosqueDto[] {
    const mosquesById = new Map<string, MosqueDto>();

    for (const mosque of [...primaryMosques, ...secondaryMosques]) {
      const existingMosque = mosquesById.get(mosque.id);

      if (!existingMosque) {
        mosquesById.set(mosque.id, mosque);
        continue;
      }

      mosquesById.set(mosque.id, {
        ...existingMosque,
        ...mosque,
        distanceInKm: mosque.distanceInKm ?? existingMosque.distanceInKm,
      });
    }

    return [...mosquesById.values()];
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  private destroyNearbyMap(): void {
    this.nearbyLayer?.remove();
    this.nearbyLayer = null;

    if (this.nearbyMap) {
      this.nearbyMap.remove();
      this.nearbyMap = null;
    }
  }

  private observeNearbyMapSize(element: HTMLDivElement): void {
    this.disconnectNearbyMapResizeObserver();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    this.nearbyMapResizeObserver = new ResizeObserver(() => {
      this.nearbyMap?.invalidateSize(false);
    });
    this.nearbyMapResizeObserver.observe(element);
  }

  private disconnectNearbyMapResizeObserver(): void {
    this.nearbyMapResizeObserver?.disconnect();
    this.nearbyMapResizeObserver = null;
  }

  private scheduleNearbyMapResize(): void {
    requestAnimationFrame(() => {
      this.nearbyMap?.invalidateSize(false);

      requestAnimationFrame(() => {
        this.nearbyMap?.invalidateSize(false);
      });
    });
  }

  private fitNearbyMapToData(
    userLocation: { latitude: number; longitude: number } | null,
    mosques: MosqueDto[],
  ): void {
    if (!this.nearbyMap || mosques.length === 0) {
      return;
    }

    const bounds = this.resolveDefaultBoundsPoints(userLocation, mosques);
    this.nearbyMap.fitBounds(bounds, {
      padding: [28, 28],
      maxZoom: userLocation ? 14 : 13,
    });
  }

  private resolveDefaultBoundsPoints(
    userLocation: { latitude: number; longitude: number } | null,
    mosques: MosqueDto[],
  ): [number, number][] {
    if (!userLocation) {
      return mosques.map(
        (mosque) => [mosque.latitude as number, mosque.longitude as number] as [number, number],
      );
    }

    const nearestMosque = this.resolveNearestMosque(mosques, userLocation);
    if (!nearestMosque) {
      return [[userLocation.latitude, userLocation.longitude]];
    }

    return [
      [userLocation.latitude, userLocation.longitude],
      [nearestMosque.latitude as number, nearestMosque.longitude as number],
    ];
  }

  private resolveNearestMosque(
    mosques: MosqueDto[],
    userLocation: { latitude: number; longitude: number } | null,
  ): MosqueDto | null {
    if (!userLocation) {
      return null;
    }

    return [...mosques].sort((left, right) => {
      const leftDistance = this.resolveMosqueDistanceKm(left, userLocation);
      const rightDistance = this.resolveMosqueDistanceKm(right, userLocation);

      if (leftDistance === null && rightDistance === null) {
        return left.name.localeCompare(right.name);
      }
      if (leftDistance === null) {
        return 1;
      }
      if (rightDistance === null) {
        return -1;
      }

      return leftDistance - rightDistance;
    })[0] ?? null;
  }

  private resolveLocation(mosque: MosqueDto): string {
    const parts = [
      mosque.address,
      mosque.district,
      mosque.city,
      mosque.governorate,
      mosque.country,
    ]
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .filter((value, index, values) => values.indexOf(value) === index);

    return parts.join(', ');
  }

  private resolveBadges(mosque: MosqueDto): string[] {
    const badges: string[] = [];

    if (mosque.isVerified) {
      badges.push('Verified');
    }

    if (mosque.hasWomenPrayerArea) {
      badges.push('Women Prayer Area');
    }

    if (mosque.hasFridayKhutbah) {
      badges.push('Friday Khutbah');
    }

    return badges;
  }

  private resolveErrorMessage(error: unknown): string {
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message?: unknown }).message === 'string'
    ) {
      return (error as { message: string }).message;
    }

    return MosquesComponent.loadFailureMessage;
  }

  private resolveNearbyErrorMessage(error: unknown): string {
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message?: unknown }).message === 'string'
    ) {
      return (error as { message: string }).message;
    }

    return MosquesComponent.nearbyLoadFailureMessage;
  }

  private resolveGeolocationError(error: GeolocationPositionError): string {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Location access was denied. Allow location access to preview nearby mosques.';
      case error.POSITION_UNAVAILABLE:
        return 'Your location could not be determined right now.';
      case error.TIMEOUT:
        return 'Location lookup timed out. Please try again.';
      default:
        return 'We could not access your location for the nearby mosque preview.';
    }
  }
}
