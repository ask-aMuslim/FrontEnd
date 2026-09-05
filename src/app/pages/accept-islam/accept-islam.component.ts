import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-accept-islam',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './accept-islam.component.html',
  styleUrls: ['./accept-islam.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcceptIslamComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly seoService = inject(SeoService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // External URLs & Assets
  readonly newMuslimFormUrl = 'https://www.noorohio.org/newmuslims/';
  readonly noorCenterUrl = 'https://www.noorohio.org';
  readonly shahadaAudioUrl = '/audio/shahada.mp3';

  // Step Texts
  readonly stepOneEnglish =
    'I testify that there is no one worthy of worship except Allah, and I testify that Muhammad is the Messenger of Allah.';

  readonly stepTwoArabic =
    'أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللهِ';

  readonly stepTwoTransliteration =
    'Ash-hadu an la ilaha illa-Allah, wa ash-hadu anna Muhammadan Rasul-Allah';

  // UI state signals
  readonly copiedStep = signal<number | null>(null);
  readonly isPlayingAudio = signal<boolean>(false);

  private copyTimeout: ReturnType<typeof globalThis.setTimeout> | null = null;
  private audioPlayer: HTMLAudioElement | null = null;

  ngOnInit(): void {
    this.setupSeo();
  }

  ngOnDestroy(): void {
    this.stopAudio();
    if (this.copyTimeout) {
      globalThis.clearTimeout(this.copyTimeout);
    }
  }

  private setupSeo(): void {
    this.seoService.setMetaTags({
      title: 'How to Become Muslim',
      description:
        'Accepting Islam is simple. Learn how to take your Shahada (declaration of faith) step-by-step, find local Muslim communities, and access dedicated resources for new Muslims.',
      keywords: [
        'How to Become Muslim',
        'Accept Islam',
        'Shahada',
        'Declaration of Faith',
        'Convert to Islam',
        'Revert to Islam',
        'New Muslim Guide',
        'Ask A Muslim',
      ],
      ogType: 'article',
    });
  }

  goBack(): void {
    const win = this.document.defaultView;
    if (this.isBrowser && win && win.history && win.history.length > 1) {
      win.history.back();
    } else {
      this.router.navigate(['/resources']);
    }
  }

  async copyStepText(text: string, stepNumber: number): Promise<void> {
    if (!this.isBrowser) return;

    const nav = globalThis.navigator;
    try {
      if (nav && nav.clipboard && nav.clipboard.writeText) {
        await nav.clipboard.writeText(text);
      } else {
        const textarea = this.document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        this.document.body.appendChild(textarea);
        textarea.select();
        this.document.execCommand('copy');
        this.document.body.removeChild(textarea);
      }

      this.copiedStep.set(stepNumber);

      if (this.copyTimeout) {
        globalThis.clearTimeout(this.copyTimeout);
      }
      this.copyTimeout = globalThis.setTimeout(() => {
        this.copiedStep.set(null);
      }, 2500);
    } catch {
      // Graceful copy fallback
    }
  }

  toggleShahadaAudio(): void {
    if (!this.isBrowser) return;

    if (this.isPlayingAudio()) {
      this.stopAudio();
      return;
    }

    if (!this.audioPlayer && typeof globalThis.Audio !== 'undefined') {
      this.audioPlayer = new globalThis.Audio(this.shahadaAudioUrl);

      this.audioPlayer.addEventListener('ended', () => {
        this.isPlayingAudio.set(false);
      });

      this.audioPlayer.addEventListener('pause', () => {
        this.isPlayingAudio.set(false);
      });

      this.audioPlayer.addEventListener('error', () => {
        this.isPlayingAudio.set(false);
      });
    }

    if (!this.audioPlayer) {
      return;
    }

    this.audioPlayer.currentTime = 0;
    this.audioPlayer
      .play()
      .then(() => {
        this.isPlayingAudio.set(true);
      })
      .catch(() => {
        this.isPlayingAudio.set(false);
      });
  }

  private stopAudio(): void {
    if (this.audioPlayer) {
      this.audioPlayer.pause();
      this.audioPlayer.currentTime = 0;
    }
    this.isPlayingAudio.set(false);
  }
}
