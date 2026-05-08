import { Component, OnInit, AfterViewInit, inject, PLATFORM_ID, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import gsap from 'gsap';
import AOS from 'aos';
import { CertificateData, CERTIFICATES_DB } from './certificates.data';

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.x = Math.random() * canvasWidth;
    this.y = Math.random() * canvasHeight;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = (Math.random() - 0.5) * 0.5 - 0.2;
    this.size = Math.random() * 2 + 1;
    this.alpha = Math.random() * 0.5 + 0.1;
  }

  update(mouseX: number, mouseY: number, scrollY: number) {
    this.x += this.vx;
    this.y += this.vy - (scrollY * 0.01);

    const dx = mouseX - this.x;
    const dy = mouseY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 100) {
      this.x -= dx * 0.01;
      this.y -= dy * 0.01;
    }

    if (this.y < -10) this.y = window.innerHeight + 10;
    if (this.x < -10) this.x = window.innerWidth + 10;
    if (this.x > window.innerWidth + 10) this.x = -10;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(236, 193, 64, ${this.alpha})`;
    ctx.fill();
  }
}

@Component({
  selector: 'app-certificates',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="certificates-container">
      
      <!-- Ambient Canvas Background -->
      <canvas #ambientCanvas class="ambient-canvas"></canvas>

      <!-- Splash Screen Overlay -->
      <div #splash class="splash-overlay" *ngIf="showSplash">
        <div class="glow-effect" #glow></div>
        <div class="splash-content">
          <div class="medal-icon" #medal>
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15C15.866 15 19 11.866 19 8C19 4.13401 15.866 1 12 1C8.13401 1 5 4.13401 5 8C5 11.866 8.13401 15 12 15Z" stroke="#ecc140" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M8.21 13.89L7 23L12 20L17 23L15.79 13.88" stroke="#ecc140" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h1 class="splash-title" #splashTitle>Congratulations!</h1>
          <p class="splash-subtitle" #splashSubtitle>Honoring our exceptional achievers</p>
        </div>
      </div>

      <!-- Main Content -->
      <section class="certificates-content">
        <header class="page-header" data-aos="fade-down">
          <h2 class="section-title">Hall of Honor</h2>
          <p class="section-subtitle">A celebration of dedication, knowledge, and excellence.</p>
          <div class="title-divider"></div>
        </header>

        <!-- Duo Showcase Layout -->
        <div class="duo-showcase">
          <div *ngFor="let cert of certificates; let i = index" 
               class="cert-card-duo" 
               [attr.data-aos]="i === 0 ? 'fade-right' : 'fade-left'"
               [attr.data-aos-delay]="200 + (i * 150)"
               (click)="viewDetails(cert.id)">
            
            <div class="card-glow"></div>
            
            <div class="card-inner">
              <div class="card-image-wrapper">
                <img [src]="cert.webpUrl" [alt]="cert.name" class="cert-image" loading="lazy">
                <div class="image-overlay">
                   <div class="view-btn">
                     <img src="/icons/icons-24/expand.svg" alt="" class="btn-icon"> 
                     <span>View Full Details</span>
                   </div>
                </div>
              </div>
              <div class="card-info">
                <div class="info-top">
                  <span class="cert-badge">Honorary Achievement</span>
                  <h3 class="cert-title">{{ cert.title }}</h3>
                </div>
                <h4 class="recipient-name">{{ cert.name }}</h4>
                <p class="cert-desc">{{ cert.description }}</p>
              </div>
            </div>
          </div>
        </div>

      </section>

    </div>
  `,
  styles: [`
    :host {
      display: block;
      background: #010d05;
      min-height: 100vh;
      overflow-x: hidden;
      position: relative;
    }

    .ambient-canvas {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      z-index: 0;
      pointer-events: none;
    }

    .certificates-container {
      position: relative;
      z-index: 1;
    }

    /* Splash Overlay */
    .splash-overlay {
      position: fixed;
      inset: 0;
      z-index: 2000;
      background: #010d05;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .glow-effect {
      position: absolute;
      width: 60vw;
      height: 60vw;
      background: radial-gradient(circle, rgba(236,193,64,0.15) 0%, rgba(0,0,0,0) 70%);
      border-radius: 50%;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      animation: pulseGlow 3s infinite alternate;
    }

    @keyframes pulseGlow {
      0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.5; }
      100% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
    }

    .splash-content {
      text-align: center;
      z-index: 10;
    }

    .medal-icon {
      margin-bottom: 24px;
      color: #ecc140;
    }

    .splash-title {
      font-size: clamp(3rem, 8vw, 5rem);
      font-weight: 900;
      color: #ecc140;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 4px;
      text-shadow: 0 0 20px rgba(236, 193, 64, 0.4);
    }

    .splash-subtitle {
      font-size: clamp(1rem, 3vw, 1.5rem);
      color: #ffffff;
      opacity: 0.8;
      margin-top: 16px;
    }

    /* Main Content */
    .certificates-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 80px 24px;
      position: relative;
    }

    .page-header {
      text-align: center;
      margin-bottom: 80px;
    }

    .section-title {
      font-size: clamp(2.5rem, 6vw, 4rem);
      font-weight: 900;
      color: #ffffff;
      margin-bottom: 12px;
      letter-spacing: -1px;
    }

    .section-subtitle {
      font-size: 1.2rem;
      color: #adb5bd;
      max-width: 600px;
      margin: 0 auto;
    }

    .title-divider {
      width: 100px;
      height: 4px;
      background: linear-gradient(90deg, transparent, #ecc140, transparent);
      margin: 32px auto;
      border-radius: 2px;
    }

    /* Duo Showcase Layout */
    .duo-showcase {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 60px;
      margin-top: 40px;
    }

    @media (max-width: 992px) {
      .duo-showcase {
        grid-template-columns: 1fr;
        max-width: 600px;
        margin-left: auto;
        margin-right: auto;
        gap: 80px;
      }
    }

    .cert-card-duo {
      position: relative;
      cursor: pointer;
      transition: all 0.5s cubic-bezier(0.165, 0.84, 0.44, 1);
    }

    .card-glow {
      position: absolute;
      inset: -20px;
      background: radial-gradient(circle at center, rgba(236, 193, 64, 0.15), transparent 70%);
      opacity: 0;
      transition: opacity 0.5s ease;
      z-index: -1;
      border-radius: 40px;
    }

    .cert-card-duo:hover .card-glow {
      opacity: 1;
    }

    .cert-card-duo:hover {
      transform: translateY(-15px) scale(1.02);
    }

    .card-inner {
      background: #ffffff;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4);
      height: 100%;
      display: flex;
      flex-direction: column;
      border: 1px solid rgba(255,255,255,0.1);
    }

    .card-image-wrapper {
      position: relative;
      height: 350px;
      background: #fcfcfc;
      overflow: hidden;
    }

    .cert-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
      padding: 30px;
      transition: transform 0.8s ease;
    }

    .cert-card-duo:hover .cert-image {
      transform: scale(1.05);
    }

    .image-overlay {
      position: absolute;
      inset: 0;
      background: rgba(21, 107, 64, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: all 0.4s ease;
      backdrop-filter: blur(4px);
    }

    .cert-card-duo:hover .image-overlay {
      opacity: 1;
    }

    .view-btn {
      padding: 14px 28px;
      background: #ecc140;
      color: #010d05;
      font-weight: 800;
      border-radius: 40px;
      display: flex;
      align-items: center;
      gap: 12px;
      transform: translateY(30px);
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      font-size: 1.1rem;
      box-shadow: 0 10px 20px rgba(0,0,0,0.2);
    }

    .cert-card-duo:hover .view-btn {
      transform: translateY(0);
    }

    .btn-icon {
      width: 24px;
      height: 24px;
      filter: invert(5%) sepia(20%) saturate(1000%) hue-rotate(120deg) brightness(10%);
    }

    .card-info {
      padding: 32px;
      flex: 1;
      display: flex;
      flex-direction: column;
      background: linear-gradient(180deg, #ffffff 0%, #f9f9f9 100%);
    }

    .info-top {
      margin-bottom: 20px;
    }

    .cert-badge {
      display: inline-block;
      padding: 6px 14px;
      background: rgba(21, 107, 64, 0.1);
      color: #156b40;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 12px;
    }

    .cert-title {
      font-size: 1.1rem;
      color: #ecc140;
      font-weight: 800;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .recipient-name {
      font-size: 2.2rem;
      font-weight: 900;
      color: #010d05;
      margin-bottom: 16px;
      letter-spacing: -0.5px;
    }

    .cert-desc {
      color: #4a4a4a;
      line-height: 1.6;
      font-size: 1.1rem;
      margin: 0;
    }
  `]
})
export class CertificatesComponent implements OnInit, AfterViewInit {
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);

  @ViewChild('splash') splash?: ElementRef;
  @ViewChild('medal') medal?: ElementRef;
  @ViewChild('splashTitle') splashTitle?: ElementRef;
  @ViewChild('splashSubtitle') splashSubtitle?: ElementRef;
  @ViewChild('ambientCanvas') ambientCanvas?: ElementRef<HTMLCanvasElement>;

  showSplash = true;

  private particles: Particle[] = [];
  private animationFrameId?: number;
  private mouseX = -1000;
  private mouseY = -1000;
  private scrollY = 0;

  certificates: CertificateData[] = CERTIFICATES_DB;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      AOS.init({
        duration: 1000,
        once: true,
        offset: 100,
        easing: 'ease-out-back'
      });
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.runSplashAnimation();
      this.initCanvas();
    }
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;
  }

  @HostListener('window:scroll')
  onScroll() {
    this.scrollY = window.scrollY;
  }

  @HostListener('window:resize')
  onResize() {
    if (this.ambientCanvas) {
      this.ambientCanvas.nativeElement.width = window.innerWidth;
      this.ambientCanvas.nativeElement.height = window.innerHeight;
    }
  }

  private initCanvas() {
    if (!this.ambientCanvas) return;
    const canvas = this.ambientCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particleCount = window.innerWidth < 768 ? 50 : 150;
    for (let i = 0; i < particleCount; i++) {
      this.particles.push(new Particle(canvas.width, canvas.height));
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.particles.forEach(p => {
        p.update(this.mouseX, this.mouseY, this.scrollY);
        p.draw(ctx);
      });
      this.animationFrameId = requestAnimationFrame(animate);
    };
    animate();
  }

  private runSplashAnimation(): void {
    const tl = gsap.timeline();

    gsap.set([this.medal?.nativeElement, this.splashTitle?.nativeElement, this.splashSubtitle?.nativeElement], {
      opacity: 0,
      y: 30
    });

    tl.to(this.medal?.nativeElement, { opacity: 1, y: 0, duration: 0.8, ease: 'back.out(1.5)' })
      .to(this.splashTitle?.nativeElement, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.4')
      .to(this.splashSubtitle?.nativeElement, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.4')
      .to(this.splash?.nativeElement, {
        opacity: 0,
        duration: 0.8,
        delay: 1.5,
        ease: 'power2.inOut',
        onComplete: () => {
          this.showSplash = false;
        }
      });
  }

  viewDetails(certId: string) {
    this.router.navigate(['/certificates', certId]);
  }
}
