import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

interface SocialLink {
  icon: string;
  label: string;
  href: string;
}

interface StoreBadge {
  icon: string;
  title: string;
  subtitle: string;
  href: string;
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  protected readonly footerColumns: FooterColumn[] = [
    {
      title: 'Trusted Channels',
      links: [
        { label: 'One Message Foundation', href: '#' },
        { label: 'One True Message Foundation', href: '#' },
        { label: 'The Muslim Lantern', href: '#' },
        { label: 'IMAN TV', href: '#' },
        { label: 'Find More Channels', href: '#' },
      ],
    },
    {
      title: 'Ask & Contact',
      links: [
        { label: 'Ask', href: '/ask-and-contact' },
        { label: 'Virtual Assistant', href: '/ask-and-contact' },
        { label: 'Email your Inquiry', href: '/ask-and-contact' },
        { label: 'Talk to a Scholar', href: '/ask-and-contact' },
      ],
    },
  ];

  protected readonly socialLinks: SocialLink[] = [
    { icon: '/icons/icons social apps/Property 1=facebook.svg', label: 'Facebook', href: 'https://www.facebook.com/askamuslimofficial/' },
    { icon: '/icons/icons social apps/Property 1=youtube.svg', label: 'YouTube', href: 'https://www.youtube.com/AskAMuslim' },
    { icon: '/icons/icons social apps/Property 1=instagram.svg', label: 'Instagram', href: 'https://www.instagram.com/askamuslim/' },
  ];

  protected readonly storeBadges: StoreBadge[] = [
    {
      icon: '/icons/icons social apps/Property 1=apple.svg',
      title: 'Download on the',
      subtitle: 'App Store',
      href: '#',
    },
    {
      icon: '/icons/icons social apps/Property 1=google play.svg',
      title: 'Get it on',
      subtitle: 'Google Play',
      href: '#',
    },
  ];

  protected trackByLabel(index: number, item: FooterLink | SocialLink | StoreBadge): string {
    if ('label' in item) {
      return item.label;
    }
    if ('subtitle' in item) {
      return `${item.title}-${item.subtitle}`;
    }
    return `${index}`;
  }
}
