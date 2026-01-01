import {
  Directive,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  Renderer2,
  SecurityContext,
  SimpleChanges,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Directive({
  selector: '[inlineSVG]',
  standalone: true,
})
export class InlineSvgDirective implements OnChanges, OnDestroy {
  @Input('inlineSVG') src?: string;
  private abortController: AbortController | null = null;

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    private sanitizer: DomSanitizer
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

    this.abortController = new AbortController();

    try {
      const response = await fetch(this.src, { signal: this.abortController.signal });

      if (!response.ok) {
        throw new Error(`Failed to load SVG: ${response.status}`);
      }

      const rawSvg = await response.text();
      const sanitized = this.sanitizer.sanitize(
        SecurityContext.HTML,
        this.sanitizer.bypassSecurityTrustHtml(rawSvg)
      );

      this.renderer.setProperty(this.elementRef.nativeElement, 'innerHTML', sanitized ?? '');
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return;
      }

      this.renderer.setProperty(this.elementRef.nativeElement, 'innerHTML', '');
      console.error('inlineSVG directive failed to load icon:', error);
    }
  }
}
