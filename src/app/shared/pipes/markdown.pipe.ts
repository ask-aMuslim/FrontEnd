import { Pipe, PipeTransform, SecurityContext, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked, Renderer } from 'marked';
import DOMPurify from 'dompurify';

/**
 * Converts a Markdown string into sanitized, safe HTML.
 *
 * Features:
 * - Full CommonMark / GFM support via `marked` (headings, bold, italic,
 *   lists, blockquotes, code blocks, inline code, tables, images, links)
 * - All output is sanitized with DOMPurify before being trusted
 * - External links are forced to open in a new tab with rel="noopener"
 */
@Pipe({
  name: 'markdown',
  standalone: true,
  pure: true,
})
export class MarkdownPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  transform(value: string | null | undefined): SafeHtml {
    if (!value?.trim()) {
      return '';
    }

    // Configure a custom renderer so external links open safely
    const renderer = new Renderer();

    const originalLink = renderer.link.bind(renderer);
    renderer.link = (token) => {
      const html = originalLink(token);
      // Ensure external links open in a new tab
      if (token.href && !token.href.startsWith('#')) {
        return html.replace('<a ', '<a target="_blank" rel="noopener noreferrer" ');
      }
      return html;
    };

    // Synchronous parse with GFM tables & breaks enabled
    const rawHtml = marked.parse(value, {
      renderer,
      breaks: true,   // convert single newlines to <br>
      gfm: true,      // GitHub-Flavored Markdown (tables, strikethrough …)
    }) as string;

    // Sanitize — allow target/rel attributes so the renderer patch survives
    const clean = DOMPurify.sanitize(rawHtml, {
      USE_PROFILES: { html: true },
      ADD_ATTR: ['target', 'rel'],
    });

    // Trust via Angular's DomSanitizer (necessary for innerHTML binding)
    return this.sanitizer.bypassSecurityTrustHtml(clean);
  }
}
