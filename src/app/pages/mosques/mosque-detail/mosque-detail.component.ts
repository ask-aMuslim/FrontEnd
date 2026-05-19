import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ChangeDetectionStrategy,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { take } from 'rxjs';
import type { LayerGroup, Map as LeafletMap } from 'leaflet';
import { MosqueDto, MosquesFacade } from '../../../api/facades/mosques.facade';
import { toApiMediaUrl } from '../../../core/helpers/media-url.helper';

@Component({
  selector: 'app-mosque-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mosque-detail.component.html',
  styleUrls: ['./mosque-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MosqueDetailComponent implements OnInit, OnDestroy {
  private static readonly emptyDescription = 'No description has been added for this mosque yet.';
  private static readonly loadFailureMessage = 'Unable to load mosque details right now.';
  private static readonly notFoundMessage = 'Mosque details could not be found.';

  private readonly route = inject(ActivatedRoute);
  private readonly mosquesFacade = inject(MosquesFacade);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly mosque = signal<MosqueDto | null>(null);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly mapElement = viewChild<ElementRef<HTMLDivElement>>('detailMap');

  readonly imageUrl = computed(() => toApiMediaUrl(this.mosque()?.mainImageUrl ?? null));
  readonly description = computed(
    () => this.mosque()?.description?.trim() || MosqueDetailComponent.emptyDescription,
  );
  readonly location = computed(() => {
    const mosque = this.mosque();
    return mosque ? this.resolveLocation(mosque) || 'Location unavailable' : 'Location unavailable';
  });
  readonly coordinates = computed(() => {
    const mosque = this.mosque();
    if (
      !mosque ||
      mosque.latitude === null ||
      mosque.longitude === null ||
      !Number.isFinite(mosque.latitude) ||
      !Number.isFinite(mosque.longitude)
    ) {
      return null;
    }

    return {
      latitude: mosque.latitude,
      longitude: mosque.longitude,
    };
  });
  readonly badges = computed(() => {
    const mosque = this.mosque();
    return mosque ? this.resolveBadges(mosque) : [];
  });
  readonly hasCoordinates = computed(() => this.coordinates() !== null);

  private detailMap: LeafletMap | null = null;
  private detailLayer: LayerGroup | null = null;
  private leafletModulePromise: Promise<typeof import('leaflet')> | null = null;

  constructor() {
    if (!this.isBrowser) {
      return;
    }

    effect(() => {
      const mapElement = this.mapElement()?.nativeElement ?? null;
      const mosque = this.mosque();
      const coordinates = this.coordinates();

      if (!mapElement || !mosque || !coordinates) {
        this.destroyMap();
        return;
      }

      void this.syncMap(mapElement, coordinates.latitude, coordinates.longitude, mosque.name);
    });
  }

  ngOnInit(): void {
    const mosqueId = this.route.snapshot.paramMap.get('id')?.trim() ?? '';
    if (!mosqueId) {
      this.loadError.set(MosqueDetailComponent.notFoundMessage);
      this.isLoading.set(false);
      return;
    }

    this.mosquesFacade
      .getMosqueById(mosqueId)
      .pipe(take(1))
      .subscribe({
        next: (mosque) => {
          this.mosque.set(mosque);
          this.loadError.set(mosque ? null : MosqueDetailComponent.notFoundMessage);
          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          this.mosque.set(null);
          this.loadError.set(this.resolveErrorMessage(error));
          this.isLoading.set(false);
        },
      });
  }

  ngOnDestroy(): void {
    this.destroyMap();
  }

  recenterMap(): void {
    const coordinates = this.coordinates();
    if (!this.detailMap || !coordinates) {
      return;
    }

    this.detailMap.setView([coordinates.latitude, coordinates.longitude], 14, {
      animate: true,
    });
  }

  private async syncMap(
    element: HTMLDivElement,
    latitude: number,
    longitude: number,
    mosqueName: string,
  ): Promise<void> {
    const L = await this.loadLeaflet();

    if (!this.detailMap || this.detailMap.getContainer() !== element) {
      this.destroyMap();
      this.detailMap = L.map(element, {
        scrollWheelZoom: true,
        zoomControl: true,
        touchZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(this.detailMap);
    }

    this.detailLayer?.remove();

    const marker = L.marker([latitude, longitude], {
      icon: this.createPinMarkerIcon(L, '1', '#156b40', 34),
      riseOnHover: true,
      zIndexOffset: 500,
    }).bindTooltip(mosqueName, {
      direction: 'top',
      offset: [0, -34],
    }).bindPopup(this.buildMapPopup(mosqueName));

    this.detailLayer = L.layerGroup([marker]).addTo(this.detailMap);
    this.detailMap.setView([latitude, longitude], 14);
    this.detailMap.invalidateSize();
  }

  private async loadLeaflet(): Promise<typeof import('leaflet')> {
    if (!this.leafletModulePromise) {
      this.leafletModulePromise = import('leaflet');
    }

    return this.leafletModulePromise;
  }

  private createPinMarkerIcon(
    leaflet: typeof import('leaflet'),
    label: string,
    color: string,
    size = 32,
  ) {
    const width = size + 16;
    const height = size + 24;
    const fontSize = label.length > 2 ? 10 : 13;

    return leaflet.divIcon({
      className: 'leaflet-pin-marker-wrapper',
      html: `
        <span
          class="leaflet-pin-marker"
          style="--pin-color:${color};--pin-size:${size}px;--pin-label-size:${fontSize}px;"
        >
          <span class="leaflet-pin-marker__shape">
            <span class="leaflet-pin-marker__label">${this.escapeHtml(label)}</span>
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

  private buildMapPopup(mosqueName: string): string {
    const location = this.escapeHtml(this.location());
    const directionsLink = this.mosque()?.googleMapsUrl
      ? `<a class="leaflet-popup-card__action" href="${this.escapeHtml(this.mosque()?.googleMapsUrl ?? '')}" target="_blank" rel="noopener noreferrer">Open directions</a>`
      : '';

    return `
      <div class="leaflet-popup-card">
        <p class="leaflet-popup-card__eyebrow">Mosque</p>
        <h4 class="leaflet-popup-card__title">${this.escapeHtml(mosqueName)}</h4>
        <p class="leaflet-popup-card__meta">${location}</p>
        ${directionsLink}
      </div>
    `;
  }

  private destroyMap(): void {
    this.detailLayer?.remove();
    this.detailLayer = null;

    if (this.detailMap) {
      this.detailMap.remove();
      this.detailMap = null;
    }
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

    return MosqueDetailComponent.loadFailureMessage;
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}
