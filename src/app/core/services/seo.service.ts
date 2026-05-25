import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

export interface SeoConfig {
  title: string;
  description: string;
  keywords?: string[];
  author?: string;
  ogImage?: string;
  ogType?: string;
  canonicalUrl?: string;
  schemas?: object[];
}

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly defaultTitle = 'AskAMuslim - Learn About Islam, Ask Questions & Locate Mosques';
  private readonly defaultDesc = 'Your modern, welcoming platform to learn about Islam, ask questions, find nearby mosques, and connect with scholars. Reliable and credible Islamic knowledge.';
  private readonly defaultKeywords = ['Islam', 'Ask A Muslim', 'Islamic knowledge', 'find mosque', 'prayer times', 'Islamic Q&A', 'learn Islam'];
  private readonly defaultAuthor = 'AskAMuslim';
  private readonly baseSiteUrl = 'https://askamuslim.com';
  private readonly defaultOgImage = 'https://askamuslim.com/ask-a-muslim-logo.png';

  /**
   * Set metadata and schema tags dynamically for the current page
   */
  setMetaTags(config: SeoConfig): void {
    const title = config.title ? `${config.title} | AskAMuslim` : this.defaultTitle;
    const description = config.description || this.defaultDesc;
    const keywords = config.keywords || this.defaultKeywords;
    const author = config.author || this.defaultAuthor;
    const ogImage = config.ogImage || this.defaultOgImage;
    const ogType = config.ogType || 'website';
    
    // Resolve dynamic canonical URL or get current path
    let canonical = config.canonicalUrl;
    if (!canonical && isPlatformBrowser(this.platformId)) {
      canonical = this.document.location.origin + this.document.location.pathname;
    } else if (!canonical) {
      canonical = this.baseSiteUrl;
    }

    // 1. Set Page Title
    this.titleService.setTitle(title);

    // 2. Set Standard Meta Tags
    this.metaService.updateTag({ name: 'description', content: description });
    this.metaService.updateTag({ name: 'keywords', content: keywords.join(', ') });
    this.metaService.updateTag({ name: 'author', content: author });
    this.metaService.updateTag({ name: 'robots', content: 'index, follow' });

    // 3. Set Open Graph (OG) Tags
    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({ property: 'og:description', content: description });
    this.metaService.updateTag({ property: 'og:image', content: ogImage });
    this.metaService.updateTag({ property: 'og:url', content: canonical });
    this.metaService.updateTag({ property: 'og:type', content: ogType });
    this.metaService.updateTag({ property: 'og:site_name', content: 'AskAMuslim' });

    // 4. Set Twitter Card Tags
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: title });
    this.metaService.updateTag({ name: 'twitter:description', content: description });
    this.metaService.updateTag({ name: 'twitter:image', content: ogImage });

    // 5. Update Canonical Tag
    this.updateCanonicalLink(canonical);

    // 6. Set Structured Data (JSON-LD Schema)
    if (config.schemas && config.schemas.length > 0) {
      this.injectJsonLd(config.schemas);
    } else {
      this.clearJsonLd();
    }
  }

  /**
   * Helper to update the <link rel="canonical"> element
   */
  private updateCanonicalLink(url: string): void {
    let link: HTMLLinkElement | null = this.document.querySelector("link[rel='canonical']");
    if (link) {
      link.setAttribute('href', url);
    } else {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', url);
      this.document.head.appendChild(link);
    }
  }

  /**
   * Inject schema array into a <script type="application/ld+json"> tag
   */
  private injectJsonLd(schemas: object[]): void {
    this.clearJsonLd();

    const script = this.document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute('id', 'seo-json-ld');
    
    // We can inject multiple schemas as a single JSON array or @graph
    const graph = {
      '@context': 'https://schema.org',
      '@graph': schemas,
    };
    
    script.text = JSON.stringify(graph);
    this.document.head.appendChild(script);
  }

  /**
   * Clear any existing dynamically injected schema tags
   */
  private clearJsonLd(): void {
    const existing = this.document.getElementById('seo-json-ld');
    if (existing) {
      existing.remove();
    }
  }

  // ==========================================
  // SCHEMA GENERATION UTILITIES
  // ==========================================

  /**
   * Generates Organization Schema
   */
  generateOrganizationSchema(): object {
    return {
      '@type': 'Organization',
      '@id': `${this.baseSiteUrl}/#organization`,
      name: 'AskAMuslim',
      url: this.baseSiteUrl,
      logo: {
        '@type': 'ImageObject',
        url: this.defaultOgImage,
        width: '512',
        height: '512',
      },
      sameAs: [
        'https://www.youtube.com/@askamuslim',
        'https://www.reddit.com/r/askamuslim',
        'https://www.linkedin.com/company/askamuslim',
      ],
      description: 'An authoritative, respectful, and modern digital platform for seeking Islamic answers and finding local mosque resources.',
    };
  }

  /**
   * Generates WebSite Schema
   */
  generateWebsiteSchema(): object {
    return {
      '@type': 'WebSite',
      '@id': `${this.baseSiteUrl}/#website`,
      url: this.baseSiteUrl,
      name: 'AskAMuslim',
      description: 'Learn About Islam, Ask Questions & Locate Mosques',
      publisher: {
        '@id': `${this.baseSiteUrl}/#organization`,
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${this.baseSiteUrl}/question-and-answer/topics?search={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    };
  }

  /**
   * Generates Mosque / Place Schema (Geographical Local SEO & GEO)
   */
  generateMosqueSchema(mosque: any): object {
    const addressParts = [];
    if (mosque.address) addressParts.push(mosque.address);
    if (mosque.district) addressParts.push(mosque.district);
    if (mosque.city) addressParts.push(mosque.city);
    if (mosque.governorate) addressParts.push(mosque.governorate);
    if (mosque.country) addressParts.push(mosque.country);
    const fullAddress = addressParts.join(', ');

    const schema: any = {
      '@type': 'Mosque',
      '@id': `${this.baseSiteUrl}/mosques/${mosque.id}#mosque`,
      name: mosque.name,
      description: mosque.description || `Locate daily prayers, Friday sermons, and facilities at ${mosque.name}.`,
      url: `${this.baseSiteUrl}/mosques/${mosque.id}`,
      address: {
        '@type': 'PostalAddress',
        streetAddress: mosque.address || '',
        addressLocality: mosque.city || '',
        addressRegion: mosque.governorate || '',
        addressCountry: mosque.country || '',
      },
    };

    // Add coordinates for Geo-search
    if (mosque.latitude !== null && mosque.longitude !== null) {
      schema.geo = {
        '@type': 'GeoCoordinates',
        latitude: mosque.latitude,
        longitude: mosque.longitude,
      };
    }

    // Add features/facilities under standard schema tags
    const amenities: string[] = [];
    if (mosque.hasWomenPrayerArea) amenities.push('Women Prayer Area');
    if (mosque.hasFridayKhutbah) amenities.push('Friday Khutbah / Sermon');
    if (mosque.isVerified) amenities.push('Verified Mosque');

    if (amenities.length > 0) {
      schema.amenityFeature = amenities.map(feat => ({
        '@type': 'LocationFeatureSpecification',
        name: feat,
        value: true,
      }));
    }

    if (mosque.mainImageUrl) {
      schema.image = mosque.mainImageUrl;
    }

    return schema;
  }

  /**
   * Generates Course Schema (Academy SEO)
   */
  generateCourseSchema(course: any): object {
    return {
      '@type': 'Course',
      '@id': `${this.baseSiteUrl}/academy/course/${course.id}#course`,
      name: course.title || '',
      description: course.description || '',
      provider: {
        '@id': `${this.baseSiteUrl}/#organization`,
      },
      offers: {
        '@type': 'Offer',
        category: 'Free',
        price: '0.00',
        priceCurrency: 'USD',
      },
    };
  }

  /**
   * Generates FAQPage Schema (Q&A SEO & passage-level AEO/GEO)
   */
  generateFAQSchema(qas: { question: string; answer: string }[]): object {
    return {
      '@type': 'FAQPage',
      mainEntity: qas.map(qa => ({
        '@type': 'Question',
        name: qa.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: qa.answer,
        },
      })),
    };
  }
}
