import { Component, OnInit } from '@angular/core';
import { EventCardComponent } from './event-card/event-card.component';
import { InlineSvgDirective } from '../../shared/directives/inline-svg.directive';
import { EVENTS_SEED_DATA } from '../../core/services/mock-data/events-seed-data';
import { EventsService } from '../../core/services/events.service';
import type { EventCard } from './event-card/event-card.component';

@Component({
  selector: 'app-events',
  imports: [EventCardComponent, InlineSvgDirective],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss'],
})
export class EventsComponent implements OnInit {
  private static readonly fallbackTitle = 'Upcoming Event';
  private static readonly fallbackDescription = 'Details will be available soon.';
  private static readonly fallbackSpeakerName = 'Ask A Muslim';
  private static readonly fallbackSpeakerRole = 'Islamic Scholar';
  private static readonly fallbackImage = '/images/events-picture.png';
  private static readonly fallbackSpeakerImage = '/images/profile-picture-navbar.png';
  private static readonly fallbackTag = '#Event';
  private static readonly idOffset = 1;

  private readonly fallbackEvents = EVENTS_SEED_DATA;

  currentPage = 1;
  itemsPerPage = 6;
  pages: number[] = [];

  eventCards: EventCard[] = [];

  constructor(private readonly eventsService: EventsService) { }

  ngOnInit(): void {
    this.loadEvents();
  }

  private updatePages(): void {
    const totalPages = Math.ceil(this.eventCards.length / this.itemsPerPage);
    this.pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.pages.length) {
      this.currentPage++;
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.pages.length) {
      this.currentPage = page;
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  get isFirstPage(): boolean {
    return this.currentPage === 1;
  }

  get isLastPage(): boolean {
    return this.currentPage === this.pages.length;
  }

  get paginatedEventCards(): EventCard[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.eventCards.slice(startIndex, endIndex);
  }

  private loadEvents(): void {
    this.eventsService.getAll().subscribe({
      next: (response) => {
        const mapped = this.mapEvents(response);
        this.eventCards = mapped.length > 0 ? mapped : this.fallbackEvents;
        this.updatePages();
      },
      error: () => {
        this.eventCards = this.fallbackEvents;
        this.updatePages();
      },
    });
  }

  private mapEvents(response: unknown): EventCard[] {
    const records = this.extractArray(response);
    return records.map((item, index) => this.mapEvent(item, index));
  }

  private mapEvent(item: unknown, index: number): EventCard {
    const record = this.asRecord(item);
    const id = this.asString(record?.['id']) ?? `event-${index + EventsComponent.idOffset}`;
    const title = this.asString(record?.['title']) ?? EventsComponent.fallbackTitle;
    const description =
      this.asString(record?.['description']) ?? EventsComponent.fallbackDescription;
    const imageUrl = this.asString(record?.['imageUrl']) ?? EventsComponent.fallbackImage;
    const imageAlt = this.asString(record?.['imageAlt']) ?? title;
    const speakerName =
      this.asString(record?.['speakerName']) ?? EventsComponent.fallbackSpeakerName;
    const speakerImage =
      this.asString(record?.['speakerImage']) ?? EventsComponent.fallbackSpeakerImage;
    const speakerRole =
      this.asString(record?.['speakerRole']) ?? EventsComponent.fallbackSpeakerRole;
    const date = this.asString(record?.['date']) ?? 'TBD';
    const tags = this.asStringArray(record?.['tags']);
    const isRecorded = this.asBoolean(record?.['isRecorded']);

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
      tags: tags.length > 0 ? tags : [EventsComponent.fallbackTag],
      isRecorded,
    };
  }

  private extractArray(response: unknown): readonly unknown[] {
    if (Array.isArray(response)) {
      return response;
    }
    const record = this.asRecord(response);
    const data = record?.['data'] ?? record?.['items'] ?? record?.['results'];
    return Array.isArray(data) ? data : [];
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
  }

  private asString(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value : null;
  }

  private asStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);
  }

  private asBoolean(value: unknown): boolean {
    return value === true;
  }
}
