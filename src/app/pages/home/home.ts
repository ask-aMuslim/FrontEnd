import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface HeroStat {
  value: string;
  label: string;
}

interface FeatureCard {
  icon: string;
  title: string;
  description: string;
  cta: string;
  href?: string;
  status?: 'soon';
}

interface EventCard {
  date: string;
  tag: string;
  title: string;
  bullets: string[];
  image: string;
  speaker: string;
  speakerRole: string;
  videoUrl: string;
}

interface PillarItem {
  number: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements AfterViewInit, OnDestroy {
  protected readonly Math = Math;
  protected searchQuery = '';
  protected readonly heroStats: HeroStat[] = [
    { value: '13,000+', label: 'Answered Questions' },
    { value: '250+ ', label: 'Scholars & Teachers' },
  ];

  protected readonly heroBubbles: string[] = [
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
            <path d="M10.3787 42.4221C10.7317 43.3124 10.8102 44.2878 10.6043 45.2231L8.0482 53.1195C7.96583 53.52 7.98713 53.9348 8.11006 54.3248C8.23299 54.7147 8.45349 55.0667 8.75064 55.3475C9.04779 55.6283 9.41174 55.8286 9.80798 55.9293C10.2042 56.03 10.6196 56.0278 11.0148 55.9229L19.2065 53.5276C20.089 53.3525 21.003 53.429 21.8442 53.7484C26.9694 56.1419 32.7753 56.6482 38.2375 55.1782C43.6998 53.7081 48.4672 50.3561 51.6989 45.7136C54.9305 41.071 56.4186 35.4363 55.9006 29.8035C55.3825 24.1707 52.8917 18.9018 48.8676 14.9265C44.8434 10.9513 39.5446 8.52499 33.9058 8.07582C28.2671 7.62665 22.651 9.18345 18.0483 12.4715C13.4455 15.7596 10.152 20.5677 8.74878 26.0475C7.34557 31.5272 7.92284 37.3265 10.3787 42.4221Z" stroke="var(--special-primary)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M25.0156 24.7998C25.5799 23.1957 26.6937 21.8431 28.1597 20.9815C29.6257 20.1199 31.3493 19.805 33.0253 20.0924C34.7013 20.3799 36.2214 21.2512 37.3165 22.5521C38.4116 23.853 39.011 25.4995 39.0085 27.1999C39.0085 32.0002 31.808 34.4004 31.808 34.4004" stroke="var(--special-primary)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M32 44.0015H32.0267" stroke="var(--special-primary)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            `,
      title: 'Categorized Q&A',
      description: 'Browse thousands of carefully answered questions, filtered by topic, scholar, and language so you find guidance faster.',
      cta: 'Explore',
      href: '/ask-and-contact',
    },
    {
      icon: `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10.9176 54.4001H53.0823C54.4801 54.4001 55.8207 53.8448 56.8091 52.8564C57.7976 51.8679 58.3529 50.5274 58.3529 49.1295V22.7766C58.3529 21.3787 57.7976 20.0381 56.8091 19.0497C55.8207 18.0613 54.4801 17.506 53.0823 17.506H32.1844C31.3163 17.5015 30.4627 17.2826 29.6996 16.8689C28.9364 16.4551 28.2872 15.8592 27.8098 15.1342L25.6489 11.9719C25.1714 11.2468 24.5223 10.651 23.7591 10.2372C22.9959 9.82344 22.1424 9.60459 21.2743 9.6001H10.9176C9.51971 9.6001 8.17912 10.1554 7.19069 11.1438C6.20226 12.1322 5.64697 13.4728 5.64697 14.8707V49.1295C5.64697 52.0283 8.01874 54.4001 10.9176 54.4001Z" stroke="var(--special-primary)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M21.4585 28.0474V38.5885" stroke="var(--special-primary)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M32 28.0474V33.318" stroke="var(--special-primary)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M42.5415 28.0474V43.8591" stroke="var(--special-primary)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`,
      title: 'Courses Roadmap',
      description: 'Structured learning paths for new Muslims and lifelong students to strengthen faith step-by-step.',
      cta: 'Start',
      href: '/roadmap',
    },
    {
      icon: `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M21.3369 5.34131V16.0049" stroke="var(--special-primary)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M42.665 5.34131V16.0049" stroke="var(--special-primary)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M50.6616 10.6729H13.3391C10.3944 10.6729 8.00732 13.06 8.00732 16.0046V53.3272C8.00732 56.2718 10.3944 58.659 13.3391 58.659H50.6616C53.6063 58.659 55.9934 56.2718 55.9934 53.3272V16.0046C55.9934 13.06 53.6063 10.6729 50.6616 10.6729Z" stroke="var(--special-primary)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M8.00732 26.6685H55.9934" stroke="var(--special-primary)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`,
      title: 'Events',
      description: 'Join online & offline sessions with scholars worldwide, covering hot topics, fiqh, and community building.',
      cta: 'Join a session',
      href: '/events',
    },
    {
      icon: `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M31.9998 18.6704V55.9929" stroke="var(--special-primary)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M8.00696 47.9953C7.29992 47.9953 6.62184 47.7144 6.12189 47.2144C5.62193 46.7145 5.34106 46.0364 5.34106 45.3294V10.6727C5.34106 9.96569 5.62193 9.28761 6.12189 8.78766C6.62184 8.28771 7.29992 8.00684 8.00696 8.00684H21.3364C24.1646 8.00684 26.8769 9.13032 28.8767 11.1301C30.8765 13.1299 32 15.8423 32 18.6704C32 15.8423 33.1235 13.1299 35.1233 11.1301C37.1231 9.13032 39.8354 8.00684 42.6636 8.00684H55.9931C56.7001 8.00684 57.3782 8.28771 57.8782 8.78766C58.3781 9.28761 58.659 9.96569 58.659 10.6727V45.3294C58.659 46.0364 58.3781 46.7145 57.8782 47.2144C57.3782 47.7144 56.7001 47.9953 55.9931 47.9953H39.9977C37.8766 47.9953 35.8423 48.8379 34.3425 50.3377C32.8426 51.8376 32 53.8718 32 55.9929C32 53.8718 31.1574 51.8376 29.6576 50.3377C28.1577 48.8379 26.1235 47.9953 24.0023 47.9953H8.00696Z" stroke="var(--special-primary)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
      title: 'Articles & Resources',
      description: 'Curated articles, e-books, and toolkits reviewed by our research team to deepen your understanding.',
      cta: 'Read',
      href: '/ask-and-contact',
    },
    {
      icon: `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M31.999 21.3364V10.6729H21.3354" stroke="var(--special-primary)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M47.9954 21.3364H16.0046C13.06 21.3364 10.6729 23.7235 10.6729 26.6682V47.9954C10.6729 50.94 13.06 53.3272 16.0046 53.3272H47.9954C50.9401 53.3272 53.3272 50.94 53.3272 47.9954V26.6682C53.3272 23.7235 50.9401 21.3364 47.9954 21.3364Z" stroke="var(--special-primary)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M5.34082 37.332H10.6742" stroke="var(--special-primary)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M53.3262 37.332H58.6595" stroke="var(--special-primary)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M39.9971 34.666V39.9993" stroke="var(--special-primary)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M24.002 34.666V39.9993" stroke="var(--special-primary)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
      title: 'AI Assistant',
      description: 'Ask faith-related questions 24/7 and get verified summaries backed by authentic sources.',
      cta: 'Ask AI',
      href: '/ask-and-contact',
    },
    {
      icon: `
      <img src="icons/icons 40/icons 40_40.png" style="width:64px; height:64px;" alt="Community icon" /> 
`,
      title: 'Community',
      description: 'Connect with vibrant global circles, group studies, and mentorship programs launching soon.',
      cta: 'Soon',
      status: 'soon',
    },
  ];

  protected readonly eventCards: EventCard[] = [
    {
      date: '29 December, 2025',
      tag: 'Oxford Union',
      title: 'Mehdi Hasan | Islam Is A Peaceful Religion | Oxford Union',
      bullets: [
        'The motion debated was "This House Believes Islam Is A Religion Of Peace."',
        'Hasan was speaking for the affirmative side (i.e. defending Islam as a peaceful religion) against opponents who argued Islam is inherently violent or more violent than other religions.',
        'The debate took place shortly after a violent incident (the Woolwich killing) which heightened sensitivity around Islam and violence.',
      ],
      image: '/Images/Events Picture.png',
      speaker: 'Mehdi Hasan',
      speakerRole: 'Indian-American broadcas...',
      videoUrl: 'https://www.youtube.com/watch?v=example2',
    },
    {
      date: '20 October, 2025',
      tag: 'Oxford Union',
      title: 'Mehdi Hasan | Islam Is A Peaceful Religion | Oxford Union',
      bullets: [
        'The motion debated was "This House Believes Islam Is A Religion Of Peace."',
        'Hasan was speaking for the affirmative side (i.e. defending Islam as a peaceful religion) against opponents who argued Islam is inherently violent or more violent than other religions.',
        'The debate took place shortly after a violent incident (the Woolwich killing) which heightened sensitivity around Islam and violence.',
      ],
      image: '/Images/Events Picture.png',
      speaker: 'Mehdi Hasan',
      speakerRole: 'Indian-American broadcas...',
      videoUrl: 'https://www.youtube.com/watch?v=example3',
    },
    {
      date: '20 October, 2025',
      tag: 'Oxford Union',
      title: 'Mehdi Hasan | Islam Is A Peaceful Religion | Oxford Union',
      bullets: [
        'The motion debated was "This House Believes Islam Is A Religion Of Peace."',
        'Hasan was speaking for the affirmative side (i.e. defending Islam as a peaceful religion) against opponents who argued Islam is inherently violent or more violent than other religions.',
        'The debate took place shortly after a violent incident (the Woolwich killing) which heightened sensitivity around Islam and violence.',
      ],
      image: '/Images/Events Picture.png',
      speaker: 'Mehdi Hasan',
      speakerRole: 'Indian-American broadcas...',
      videoUrl: 'https://www.youtube.com/watch?v=example1',
    },
    {
      date: '20 October, 2025',
      tag: 'Oxford Union',
      title: 'Mehdi Hasan | Islam Is A Peaceful Religion | Oxford Union',
      bullets: [
        'The motion debated was "This House Believes Islam Is A Religion Of Peace."',
        'Hasan was speaking for the affirmative side (i.e. defending Islam as a peaceful religion) against opponents who argued Islam is inherently violent or more violent than other religions.',
        'The debate took place shortly after a violent incident (the Woolwich killing) which heightened sensitivity around Islam and violence.',
      ],
      image: '/Images/Events Picture.png',
      speaker: 'Mehdi Hasan',
      speakerRole: 'Indian-American broadcas...',
      videoUrl: 'https://www.youtube.com/watch?v=example4',
    },
  ];

  protected readonly pillars: PillarItem[] = [
    { number: '1', title: 'Shahada – Testimony of Faith', description: 'Declaring there is no god but Allah, and Muhammad is His messenger.' },
    { number: '2', title: 'Salah – Prayer', description: 'Performing five daily prayers to stay connected with Allah.' },
    { number: '3', title: 'Zakat – Charity', description: 'Purifying wealth by giving a share to those in need.' },
    { number: '4', title: 'Sawm – Fasting', description: 'Fasting during Ramadan to develop gratitude and self-discipline.' },
    { number: '5', title: 'Hajj – Pilgrimage', description: 'The pilgrimage to Makkah once in a lifetime if financially and physically able.' },
  ];

  protected readonly adviceQuote =
    `“Grab a pen & paper, and list down whatever questions you thought of.
    After that, go to the scholars of your religion and get the answers of your list, then go to the nearest mosque and ask for a scholar to answer your same list.”`;
  protected trackByIndex(index: number): number {
    return index;
  }

  private cleanupFns: (() => void)[] = [];

  constructor(
    private readonly host: ElementRef<HTMLElement>,
    private readonly router: Router,
    private readonly sanitizer: DomSanitizer,
  ) { }

  protected isSvgIcon(feature: FeatureCard): boolean {
    return typeof feature.icon === 'string' && feature.icon.trim().startsWith('<svg');
  }

  protected getSanitizedIcon(feature: FeatureCard): SafeHtml | null {
    // Allow SVG strings
    if (this.isSvgIcon(feature)) {
      return this.sanitizer.bypassSecurityTrustHtml(feature.icon as string);
    }

    // Special-case: allow the 'Community' card to provide an inline <img> markup
    if (feature.title === 'Community' && typeof feature.icon === 'string' && feature.icon.trim().startsWith('<img')) {
      return this.sanitizer.bypassSecurityTrustHtml(feature.icon as string);
    }

    return null;
  }

  protected isUpcoming(dateStr: string | undefined | null): boolean {
    if (!dateStr) return false;
    // Try parsing common date formats; remove stray commas to improve parsing.
    const cleaned = dateStr.replace(/,/g, '').trim();
    const parsed = Date.parse(cleaned);
    const date = isNaN(parsed) ? new Date(cleaned) : new Date(parsed);
    if (isNaN(date.getTime())) return false;
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
    void this.router.navigate(['/ask-and-contact'], { queryParams: { question: q } });
  }

  ngAfterViewInit(): void {
    if (globalThis.window === undefined) {
      return;
    }

    void import('gsap').then(({ gsap }) => {
      // const heroSection = this.host.nativeElement.querySelector<HTMLElement>('.hero-section');
      // if (!heroSection) {
      //   return;
      // }

      // const bubbles = Array.from(heroSection.querySelectorAll<HTMLElement>('.hero-bubble'));
      // if (bubbles.length === 0) {
      //   return;
      // }

      // const magnet = (event: MouseEvent) => {
      //   const heroRect = heroSection.getBoundingClientRect();
      //   const { clientX, clientY } = event;

      //   // Only apply effect when mouse is within hero section bounds
      //   if (
      //     clientX < heroRect.left ||
      //     clientX > heroRect.right ||
      //     clientY < heroRect.top ||
      //     clientY > heroRect.bottom
      //   ) {
      //     return;
      //   }

      //   for (const [index, bubble] of bubbles.entries()) {
      //     const rect = bubble.getBoundingClientRect();
      //     const centerX = rect.left + rect.width / 2;
      //     const centerY = rect.top + rect.height / 2;
      //     const deltaX = clientX - centerX;
      //     const deltaY = clientY - centerY;
      //     const distance = Math.hypot(deltaX, deltaY) || 1;
      //     const strength = Math.min(120 / distance, 1);
      //     const offsetX = deltaX * strength * 0.35;
      //     const offsetY = deltaY * strength * 0.35;

      //     gsap.to(bubble, {
      //       x: offsetX,
      //       y: offsetY,
      //       duration: 0.5,
      //       ease: 'power2.out',
      //       overwrite: 'auto',
      //     });
      //   }
      // };

      // const reset = () => {
      //   gsap.to(bubbles, {
      //     x: 0,
      //     y: 0,
      //     duration: 1,
      //     ease: 'elastic.out(1, 0.5)',
      //     overwrite: 'auto',
      //   });
      // };

      // // Listen on document to capture mouse events even over pointer-events: none areas
      // document.addEventListener('mousemove', magnet);
      // heroSection.addEventListener('mouseleave', reset);

      // this.cleanupFns.push(() => {
      //   document.removeEventListener('mousemove', magnet);
      //   heroSection.removeEventListener('mouseleave', reset);
      // });
    });
  }

  ngOnDestroy(): void {
    for (const cleanup of this.cleanupFns) {
      cleanup();
    }
    this.cleanupFns = [];
  }
}
