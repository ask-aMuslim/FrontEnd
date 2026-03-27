
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

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
  imports: [RouterModule],
  templateUrl: './footer.html',
  styleUrls: ['./footer.scss'],
})
export class Footer {
  protected readonly currentYear = new Date().getFullYear();

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
          label: 'IMAN TV',
          href: 'https://www.youtube.com/@ImanTV01',
          external: true,
        },
        { label: 'Find More Channels', href: '/channels', external: false },
      ],
    },
    {
      title: 'Ask & Contact',
      links: [
        { label: 'Topics', href: '/ask-and-contact/ask-qa', external: false },
        { label: 'Meet Scholar', href: '/ask-and-contact/meet-scholar', external: false },
        { label: 'Contact', href: '/contact', external: false },
      ],
    },
  ];

  protected readonly socialLinks: SocialLink[] = [
    {
      icon: '/icons/icons-social-apps/facebook.svg',
      label: '\\askamuslimofficial',
      href: 'https://www.facebook.com/askamuslimofficial',
      ariaLabel: 'Visit our Facebook page',
    },
    {
      icon: '/icons/icons-social-apps/instagram.svg',
      label: '\\askamuslim',
      href: 'https://www.instagram.com/askamuslim',
      ariaLabel: 'Visit our Instagram profile',
    },
    {
      icon: '/icons/icons-social-apps/youtube.svg',
      label: '\\askamuslim',
      href: 'https://www.youtube.com/@AskAMuslim',
      ariaLabel: 'Visit our YouTube channel',
    },
    {
      icon: '/icons/icons-social-apps/threads.svg',
      label: '\\askamuslim',
      href: 'https://www.threads.com/@askamuslim',
      ariaLabel: 'Visit our Threads profile',
    },
    {
      icon: '/icons/icons-social-apps/tiktok.svg',
      label: '\\askamuslim_',
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
    const form = event.target as HTMLFormElement | null;
    const emailInput = form?.querySelector<HTMLInputElement>('#footer-email');

    if (!emailInput?.checkValidity()) {
      emailInput?.reportValidity();
      return;
    }

    emailInput.value = '';
  }
}
