import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EventsService } from '../../core/services/events.service';
import { AuthService } from '../../core/services/auth.service';
import { QasService } from '../../core/services/qas.service';
import { EventCardComponent, type EventCard as SharedEventCard } from '../events/event-card/event-card.component';
import { HeroSearchInputComponent } from '../../shared/reusable-components/hero-search-input/hero-search-input.component';
import {
  asRecord,
  extractArray,
  getValue,
  toStringValue,
  toStringArray,
} from '../../core/helpers/api-response.helper';
import { formatEventDateDisplay } from '../../core/helpers/event-display.helper';
import { toApiMediaUrl } from '../../core/helpers/media-url.helper';

interface HeroStat {
  value: string;
  label: string;
  icon: 'questions' | 'scholars';
}

interface FeatureCard {
  icon: string;
  title: string;
  description: string;
  cta: string;
  href?: string;
  status?: 'soon';
}

interface PillarItem {
  number: string;
  label: string;
  name: string;
}

interface ServeAudienceCard {
  title: string;
  topicTag: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, EventCardComponent, HeroSearchInputComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class Home implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('bubblesContainer') bubblesContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('bubblesTrack') bubblesTrack?: ElementRef<HTMLDivElement>;

  protected readonly Math = Math;
  protected searchQuery = '';
  protected readonly heroStats: HeroStat[] = [
    { value: '13,000+', label: 'Answered Questions', icon: 'questions' },
    { value: '250+', label: 'Scholars & Teachers', icon: 'scholars' },
  ];

  protected heroBubbles: string[] = [
    'Who is Allah?',
    'What is Islam?',
    'Is Islam peaceful?',
    'What is Shahada?',
    'How to start praying?',
    'Why do Muslims fast?',
    'What is Zakat?',
    'How to perform Hajj?',
  ];

  protected readonly featureCards: FeatureCard[] = [
    {
      icon: `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.3787 42.4221C10.7317 43.3124 10.8102 44.2878 10.6043 45.2231L8.0482 53.1195C7.96583 53.52 7.98713 53.9348 8.11006 54.3248C8.23299 54.7147 8.45349 55.0667 8.75064 55.3475C9.04779 55.6283 9.41174 55.8286 9.80798 55.9293C10.2042 56.03 10.6196 56.0278 11.0148 55.9229L19.2065 53.5276C20.089 53.3525 21.003 53.429 21.8442 53.7484C26.9694 56.1419 32.7753 56.6482 38.2375 55.1782C43.6998 53.7081 48.4672 50.3561 51.6989 45.7136C54.9305 41.071 56.4186 35.4363 55.9006 29.8035C55.3825 24.1707 52.8917 18.9018 48.8676 14.9265C44.8434 10.9513 39.5446 8.52499 33.9058 8.07582C28.2671 7.62665 22.651 9.18345 18.0483 12.4715C13.4455 15.7596 10.152 20.5677 8.74878 26.0475C7.34557 31.5272 7.92284 37.3265 10.3787 42.4221Z" stroke="var(--color-button-primary-normal)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M25.0156 24.7998C25.5799 23.1957 26.6937 21.8431 28.1597 20.9815C29.6257 20.1199 31.3493 19.805 33.0253 20.0924C34.7013 20.3799 36.2214 21.2512 37.3165 22.5521C38.4116 23.853 39.011 25.4995 39.0085 27.1999C39.0085 32.0002 31.808 34.4004 31.808 34.4004" stroke="var(--color-button-primary-normal)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M32 44.0015H32.0267" stroke="var(--color-button-primary-normal)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            `,
      title: 'Categorized Q&A',
      description:
        'Explore deep answers in different categories wither you are a Muslim or Non-Muslim.',
      cta: 'Explore',
      href: '/question-and-answer/topics',
    },
    {
      icon: `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10.9176 54.4001H53.0823C54.4801 54.4001 55.8207 53.8448 56.8091 52.8564C57.7976 51.8679 58.3529 50.5274 58.3529 49.1295V22.7766C58.3529 21.3787 57.7976 20.0381 56.8091 19.0497C55.8207 18.0613 54.4801 17.506 53.0823 17.506H32.1844C31.3163 17.5015 30.4627 17.2826 29.6996 16.8689C28.9364 16.4551 28.2872 15.8592 27.8098 15.1342L25.6489 11.9719C25.1714 11.2468 24.5223 10.651 23.7591 10.2372C22.9959 9.82344 22.1424 9.60459 21.2743 9.6001H10.9176C9.51971 9.6001 8.17912 10.1554 7.19069 11.1438C6.20226 12.1322 5.64697 13.4728 5.64697 14.8707V49.1295C5.64697 52.0283 8.01874 54.4001 10.9176 54.4001Z" stroke="var(--color-button-primary-normal)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M21.4585 28.0474V38.5885" stroke="var(--color-button-primary-normal)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M32 28.0474V33.318" stroke="var(--color-button-primary-normal)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M42.5415 28.0474V43.8591" stroke="var(--color-button-primary-normal)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`,
      title: 'Courses Academy',
      description:
        'Step-by-step learning journey from ignorance to knowledge.',
      cta: 'Start',
      href: '/academy',
    },
    {
      icon: `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M21.3369 5.34131V16.0049" stroke="var(--color-button-primary-normal)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M42.665 5.34131V16.0049" stroke="var(--color-button-primary-normal)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M50.6616 10.6729H13.3391C10.3944 10.6729 8.00732 13.06 8.00732 16.0046V53.3272C8.00732 56.2718 10.3944 58.659 13.3391 58.659H50.6616C53.6063 58.659 55.9934 56.2718 55.9934 53.3272V16.0046C55.9934 13.06 53.6063 10.6729 50.6616 10.6729Z" stroke="var(--color-button-primary-normal)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M8.00732 26.6685H55.9934" stroke="var(--color-button-primary-normal)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`,
      title: 'Events',
      description:
        'Online & offline sessions with archive access. Join live or watch recordings anytime.',
      cta: 'Join',
      href: '/events',
    },
    {
      icon: `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M31.9998 18.6704V55.9929" stroke="var(--color-button-primary-normal)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M8.00696 47.9953C7.29992 47.9953 6.62184 47.7144 6.12189 47.2144C5.62193 46.7145 5.34106 46.0364 5.34106 45.3294V10.6727C5.34106 9.96569 5.62193 9.28761 6.12189 8.78766C6.62184 8.28771 7.29992 8.00684 8.00696 8.00684H21.3364C24.1646 8.00684 26.8769 9.13032 28.8767 11.1301C30.8765 13.1299 32 15.8423 32 18.6704C32 15.8423 33.1235 13.1299 35.1233 11.1301C37.1231 9.13032 39.8354 8.00684 42.6636 8.00684H55.9931C56.7001 8.00684 57.3782 8.28771 57.8782 8.78766C58.3781 9.28761 58.659 9.96569 58.659 10.6727V45.3294C58.659 46.0364 58.3781 46.7145 57.8782 47.2144C57.3782 47.7144 56.7001 47.9953 55.9931 47.9953H39.9977C37.8766 47.9953 35.8423 48.8379 34.3425 50.3377C32.8426 51.8376 32 53.8718 32 55.9929C32 53.8718 31.1574 51.8376 29.6576 50.3377C28.1577 48.8379 26.1235 47.9953 24.0023 47.9953H8.00696Z" stroke="var(--color-button-primary-normal)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
      title: 'Articles & Resources',
      description:
        'Categorized articles, blogs, research-based content, and real stories.',
      cta: 'Read',
      href: '/resources',
    },
    {
      icon: `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M31.999 21.3364V10.6729H21.3354" stroke="var(--color-button-primary-normal)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M47.9954 21.3364H16.0046C13.06 21.3364 10.6729 23.7235 10.6729 26.6682V47.9954C10.6729 50.94 13.06 53.3272 16.0046 53.3272H47.9954C50.9401 53.3272 53.3272 50.94 53.3272 47.9954V26.6682C53.3272 23.7235 50.9401 21.3364 47.9954 21.3364Z" stroke="var(--color-button-primary-normal)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M5.34082 37.332H10.6742" stroke="var(--color-button-primary-normal)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M53.3262 37.332H58.6595" stroke="var(--color-button-primary-normal)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M39.9971 34.666V39.9993" stroke="var(--color-button-primary-normal)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M24.002 34.666V39.9993" stroke="var(--color-button-primary-normal)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
      title: 'AI Assistant',
      description:
        'Available 24/7 to answer initial questions and direct users to verified scholarly sources.',
      cta: 'Ask AI',
      href: '/question-and-answer/ask-assistant',
    },
    {
      icon: `
      <img src="/icons/icons-40/icons-40-40.png" width="64" height="64" alt="Community icon" />
`,
      title: 'Community',
      description:
        'Connect with scholars, and join groups and discussion rooms with preachers.',
      cta: 'Soon ..',
      status: 'soon',
    },
  ];

  protected eventCards: SharedEventCard[] = [];
  protected currentEventPage = 1;
  protected readonly eventsPerPage = 4;
  protected totalEventPages = 1;
  protected arrowRightIcon = '/icons/icons-24/arrow-right.svg';
  protected arrowLeftIcon = '/icons/icons-24/arrow-left.svg';

  protected readonly imanPillars: PillarItem[] = [
    { number: '1', label: 'Belief in', name: 'Allah' },
    { number: '2', label: 'Belief in', name: 'Angels' },
    { number: '3', label: 'Belief in', name: 'Books' },
    { number: '4', label: 'Belief in', name: 'Messengers' },
    { number: '5', label: 'Belief in', name: 'Judgement Day' },
    { number: '6', label: 'Belief in', name: 'Divine Decree' },
  ];

  protected readonly islamPillars: PillarItem[] = [
    { number: '1', label: 'Testimony of Faith', name: 'Shahada' },
    { number: '2', label: 'Prayer', name: 'Salah' },
    { number: '3', label: 'Charity', name: 'Zakat' },
    { number: '4', label: 'Fasting', name: 'Sawm' },
    { number: '5', label: 'Pilgrimage', name: 'Hajj' },
  ];

  protected readonly serveAudienceCards: readonly ServeAudienceCard[] = [
    { title: 'I’m a Christian', topicTag: 'Christianity' },
    { title: 'I’m a Jew', topicTag: 'Judaism' },
    { title: 'I’m a Polytheist', topicTag: 'Polytheism' },
    { title: 'I’m an Atheist', topicTag: 'Atheism' },
    { title: 'I’m an Agnostic', topicTag: 'General' },
    { title: 'I’m a Seeker', topicTag: 'General' },
    { title: 'I’m a New Muslim', topicTag: 'General' },
    { title: 'I’m a Born Muslim', topicTag: 'General' },
    { title: 'I’m a Woman', topicTag: 'Women' },
  ];

  protected trackByIndex(index: number): number {
    return index;
  }

  private cleanupFns: (() => void)[] = [];
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private bubblesAutoscrollEnabled = false;

  constructor(
    private readonly router: Router,
    private readonly sanitizer: DomSanitizer,
    private readonly eventsService: EventsService,
    protected readonly authService: AuthService,
    private readonly cdr: ChangeDetectorRef,
    private readonly qasService: QasService,
  ) { }

  protected get eventsCtaLabel(): string {
    return this.authService.isAuthenticated() ? 'See All Events' : 'Join for Free';
  }

  protected get eventsCtaLink(): string {
    return this.authService.isAuthenticated() ? '/events' : '/account';
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.loadEventsSection();
      this.loadHeroBubbles();
    }
  }

  private loadHeroBubbles(): void {
    if (!this.isBrowser) {
      return;
    }

    this.qasService.getAll({ pageNumber: 1, pageSize: 50, tags: 'Hero Page Questions' }).subscribe({
      next: (response) => {
        const records = extractArray(response);
        if (records.length > 0) {
          const fetchedBubbles = records
            .map(item => asRecord(item))
            .filter(record => {
              // Fallback client-side filter in case backend ignores the tags parameter
              const categories = toStringArray(getValue(record, 'categories', 'Categories', 'tags', 'Tags'));
              return categories.length === 0 || categories.some(c =>
                c.toLowerCase().includes('hero') ||
                c.toLowerCase().includes('misconception')
              );
            })
            .map(record => {
              const translations = extractArray(getValue(record, 'translations', 'Translations'));
              const firstTranslation = translations.length > 0 ? asRecord(translations[0]) : null;
              return toStringValue(
                firstTranslation ? getValue(firstTranslation, 'questionText', 'questionText', 'question') : undefined,
              ) ?? toStringValue(getValue(record, 'title', 'Title')) ?? '';
            })
            .filter(val => val.trim().length > 0);

          if (fetchedBubbles.length > 0) {
            this.heroBubbles = fetchedBubbles;
            this.cdr.detectChanges();

            // Re-setup bubbles animation if needed for the new elements
            globalThis.setTimeout(() => {
              if (this.heroBubbles.length > 0) {
                this.syncBubblesAnimation(true);
              }
            }, 100);
          }
        }
      },
      error: () => void 0,
    });
  }

  protected isSvgIcon(feature: FeatureCard): boolean {
    return typeof feature.icon === 'string' && feature.icon.trim().startsWith('<svg');
  }

  protected getSanitizedIcon(feature: FeatureCard): SafeHtml | null {
    // Allow SVG strings
    if (this.isSvgIcon(feature)) {
      return this.sanitizer.bypassSecurityTrustHtml(feature.icon);
    }

    // Special-case: allow the 'Community' card to provide an inline <img> markup
    if (
      feature.title === 'Community' &&
      typeof feature.icon === 'string' &&
      feature.icon.trim().startsWith('<img')
    ) {
      return this.sanitizer.bypassSecurityTrustHtml(feature.icon);
    }

    return null;
  }

  protected isUpcoming(dateStr: string | undefined | null): boolean {
    if (!dateStr) return false;
    // Try parsing common date formats; remove stray commas to improve parsing.
    const cleaned = dateStr.replaceAll(',', '').trim();
    const parsed = Date.parse(cleaned);
    const date = Number.isNaN(parsed) ? new Date(cleaned) : new Date(parsed);
    if (Number.isNaN(date.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date.getTime() >= today.getTime();
  }

  protected onSearch(): void {
    const q = (this.searchQuery || '').trim();
    if (!q) {
      return;
    }
    void this.router.navigate(['/question-and-answer/topics'], { queryParams: { question: q } });
  }

  private loadEventsSection(): void {
    const pageNumber = this.currentEventPage;
    const pageSize = this.eventsPerPage;

    this.eventsService.getAll({ pageNumber, pageSize }).subscribe({
      next: (response) => {
        this.eventCards = this.mapEventCards(response);
        this.calculateTotalEventPages(response);
        this.cdr.detectChanges();
      },
      error: () => {
        this.eventCards = [];
        this.cdr.detectChanges();
      },
    });
  }

  private calculateTotalEventPages(response: unknown): void {
    const records = extractArray(response);
    this.totalEventPages = Math.max(1, Math.ceil(records.length / this.eventsPerPage));
  }

  protected goToEventPage(page: number): void {
    if (!Number.isFinite(page)) return;
    this.currentEventPage = Math.min(
      Math.max(page, 1),
      this.totalEventPages,
    );
    this.loadEventsSection();
  }

  protected nextEventPage(): void {
    this.goToEventPage(this.currentEventPage + 1);
  }

  protected prevEventPage(): void {
    this.goToEventPage(this.currentEventPage - 1);
  }

  protected showEventPagination(): boolean {
    return this.totalEventPages > 1;
  }

  private mapEventCards(response: unknown): SharedEventCard[] {
    const records = extractArray(response);
    return records.map((item, index) => this.mapEventCard(item, index));
  }

  private mapEventCard(item: unknown, index: number): SharedEventCard {
    const record = asRecord(item);
    const id = toStringValue(getValue(record, 'id', 'Id')) ?? `event-${index + 1}`;
    const title = toStringValue(getValue(record, 'title', 'Title')) ?? '';
    const description = toStringValue(getValue(record, 'description', 'Description')) ?? '';
    const speakerName = toStringValue(getValue(record, 'speakerName', 'SpeakerName')) ?? '';
    const speakerImage =
      toApiMediaUrl(toStringValue(getValue(record, 'speakerImage', 'SpeakerImage'))) ??
      '/images/profile-picture-navbar.png';
    const speakerRole = toStringValue(getValue(record, 'speakerRole', 'SpeakerRole')) ?? '';
    const image =
      toApiMediaUrl(
        toStringValue(getValue(record, 'imageUrl', 'ImageUrl', 'coverImageUrl', 'CoverImageUrl')),
      ) ??
      '/images/events-image-placeholder.jpg';
    const startDateValue = toStringValue(
      getValue(record, 'startDateTime', 'StartDateTime', 'date', 'Date', 'startDate', 'StartDate', 'eventDate', 'EventDate'),
    );
    const date = formatEventDateDisplay(startDateValue);
    const tags = toStringArray(getValue(record, 'tags', 'Tags', 'categories', 'Categories'));

    return {
      id,
      title,
      description,
      imageUrl: image,
      imageAlt: title,
      speakerName: speakerName,
      speakerImage: speakerImage,
      speakerRole,
      date,
      tags,
      isRecorded: false,
    };
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) {
      return;
    }

    void import('gsap');

    // Setup seamless bubble scrolling animation
    this.syncBubblesAnimation(true);
  }

  /**
   * Setup continuous seamless bubble scrolling animation
   * Only runs on tablet and below screens (768px and below)
   */
  private setupBubblesAnimation(): void {
    if (!this.isBrowser) {
      return;
    }

    // Only animate on tablets and below (max-width: 1199px)
    if (globalThis.innerWidth > 1199) {
      return;
    }

    const track = this.bubblesTrack?.nativeElement;
    if (!track) return;

    // Get the width of one bubble set
    const bubbles = track.querySelectorAll('.suggestion-bubble');
    if (bubbles.length === 0) return;

    // Calculate total width of all bubbles + gaps
    const trackWidth = track.scrollWidth;


    // Create continuous animation using requestAnimationFrame for smooth scrolling
    let currentTranslate = 0;
    let isAnimating = true;

    const animate = (): void => {
      if (!isAnimating) return;

      // Move by a small amount each frame for smooth animation
      currentTranslate -= 0.5;

      // When we've scrolled one full width, reset to 0 for seamless looping
      if (currentTranslate <= -trackWidth) {
        currentTranslate = 0;
      }

      track.style.transform = `translateX(${currentTranslate}px)`;
      track.style.transition = 'none'; // Disable transition for frame-by-frame animation

      globalThis.requestAnimationFrame(animate);
    };

    // Start the animation
    animate();

    // Cleanup function
    this.cleanupFns.push(() => {
      isAnimating = false;
    });
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    this.syncBubblesAnimation(true);
  }

  private syncBubblesAnimation(forceRestart = false): void {
    if (!this.isBrowser) {
      return;
    }

    const shouldAutoscroll = globalThis.innerWidth <= 1199;

    if (!forceRestart && shouldAutoscroll === this.bubblesAutoscrollEnabled) {
      return;
    }

    this.stopBubblesAnimation();
    this.bubblesAutoscrollEnabled = shouldAutoscroll;

    if (shouldAutoscroll) {
      this.setupBubblesAnimation();
    }
  }

  private stopBubblesAnimation(): void {
    for (const cleanup of this.cleanupFns) {
      cleanup();
    }
    this.cleanupFns = [];

    const track = this.bubblesTrack?.nativeElement;
    if (track) {
      track.style.transform = '';
      track.style.transition = '';
    }
  }

  ngOnDestroy(): void {
    this.stopBubblesAnimation();
  }

  /**
   * Scroll the bubbles slider left or right by one bubble
   */
  protected scrollBubbles(direction: 'left' | 'right'): void {
    if (!this.isBrowser) {
      return;
    }

    const container = this.bubblesContainer?.nativeElement;
    if (!container) return;

    // Get the first bubble element to calculate its width
    const firstBubble = container.querySelector('.hero-bubble-slide') as HTMLElement;
    if (!firstBubble) return;

    // Calculate scroll amount: bubble width + gap
    const bubbleWidth = firstBubble.offsetWidth;
    const computedStyle = globalThis.getComputedStyle(container);
    const gap = Number.parseFloat(computedStyle.gap) || 0;
    const scrollAmount = bubbleWidth + gap;

    const currentScroll = container.scrollLeft;
    const targetScroll =
      direction === 'left' ? currentScroll - scrollAmount : currentScroll + scrollAmount;

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    });
  }
}
