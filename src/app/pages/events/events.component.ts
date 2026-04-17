import { ChangeDetectorRef, Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { EventCardComponent } from './event-card/event-card.component';
import { InlineSvgDirective } from '../../shared/directives/inline-svg.directive';
import { EventsService } from '../../core/services/events.service';
import type { EventCard } from './event-card/event-card.component';
import {
  asRecord,
  extractArray,
  getValue,
  toBooleanValue,
  toNumberValue,
  toStringArray,
  toStringValue,
} from '../../core/helpers/api-response.helper';
import { formatEventDateDisplay, formatEventTimeRangeDisplay } from '../../core/helpers/event-display.helper';
import { toApiMediaUrl } from '../../core/helpers/media-url.helper';

@Component({
  selector: 'app-events',
  imports: [EventCardComponent, InlineSvgDirective],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss'],
})
export class EventsComponent implements OnInit {
  private static readonly fallbackImage = '/images/events-image-placeholder.jpg';
  private static readonly fallbackSpeakerImage = '/images/profile-picture-navbar.png';
  private static readonly defaultPageSize = 3;
  private static readonly minimumTotalPages = 1;
  private static readonly idOffset = 1;

  currentPage = 1;
  itemsPerPage = EventsComponent.defaultPageSize;
  totalPages = EventsComponent.minimumTotalPages;
  hasNextPage = false;
  pages: number[] = [];

  eventCards: EventCard[] = [];

  private readonly eventsService = inject(EventsService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  ngOnInit(): void {
    this.loadEvents();
  }

  private updatePages(): void {
    this.pages = Array.from({ length: this.totalPages }, (_value, index) => index + 1);
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadEvents();
      this.scrollToTopOfSection();
    }
  }

  nextPage(): void {
    if (!this.isLastPage) {
      this.currentPage++;
      this.loadEvents();
      this.scrollToTopOfSection();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.pages.length) {
      this.currentPage = page;
      this.loadEvents();
      this.scrollToTopOfSection();
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  get isFirstPage(): boolean {
    return this.currentPage === 1;
  }

  get isLastPage(): boolean {
    if (this.hasNextPage) {
      return false;
    }

    return this.currentPage >= this.totalPages;
  }

  get showPagination(): boolean {
    return this.currentPage > 1 || this.totalPages > 1 || this.hasNextPage;
  }

  get paginatedEventCards(): EventCard[] {
    return this.eventCards;
  }

  get featuredEvent(): EventCard | null {
    return this.eventCards.length > 0 ? this.eventCards[0] : null;
  }

  get featuredEventDay(): string {
    const dateValue = this.featuredEvent?.date;
    if (!dateValue) {
      return '--';
    }

    const parsed = new Date(dateValue);
    return Number.isNaN(parsed.getTime()) ? '--' : String(parsed.getDate()).padStart(2, '0');
  }

  get featuredEventMonth(): string {
    const dateValue = this.featuredEvent?.date;
    if (!dateValue) {
      return '---';
    }

    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) {
      return '---';
    }

    return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(parsed);
  }

  private loadEvents(): void {
    this.eventsService.getAll({
      pageNumber: this.currentPage,
      pageSize: this.itemsPerPage,
    }).subscribe({
      next: (response) => {
        const mappedEvents = this.mapEvents(response);
        this.eventCards = mappedEvents;
        const paginationMeta = this.extractPaginationMeta(response, mappedEvents.length);
        this.hasNextPage = paginationMeta.hasNextPage;
        this.totalPages = paginationMeta.totalPages;
        if (this.currentPage > this.totalPages) {
          this.currentPage = this.totalPages;
        }
        this.updatePages();
        this.cdr.detectChanges();
      },
      error: () => {
        this.eventCards = [];
        this.totalPages = EventsComponent.minimumTotalPages;
        this.hasNextPage = false;
        this.updatePages();
        this.cdr.detectChanges();
      },
    });
  }

  private extractPaginationMeta(
    response: unknown,
    fallbackCount: number,
  ): { totalPages: number; hasNextPage: boolean } {
    const root = asRecord(response);
    const nested = asRecord(getValue(root, 'data', 'Data', 'result', 'Result'));

    const totalPages =
      toNumberValue(getValue(nested, 'totalPages', 'TotalPages', 'pageCount', 'PageCount')) ??
      toNumberValue(getValue(root, 'totalPages', 'TotalPages', 'pageCount', 'PageCount'));

    if (totalPages && totalPages > 0) {
      const normalizedTotalPages = Math.max(
        EventsComponent.minimumTotalPages,
        Math.ceil(totalPages),
      );
      return {
        totalPages: normalizedTotalPages,
        hasNextPage: this.currentPage < normalizedTotalPages,
      };
    }

    const totalCount =
      toNumberValue(getValue(nested, 'totalCount', 'TotalCount', 'itemCount', 'ItemCount', 'count', 'Count')) ??
      toNumberValue(getValue(root, 'totalCount', 'TotalCount', 'itemCount', 'ItemCount', 'count', 'Count')) ??
      fallbackCount;

    const hasNextPageFromApi =
      toBooleanValue(getValue(nested, 'hasNextPage', 'HasNextPage')) ||
      toBooleanValue(getValue(root, 'hasNextPage', 'HasNextPage'));

    if (totalCount > fallbackCount || hasNextPageFromApi) {
      const normalizedTotalPages = Math.max(
        EventsComponent.minimumTotalPages,
        Math.ceil(totalCount / this.itemsPerPage),
        this.currentPage + (hasNextPageFromApi ? 1 : 0),
      );
      return {
        totalPages: normalizedTotalPages,
        hasNextPage: hasNextPageFromApi || this.currentPage < normalizedTotalPages,
      };
    }

    return {
      totalPages: Math.max(EventsComponent.minimumTotalPages, this.currentPage),
      hasNextPage: hasNextPageFromApi,
    };
  }

  private mapEvents(response: unknown): EventCard[] {
    const records = this.getPublishedEventRecords(response);
    return records.map((item, index) => this.mapEvent(item, index));
  }

  private getPublishedEventRecords(response: unknown): readonly unknown[] {
    return extractArray(response).filter((item) => this.isPublishedEvent(item));
  }

  private mapEvent(item: unknown, index: number): EventCard {
    const record = asRecord(item);
    const id =
      toStringValue(getValue(record, 'id', 'Id')) ?? `event-${index + EventsComponent.idOffset}`;
    const title = toStringValue(getValue(record, 'title', 'Title')) ?? '';
    const description = toStringValue(getValue(record, 'description', 'Description')) ?? '';
    const imageUrl =
      toApiMediaUrl(
        toStringValue(getValue(record, 'imageUrl', 'ImageUrl', 'coverImageUrl', 'CoverImageUrl')),
      ) ??
      EventsComponent.fallbackImage;
    const imageAlt = toStringValue(getValue(record, 'imageAlt', 'ImageAlt')) ?? title;
    const speakerName = toStringValue(getValue(record, 'speakerName', 'SpeakerName')) ?? '';
    const speakerImage =
      toApiMediaUrl(toStringValue(getValue(record, 'speakerImage', 'SpeakerImage'))) ??
      EventsComponent.fallbackSpeakerImage;
    const speakerRole = toStringValue(getValue(record, 'speakerRole', 'SpeakerRole')) ?? '';
    const startDateValue = toStringValue(
      getValue(record, 'startDateTime', 'StartDateTime', 'date', 'Date', 'startDate', 'StartDate', 'eventDate', 'EventDate'),
    );
    const endDateValue = toStringValue(getValue(record, 'endDateTime', 'EndDateTime'));
    const date = formatEventDateDisplay(startDateValue);
    const timeRange = formatEventTimeRangeDisplay(startDateValue, endDateValue);
    const tags = toStringArray(getValue(record, 'tags', 'Tags', 'categories', 'Categories'));
    const isRecorded = toBooleanValue(getValue(record, 'isRecorded', 'IsRecorded'));
    const isPublished = toBooleanValue(getValue(record, 'isPublished', 'IsPublished'));

    return {
      id,
      title,
      description,
      imageUrl,
      imageAlt,
      speakerName,
      speakerImage,
      speakerRole,
      date,
      timeRange,
      tags,
      isRecorded,
      isPublished,
    };
  }

  private isPublishedEvent(item: unknown): boolean {
    const record = asRecord(item);
    return toBooleanValue(getValue(record, 'isPublished', 'IsPublished'));
  }

  private scrollToTopOfSection(): void {
    if (!this.isBrowser) {
      return;
    }

    const section = globalThis.document?.getElementById('events-recorded-section');
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
