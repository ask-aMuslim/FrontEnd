import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy } from '@angular/core';
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
  description: string;
  image: string;
  speaker: string;
  speakerRole: string;
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
      icon: '/icons/icons 40/Property 1=articles.svg',
      title: 'Categorized Q&A',
      description: 'Browse thousands of carefully answered questions, filtered by topic, scholar, and language so you find guidance faster.',
      cta: 'Explore',
      href: '/ask-and-contact',
    },
    {
      icon: '/icons/icons 40/Property 1=roadmap.svg',
      title: 'Courses Roadmap',
      description: 'Structured learning paths for new Muslims and lifelong students to strengthen faith step-by-step.',
      cta: 'Start',
      href: '/roadmap',
    },
    {
      icon: '/icons/icons 40/Property 1=calendar.svg',
      title: 'Events',
      description: 'Join online & offline sessions with scholars worldwide, covering hot topics, fiqh, and community building.',
      cta: 'Join a session',
      href: '/events',
    },
    {
      icon: '/icons/icons 40/Property 1=articles.svg',
      title: 'Articles & Resources',
      description: 'Curated articles, e-books, and toolkits reviewed by our research team to deepen your understanding.',
      cta: 'Read',
      href: '/ask-and-contact',
    },
    {
      icon: '/icons/icons 40/Property 1=ai.svg',
      title: 'AI Assistant',
      description: 'Ask faith-related questions 24/7 and get verified summaries backed by authentic sources.',
      cta: 'Ask AI',
      href: '/ask-and-contact',
    },
    {
      icon: '/icons/icons 40/Property 1=community.svg',
      title: 'Community',
      description: 'Connect with vibrant global circles, group studies, and mentorship programs launching soon.',
      cta: 'Soon',
      status: 'soon',
    },
  ];

  protected readonly eventCards: EventCard[] = [
    {
      date: '29 December, 2025',
      tag: 'Oxford Union | London, UK',
      title: 'Mehdi Hasan | Islam Is A Peaceful Religion',
      description:
        'The motion debates what “This House” believes. Mehdi Hasan shares the framework for Muslims to respond to misconceptions.',
      image: '/Images/Events Picture.png',
      speaker: 'Mehdi Hasan',
      speakerRole: 'Host @ American Broadcast',
    },
    {
      date: '19 October, 2025',
      tag: 'Global Livestream',
      title: 'Islam & Compassion – Live Q&A with Scholars',
      description:
        'An open session addressing faith, family life, and civic responsibilities with live moderation and resources shared.',
      image: '/Images/Events Picture.png',
      speaker: 'Mehdi Hasan',
      speakerRole: 'Host @ American Broadcast',
    },
    {
      date: '03 November, 2025',
      tag: 'Oxford Union | London, UK',
      title: 'Understanding the Quranic Worldview',
      description:
        'A scholar-guided walk through Makkan and Madinan revelations, focusing on mercy, justice, and spiritual discipline.',
      image: '/Images/Events Picture.png',
      speaker: 'Mehdi Hasan',
      speakerRole: 'Host @ American Broadcast',
    },
    {
      date: '12 December, 2025',
      tag: 'Hybrid Workshop',
      title: 'Community Building & Dawah Essentials',
      description:
        'Practical tips to serve local communities, nurture better questions, and invite others with empathy.',
      image: '/Images/Events Picture.png',
      speaker: 'Mehdi Hasan',
      speakerRole: 'Host @ American Broadcast',
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
    '“Grab a pen & paper, and list down whatever questions you thought of. After that, go to the scholars of your religion and get the answers of your list, then go to the nearest mosque and ask for a scholar to answer your same list.”';

  protected trackByIndex(index: number): number {
    return index;
  }

  private cleanupFns: (() => void)[] = [];

  constructor(private readonly host: ElementRef<HTMLElement>, private readonly router: Router) { }

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
      const heroSection = this.host.nativeElement.querySelector<HTMLElement>('.hero-section');
      if (!heroSection) {
        return;
      }

      const bubbles = Array.from(heroSection.querySelectorAll<HTMLElement>('.hero-bubble'));
      if (bubbles.length === 0) {
        return;
      }

      const magnet = (event: MouseEvent) => {
        const heroRect = heroSection.getBoundingClientRect();
        const { clientX, clientY } = event;

        // Only apply effect when mouse is within hero section bounds
        if (
          clientX < heroRect.left ||
          clientX > heroRect.right ||
          clientY < heroRect.top ||
          clientY > heroRect.bottom
        ) {
          return;
        }

        for (const [index, bubble] of bubbles.entries()) {
          const rect = bubble.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const deltaX = clientX - centerX;
          const deltaY = clientY - centerY;
          const distance = Math.hypot(deltaX, deltaY) || 1;
          const strength = Math.min(120 / distance, 1);
          const offsetX = deltaX * strength * 0.35;
          const offsetY = deltaY * strength * 0.35;

          gsap.to(bubble, {
            x: offsetX,
            y: offsetY,
            duration: 0.5,
            ease: 'power2.out',
            overwrite: 'auto',
          });
        }
      };

      const reset = () => {
        gsap.to(bubbles, {
          x: 0,
          y: 0,
          duration: 1,
          ease: 'elastic.out(1, 0.5)',
          overwrite: 'auto',
        });
      };

      // Listen on document to capture mouse events even over pointer-events: none areas
      document.addEventListener('mousemove', magnet);
      heroSection.addEventListener('mouseleave', reset);

      this.cleanupFns.push(() => {
        document.removeEventListener('mousemove', magnet);
        heroSection.removeEventListener('mouseleave', reset);
      });
    });
  }

  ngOnDestroy(): void {
    for (const cleanup of this.cleanupFns) {
      cleanup();
    }
    this.cleanupFns = [];
  }
}
