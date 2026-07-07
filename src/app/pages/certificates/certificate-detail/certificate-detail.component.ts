import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { CertificateData, CERTIFICATES_DB } from '../certificates.data';
import { SeoService } from '../../../core/services/seo.service';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-certificate-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="cert-detail-container">
      <div class="back-nav">
        <a routerLink="/certificates" class="back-btn"><img src="/icons/icons-24/arrow-left.svg" alt="" class="btn-icon brand-green"> Back to Hall of Honor</a>
      </div>

      <div class="cert-content" *ngIf="cert">
        <div class="cert-header">
          <h1 class="cert-name">{{ cert.name }}</h1>
          <h2 class="cert-title">{{ cert.title }}</h2>
          <p class="cert-desc">{{ cert.description }}</p>
        </div>

        <div class="cert-showcase">
          <!-- Hidden container for PDF export -->
          <div id="cert-export-container" class="export-container">
             <div class="export-inner">
               <img [src]="cert.jpegUrl" crossorigin="anonymous">
             </div>
          </div>

          <div class="image-wrapper">
             <img [src]="cert.webpUrl" [alt]="cert.name + ' Certificate'" class="cert-image">
          </div>
        </div>

        <div class="actions-panel">
          <h3 class="actions-title">Download Formats</h3>
          <div class="download-grid">
            <a [href]="cert.webpUrl" [download]="getFileName(cert, 'webp')" class="action-btn download-btn">
              <img src="/icons/icons-24/video-file.svg" alt="" class="btn-icon brand-green"> WebP
            </a>
            <a [href]="cert.jpegUrl" [download]="getFileName(cert, 'jpeg')" class="action-btn download-btn">
              <img src="/icons/icons-24/video-file.svg" alt="" class="btn-icon brand-green"> JPEG
            </a>
            <button (click)="downloadAsPDF()" class="action-btn pdf-btn" [disabled]="isGeneratingPdf">
              <img [src]="isGeneratingPdf ? '/icons/icons-24/wait.svg' : '/icons/icons-24/file-download.svg'" 
                   alt="" 
                   class="btn-icon near-black" 
                   [class.spin]="isGeneratingPdf"> PDF
            </button>
          </div>

          <div class="share-section">
            <h3 class="actions-title">Share Achievement</h3>
            <button (click)="shareToLinkedIn()" class="action-btn linkedin-btn">
              <img src="/icons/icons-24/share.svg" alt="" class="btn-icon white"> Share on LinkedIn
            </button>
          </div>
        </div>
      </div>

      <div class="not-found" *ngIf="!cert && isLoaded">
        <h2>Certificate not found</h2>
        <a routerLink="/certificates" class="back-btn">Return to Gallery</a>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      background: var(--color-background-base-surface);
      min-height: 100vh;
      padding: 40px 24px;
    }

    .cert-detail-container {
      max-width: 1000px;
      margin: 0 auto;
    }

    .back-nav {
      margin-bottom: 32px;
    }

    .back-btn {
      color: #156b40;
      text-decoration: none;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: color 0.3s ease;
    }

    .back-btn:hover {
      color: #ecc140;
    }

    .cert-header {
      text-align: center;
      margin-bottom: 40px;
    }

    .cert-name {
      font-size: 3rem;
      font-weight: 900;
      color: var(--color-text-title);
      margin-bottom: 8px;
    }

    .cert-title {
      font-size: 1.5rem;
      color: #ecc140;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 16px;
    }

    .cert-desc {
      color: var(--color-text-body);
      font-size: 1.1rem;
      max-width: 600px;
      margin: 0 auto;
    }

    .cert-showcase {
      margin-bottom: 40px;
      display: flex;
      justify-content: center;
    }

    .image-wrapper {
      background: #fff;
      padding: 24px;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
      width: 100%;
      display: flex;
      justify-content: center;
    }

    .cert-image {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      border: 1px solid rgba(0,0,0,0.05);
    }

    .actions-panel {
      background: #fff;
      padding: 32px;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.05);
      border: 1px solid rgba(21, 107, 64, 0.1);
    }

    .actions-title {
      font-size: 1.2rem;
      color: #156b40;
      margin-bottom: 20px;
      font-weight: 700;
      text-align: center;
    }

    .download-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .share-section {
      border-top: 1px solid #eaeaea;
      padding-top: 32px;
      text-align: center;
    }

    .action-btn {
      padding: 12px 24px;
      font-weight: 700;
      border-radius: 30px;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      transition: all 0.3s ease;
      font-size: 1rem;
      border: none;
      cursor: pointer;
    }

    .btn-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .btn-icon.brand-green {
      filter: invert(26%) sepia(49%) saturate(730%) hue-rotate(104deg) brightness(89%) contrast(97%);
    }

    .btn-icon.near-black {
      filter: invert(5%) sepia(20%) saturate(1000%) hue-rotate(120deg) brightness(10%);
    }

    .btn-icon.white {
      filter: invert(100%);
    }

    .spin {
      animation: fa-spin 2s infinite linear;
    }

    @keyframes fa-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(359deg); }
    }

    .download-btn {
      background: rgba(21, 107, 64, 0.08);
      color: #156b40;
    }
    
    .download-btn:hover {
      background: #156b40;
      color: #fff;
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(21, 107, 64, 0.2);
    }

    .download-btn:hover .btn-icon {
      filter: invert(100%);
    }

    .pdf-btn {
      background: #ecc140;
      color: #010d05;
    }

    .pdf-btn:hover:not([disabled]) {
      background: #cda736;
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(236,193,64,0.3);
    }

    .pdf-btn[disabled] {
      opacity: 0.7;
      cursor: wait;
    }

    .linkedin-btn {
      background: #0077b5;
      color: #fff;
      min-width: 250px;
    }

    .linkedin-btn:hover {
      background: #005e93;
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 119, 181, 0.3);
    }

    .not-found {
      text-align: center;
      padding: 100px 0;
    }

    /* Hidden Export Container for PDF */
    .export-container {
      position: absolute;
      left: -9999px;
      top: -9999px;
      width: 1200px;
      background: #fff;
      padding: 0;
    }
    .export-inner img {
      width: 100%;
      height: auto;
      display: block;
    }

    @media (max-width: 768px) {
      :host {
        padding: 24px 16px;
      }
      .cert-name {
        font-size: 2.2rem;
      }
      .cert-title {
        font-size: 1.2rem;
        margin-bottom: 12px;
      }
      .cert-desc {
        font-size: 1rem;
      }
      .image-wrapper {
        padding: 16px;
      }
      .actions-panel {
        padding: 24px;
      }
      .download-grid {
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
    }

    @media (max-width: 576px) {
      .cert-name {
        font-size: 1.8rem;
      }
      .cert-title {
        font-size: 1rem;
      }
      .cert-desc {
        font-size: 0.95rem;
      }
      .download-grid {
        grid-template-columns: 1fr;
      }
      .linkedin-btn {
        min-width: unset;
        width: 100%;
      }
      .image-wrapper {
        padding: 12px;
      }
    }
  `]
})
export class CertificateDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private document = inject(DOCUMENT);
  private cdr = inject(ChangeDetectorRef);
  private readonly seoService = inject(SeoService);

  cert: CertificateData | undefined;
  isLoaded = false;
  isGeneratingPdf = false;

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.cert = CERTIFICATES_DB.find(c => c.id === id);
        if (this.cert) {
          this.seoService.setMetaTags({
            title: `Certificate of Achievement - ${this.cert.name}`,
            description: `${this.cert.name} has successfully earned the certificate: ${this.cert.title}. ${this.cert.description}`,
            keywords: ['Certificate of Achievement', this.cert.name, this.cert.title, 'Islamic Course Completion'],
            ogImage: this.cert.jpegUrl
          });
        }
      }
      this.isLoaded = true;
    });
  }

  getFileName(cert: CertificateData, format: string): string {
    return `${cert.name.replace(' ', '_')}_Certificate.${format}`;
  }

  async downloadAsPDF() {
    if (!isPlatformBrowser(this.platformId) || !this.cert) return;

    this.isGeneratingPdf = true;

    try {
      // Create a new image to ensure it's loaded and handle CORS
      const img = new Image();
      img.crossOrigin = 'anonymous';

      // Use a Promise to wait for the image to fully load
      const imageLoadPromise = new Promise((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(new Error('Failed to load certificate image for PDF generation.'));
        // Add a cache-busting query param if needed, or just the URL
        img.src = this.cert!.jpegUrl;
      });

      const loadedImg = await imageLoadPromise as HTMLImageElement;

      // Create a canvas to convert the image to a high-quality JPEG for the PDF
      const canvas = this.document.createElement('canvas');
      canvas.width = loadedImg.naturalWidth;
      canvas.height = loadedImg.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not create canvas context');

      ctx.drawImage(loadedImg, 0, 0);
      const imgData = canvas.toDataURL('image/jpeg', 1.0);

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Calculate dimensions to fit the image on the A4 page while maintaining aspect ratio
      const imgRatio = loadedImg.naturalWidth / loadedImg.naturalHeight;
      const pdfRatio = pdfWidth / pdfHeight;

      let finalWidth, finalHeight;
      if (imgRatio > pdfRatio) {
        finalWidth = pdfWidth;
        finalHeight = pdfWidth / imgRatio;
      } else {
        finalHeight = pdfHeight;
        finalWidth = pdfHeight * imgRatio;
      }

      const x = (pdfWidth - finalWidth) / 2;
      const y = (pdfHeight - finalHeight) / 2;

      pdf.addImage(imgData, 'JPEG', x, y, finalWidth, finalHeight);
      pdf.save(`${this.cert.name.replace(/\s+/g, '_')}_Certificate.pdf`);
    } catch (error) {
      console.error('PDF Generation Error:', error);
      alert("Unable to generate PDF. This usually happens if the image hasn't finished loading or there is a connection issue. Please try downloading the JPEG directly instead.");
    } finally {
      this.isGeneratingPdf = false;
      this.cdr.detectChanges();
    }
  }

  shareToLinkedIn() {
    if (!isPlatformBrowser(this.platformId) || !this.cert) return;

    // Direct link to THIS specific certificate page
    const url = encodeURIComponent(window.location.origin + '/certificates/' + this.cert.id);
    const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    window.open(linkedInShareUrl, '_blank', 'width=600,height=600');
  }
}
