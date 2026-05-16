
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { finalize, take } from 'rxjs';
import { NewsletterService } from '../../../core/services/newsletter.service';

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

interface SocialLink {
  icon: string;
  label: string;
  href: string;
  ariaLabel: string;
}

interface AppDownload {
  label: string;
  icon: string;
  text: string;
  href: string;
  qrCode: string;
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule, FormsModule],
  templateUrl: './footer.html',
  styleUrls: ['./footer.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  protected newsletterEmail = '';
  protected isSubscribing = false;
  protected subscriptionMessage: string | null = null;
  protected subscriptionMessageType: 'success' | 'error' | null = null;

  protected readonly currentYear = new Date().getFullYear();
  private readonly newsletterService = inject(NewsletterService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly footerColumns: FooterColumn[] = [
    {
      title: 'Trusted Channels',
      links: [
        {
          label: 'One Message Foundation',
          href: 'https://www.onemessagefoundation.com',
          external: true,
        },
        {
          label: 'One True Message Foundation',
          href: 'https://www.onetruemessage.com/',
          external: true,
        },
        {
          label: 'The Muslim Lantern',
          href: 'https://www.youtube.com/@TheMuslimLantern',
          external: true,
        },
        {
          label: 'Faith TV',
          href: 'https://www.youtube.com/@ImanTV01',
          external: true,
        },
        { label: 'Find More Channels', href: '/channels', external: false },
      ],
    },
    {
      title: 'Ask & Contact',
      links: [
        { label: 'Topics', href: '/question-and-answer/topics', external: false },
        { label: 'Meet Scholar', href: '/question-and-answer/meet-scholar', external: false },
        // { label: 'Forms', href: '/forms', external: false },
        { label: 'Contact', href: '/contact', external: false },
        // { label: 'Our Forms', href: '/forms', external: false },
      ],
    },
  ];

  protected readonly socialLinks: SocialLink[] = [
    {
      icon: '/icons/icons-social-apps/facebook.svg',
      label: String.raw`askamuslimofficial`,
      href: 'https://www.facebook.com/askamuslimofficial',
      ariaLabel: 'Visit our Facebook page',
    },
    {
      icon: '/icons/icons-social-apps/instagram.svg',
      label: String.raw`askamuslim`,
      href: 'https://www.instagram.com/askamuslim',
      ariaLabel: 'Visit our Instagram profile',
    },
    {
      icon: '/icons/icons-social-apps/youtube.svg',
      label: String.raw`askamuslim`,
      href: 'https://www.youtube.com/@AskAMuslim',
      ariaLabel: 'Visit our YouTube channel',
    },
    {
      icon: '/icons/icons-social-apps/threads.svg',
      label: String.raw`askamuslim`,
      href: 'https://www.threads.com/@askamuslim',
      ariaLabel: 'Visit our Threads profile',
    },
    {
      icon: '/icons/icons-social-apps/tiktok.svg',
      label: String.raw`askamuslim`,
      href: 'https://tiktok.com/@askamuslim_',
      ariaLabel: 'Visit our TikTok profile',
    },
    {
      icon: '/icons/icons-24/mail.svg',
      label: 'info@askamuslim.com',
      href: 'mailto:info@askamuslim.com',
      ariaLabel: 'Send us an email',
    },
  ];

  protected readonly appDownloads: AppDownload[] = [
    {
      label: 'App Store',
      icon: '/icons/icons-social-apps/apple.svg',
      text: 'Download on App Store',
      href: '#app-store',
      qrCode: '/footer/qr-code.svg',
    },
    {
      label: 'Google Play',
      icon: '/icons/icons-social-apps/google-play.svg',
      text: 'Get our App from Google Play',
      href: '#google-play',
      qrCode: '/footer/qr-code.svg',
    },
  ];

  protected trackByLabel(index: number, item: FooterLink | SocialLink | AppDownload): string {
    // For social links, use label + href to ensure uniqueness (handles duplicate labels)
    if ('href' in item && 'ariaLabel' in item) {
      return `${item.label}-${item.href}`;
    }
    return item.label ?? `${index}`;
  }

  protected onSubscribe(event: Event): void {
    event.preventDefault();

    if (!this.newsletterEmail.trim() || this.isSubscribing) {
      return;
    }

    this.isSubscribing = true;
    this.subscriptionMessage = null;
    this.subscriptionMessageType = null;
    this.cdr.markForCheck();

    this.newsletterService
      .subscribe(this.newsletterEmail)
      .pipe(
        take(1),
        finalize(() => {
          this.isSubscribing = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe((result) => {
        this.subscriptionMessage = result.message;
        this.subscriptionMessageType = result.success ? 'success' : 'error';

        if (result.success) {
          this.newsletterEmail = '';
        }

        this.cdr.markForCheck();
      });
  }
}
