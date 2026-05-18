import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';

interface ImpactCard {
  title: string;
  description: string;
  iconType: 'dawah' | 'quran' | 'academy';
}

interface TrustBadge {
  title: string;
  description: string;
  iconType: 'security' | 'fee' | 'tax';
}

@Component({
  selector: 'app-donation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './donation.component.html',
  styleUrl: './donation.component.scss'
})
export class DonationComponent implements OnInit {
  protected loadingIframe = true;

  protected readonly impactCards: readonly ImpactCard[] = [
    {
      title: 'Global Dawah Outreach',
      description: 'Support street dawah tables, public billboards, online campaigns, and trained Da\'ees who share the message of Islam.',
      iconType: 'dawah'
    },
    {
      title: 'Free Quran Distribution',
      description: 'Fund the printing, packaging, and global shipment of English translations of the Holy Quran to curious seekers.',
      iconType: 'quran'
    },
    {
      title: 'Ask A Muslim Academy',
      description: 'Power our educational platform, supporting the creation of structured courses, student portals, and digital learning tools.',
      iconType: 'academy'
    }
  ];

  protected readonly trustBadges: readonly TrustBadge[] = [
    {
      title: '100% Secure Checkout',
      description: 'Your payment is fully encrypted and securely processed by Zeffy using industry-standard PCI-compliant gateways.',
      iconType: 'security'
    },
    {
      title: '0% Platform Fees',
      description: 'We use Zeffy because they charge 0% fees, ensuring 100% of your generous donation goes directly to our dawah initiatives.',
      iconType: 'fee'
    },
    {
      title: '501(c)(3) Tax Deductible',
      description: 'Ask A Muslim is a registered non-profit organization. Your donations are tax-deductible to the full extent of the law.',
      iconType: 'tax'
    }
  ];

  constructor(
    private titleService: Title,
    private metaService: Meta,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Set premium SEO headers
    this.titleService.setTitle('Donate to Ask A Muslim | Support Global Dawah');
    
    this.metaService.updateTag({ 
      name: 'description', 
      content: 'Your generous donations support free Quran distribution, academic courses, public dawah tables, and digital outreach. 100% secure, tax-deductible, and fee-free.' 
    });
    this.metaService.updateTag({ 
      name: 'keywords', 
      content: 'donate ask a muslim, islamic charity, support dawah, free quran distribution, tax deductible donation islam' 
    });
    
    // Open Graph SEO tags
    this.metaService.updateTag({ property: 'og:title', content: 'Donate to Ask A Muslim | Support Global Dawah' });
    this.metaService.updateTag({ property: 'og:description', content: 'Help us print and distribute free Qurans, train Da\'ees, and share the message of Islam globally. 100% of your donation goes directly to the cause.' });
    this.metaService.updateTag({ property: 'og:type', content: 'website' });
  }

  protected onIframeLoad(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadingIframe = false;
    }
  }
}
