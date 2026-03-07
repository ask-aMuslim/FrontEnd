import {
  Directive,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  Renderer2,
  SecurityContext,
  SimpleChanges,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[inlineSVG]',
  standalone: true,
})
export class InlineSvgDirective implements OnChanges, OnDestroy {
  @Input('inlineSVG') src?: string;
  private abortController: AbortController | null = null;
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['src']) {
      this.loadSvg();
    }
  }

  ngOnDestroy(): void {
    this.abortController?.abort();
  }

  private async loadSvg(): Promise<void> {
    this.abortController?.abort();

    if (!this.src) {
      this.renderer.setProperty(this.elementRef.nativeElement, 'innerHTML', '');
      return;
    }

    // Skip loading SVGs during server-side rendering
    if (!this.isBrowser) {
      return;
    }

    this.abortController = new AbortController();

    try {
      const response = await fetch(this.src, { signal: this.abortController.signal });

      if (!response.ok) {
        throw new Error(`Failed to load SVG: ${response.status}`);
      }

      // const rawSvg = await response.text();
      let rawSvg = await response.text();
      rawSvg = rawSvg
        // Replace fill colors EXCEPT "none"
        .replace(/fill="(?!none)[^"]*"/gi, 'fill="currentColor"')
        // Replace stroke colors
        .replace(/stroke="[^"]*"/gi, 'stroke="currentColor"');

      const sanitized = this.sanitizer.sanitize(
        SecurityContext.HTML,
        this.sanitizer.bypassSecurityTrustHtml(rawSvg),
      );

      this.renderer.setProperty(this.elementRef.nativeElement, 'innerHTML', sanitized ?? '');
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return;
      }

      this.renderer.setProperty(this.elementRef.nativeElement, 'innerHTML', '');
    }
  }
}
