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

        <!-- Coverflow Carousel -->
        <div class="carousel-wrapper" data-aos="zoom-in" data-aos-delay="200">
          <button class="carousel-nav prev" (click)="prevCard()" [disabled]="activeIndex === 0">
            <img src="/icons/icons-24/arrow-left.svg" alt="Previous" class="nav-icon">
          </button>
          
          <div class="carousel-container">
            <div *ngFor="let cert of certificates; let i = index" 
                 class="carousel-card" 
                 [ngStyle]="getCardStyle(i)"
                 (click)="setActiveCard(i)">
              
              <div class="card-inner">
                <div class="card-image-wrapper">
                  <img [src]="cert.webpUrl" [alt]="cert.name" class="cert-image" loading="lazy">
                  <div class="image-overlay" *ngIf="i === activeIndex">
                     <button (click)="viewDetails(cert.id); $event.stopPropagation()" class="view-btn">
                       <img src="/icons/icons-24/expand.svg" alt="" class="btn-icon"> View Full Details
                     </button>
                  </div>
                </div>
                <div class="card-info">
                  <h3 class="cert-title">{{ cert.title }}</h3>
                  <h4 class="recipient-name">{{ cert.name }}</h4>
                  <p class="cert-desc">{{ cert.description }}</p>
                </div>
              </div>
            </div>
          </div>

          <button class="carousel-nav next" (click)="nextCard()" [disabled]="activeIndex === certificates.length - 1">
            <img src="/icons/icons-24/arrow-right.svg" alt="Next" class="nav-icon">
          </button>
        </div>
        
        <!-- Carousel Indicators -->
        <div class="carousel-indicators">
          <button *ngFor="let cert of certificates; let i = index" 
                  class="indicator-dot" 
                  [class.active]="i === activeIndex"
                  (click)="setActiveCard(i)">
          </button>
        </div>
      </section>

    </div>
  `,
  styles: [`
    :host {
      display: block;
      background: #000;
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
      max-width: 1400px;
      margin: 0 auto;
      padding: 80px 24px;
      position: relative;
    }

    .page-header {
      text-align: center;
      margin-bottom: 60px;
    }

    .section-title {
      font-size: clamp(2rem, 5vw, 3rem);
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 12px;
      text-shadow: 0 2px 10px rgba(0,0,0,0.5);
    }

    .section-subtitle {
      font-size: 1.2rem;
      color: #adb5bd;
    }

    .title-divider {
      width: 80px;
      height: 4px;
      background: #ecc140;
      margin: 24px auto;
      border-radius: 2px;
      box-shadow: 0 0 10px rgba(236,193,64,0.5);
    }

    /* Carousel */
    .carousel-wrapper {
      position: relative;
      width: 100%;
      height: 600px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .carousel-nav {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      color: #ecc140;
      font-size: 1.5rem;
      cursor: pointer;
      z-index: 100;
      backdrop-filter: blur(5px);
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .carousel-nav:hover:not([disabled]) {
      background: rgba(236,193,64,0.2);
      border-color: #ecc140;
      transform: translateY(-50%) scale(1.1);
    }

    .carousel-nav[disabled] {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .carousel-nav.prev { left: 0; }
    .carousel-nav.next { right: 0; }

    .carousel-container {
      position: relative;
      width: 100%;
      max-width: 500px;
      height: 100%;
      perspective: 1200px;
      transform-style: preserve-3d;
    }

    .carousel-card {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.6s ease;
      cursor: pointer;
    }

    .card-inner {
      background: #ffffff;
      border: 2px solid rgba(236,193,64, 0.3);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .carousel-card[style*="opacity: 1"]:hover .card-inner {
      border-color: #ecc140;
      box-shadow: 0 0 30px rgba(236,193,64,0.3);
    }

    .card-image-wrapper {
      position: relative;
      height: 60%;
      overflow: hidden;
      background: #ffffff;
      border-bottom: 1px solid rgba(0,0,0,0.05);
    }

    .cert-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
      padding: 16px;
    }

    .image-overlay {
      position: absolute;
      inset: 0;
      background: rgba(21, 107, 64, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .carousel-card:hover .image-overlay {
      opacity: 1;
    }

    .view-btn {
      padding: 12px 24px;
      background: #ecc140;
      color: #010d05;
      font-weight: 700;
      border: none;
      border-radius: 30px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transform: translateY(20px);
      transition: all 0.3s ease;
      font-size: 1rem;
    }

    .btn-icon {
      width: 20px;
      height: 20px;
      filter: invert(5%) sepia(20%) saturate(1000%) hue-rotate(120deg) brightness(10%); /* Near black */
    }

    .nav-icon {
      width: 24px;
      height: 24px;
      filter: invert(84%) sepia(35%) saturate(743%) hue-rotate(338deg) brightness(97%) contrast(92%); /* Gold #ecc140 */
    }

    .view-btn:hover {
      background: #cda736;
      transform: translateY(0) scale(1.05);
    }

    .carousel-card:hover .view-btn {
      transform: translateY(0);
    }

    .card-info {
      padding: 24px;
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #fff;
    }

    .cert-title {
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #156b40;
      font-weight: 700;
      margin-bottom: 12px;
    }

    .recipient-name {
      font-size: 1.6rem;
      font-weight: 800;
      color: #010d05;
      margin-bottom: 12px;
    }

    .cert-desc {
      color: #343a40;
      line-height: 1.5;
      font-size: 1rem;
      flex: 1;
    }

    .carousel-indicators {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-top: 40px;
    }

    .indicator-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      border: none;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .indicator-dot.active {
      background: #ecc140;
      transform: scale(1.3);
      box-shadow: 0 0 10px rgba(236,193,64,0.5);
    }

    @media (max-width: 768px) {
      .carousel-container { max-width: 300px; height: 450px; }
      .carousel-wrapper { height: 450px; }
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
  activeIndex = 0;
  
  private particles: Particle[] = [];
  private animationFrameId?: number;
  private mouseX = -1000;
  private mouseY = -1000;
  private scrollY = 0;

  certificates: CertificateData[] = CERTIFICATES_DB;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      AOS.init({
        duration: 800,
        once: true,
        offset: 50
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

  getCardStyle(index: number) {
    if (!isPlatformBrowser(this.platformId)) return {};
    
    const diff = index - this.activeIndex;
    const absDiff = Math.abs(diff);
    
    const spread = window.innerWidth < 768 ? 80 : 200;
    const translateX = diff * spread;
    
    const scale = 1 - (absDiff * 0.15);
    const rotateY = diff === 0 ? 0 : (diff > 0 ? -25 : 25);
    const zIndex = 100 - absDiff;
    
    // Explicitly guarantee 100% opacity for the active center card
    const opacity = diff === 0 ? 1 : (absDiff > 2 ? 0 : 1 - (absDiff * 0.3));

    return {
      'transform': `translateX(${translateX}px) scale(${scale}) rotateY(${rotateY}deg)`,
      'z-index': zIndex,
      'opacity': opacity,
      'pointer-events': diff === 0 ? 'auto' : 'none'
    };
  }

  nextCard() {
    if (this.activeIndex < this.certificates.length - 1) {
      this.activeIndex++;
    }
  }

  prevCard() {
    if (this.activeIndex > 0) {
      this.activeIndex--;
    }
  }

  setActiveCard(index: number) {
    this.activeIndex = index;
  }

  viewDetails(certId: string) {
    this.router.navigate(['/certificates', certId]);
  }
}
