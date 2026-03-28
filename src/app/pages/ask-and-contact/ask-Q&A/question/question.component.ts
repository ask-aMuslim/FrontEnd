
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import DOMPurify from 'dompurify';
import { QasService } from '../../../../core/services/qas.service';
import { asRecord, extractArray, getValue, toStringValue, toStringArray } from '../../../../core/helpers/api-response.helper';
import { toApiMediaUrl } from '../../../../core/helpers/media-url.helper';
import { TiptapViewerComponent } from '../../../../shared/components/tiptap-viewer/tiptap-viewer.component';

@Component({
  selector: 'app-question',
  standalone: true,
  imports: [RouterLink, TiptapViewerComponent],
  templateUrl: './question.component.html',
  styleUrls: ['./question.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionComponent implements OnDestroy {
  private readonly destroy$ = new Subject<void>();

  id = '';
  title = '';
  answer = '';
  answerViewerContent: unknown = null;
  questionHtml: SafeHtml | null = null;
  private answerHtmlRaw: string | null = null;
  categories: string[] = [];
  imageUrl: string | null = null;
  isSaved = false;

  readonly saveIcon = '/icons/icons-24/save.svg';
  readonly savedIcon = '/icons/icons-24/saved.svg';
  readonly shareIcon = '/icons/icons-24/share.svg';
  readonly downloadIcon = '/icons/icons-24/download.svg';

  private static readonly fallbackImage = '/images/events-image-placeholder.jpg';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly qasService: QasService,
    private readonly sanitizer: DomSanitizer,
    private readonly changeDetectorRef: ChangeDetectorRef,
  ) {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.id = params.get('id') ?? '';
      const categoriesParam = params.get('categories');
      this.categories = categoriesParam ? this.parseCategories(categoriesParam) : [];

      if (this.id) {
        this.loadQuestionById(this.id);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  back(): void {
    void this.router.navigate(['/ask-and-contact/ask-qa']);
  }

  toggleSave(): void {
    this.isSaved = !this.isSaved;
  }

  private parseCategories(categoriesJson: string): string[] {
    try {
      return JSON.parse(categoriesJson);
    } catch {
      return [];
    }
  }

  private loadQuestionById(id: string): void {
    this.qasService.getById(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        const record = asRecord(response);
        const data = getValue(record, 'data', 'Data') ? asRecord(getValue(record, 'data', 'Data')) : record;

        const translations = extractArray(getValue(data, 'translations', 'Translations'));
        const firstTranslation = translations.length > 0 ? asRecord(translations[0]) : null;

        const mappedTitle = toStringValue(
          firstTranslation ? getValue(firstTranslation, 'questionText', 'QuestionText', 'question') : undefined,
        ) ?? toStringValue(getValue(data, 'title', 'Title'));

        const mappedAnswer = toStringValue(
          firstTranslation ? getValue(firstTranslation, 'answerText', 'AnswerText', 'answer') : undefined,
        ) ?? toStringValue(getValue(data, 'answerText', 'AnswerText', 'answer', 'Answer'));

        const mappedTitleJson = toStringValue(
          firstTranslation ? getValue(firstTranslation, 'questionTextJson', 'QuestionTextJson') : undefined,
        ) ?? toStringValue(getValue(data, 'questionTextJson', 'QuestionTextJson'));

        const mappedAnswerJsonValue =
          (firstTranslation ? getValue(firstTranslation, 'answerTextJson', 'AnswerTextJson') : undefined) ??
          getValue(data, 'answerTextJson', 'AnswerTextJson');

        let mappedAnswerJson: string | null = null;
        if (typeof mappedAnswerJsonValue === 'string') {
          mappedAnswerJson = mappedAnswerJsonValue;
        } else if (mappedAnswerJsonValue !== null && mappedAnswerJsonValue !== undefined) {
          mappedAnswerJson = JSON.stringify(mappedAnswerJsonValue);
        }

        const mappedImage = toApiMediaUrl(
          toStringValue(getValue(data, 'imageUrl', 'ImageUrl', 'questionImage', 'QuestionImage')),
        );

        const renderedTitle = this.resolveRichHtml(mappedTitle, mappedTitleJson);
        const renderedAnswer = this.resolveRichHtml(mappedAnswer, mappedAnswerJson);

        this.questionHtml = renderedTitle ? this.toSafeHtml(renderedTitle) : null;
        this.answerHtmlRaw = renderedAnswer;
        this.answerViewerContent = mappedAnswerJsonValue ?? renderedAnswer ?? mappedAnswer ?? null;

        this.title = this.extractTextFromHtml(renderedTitle ?? mappedTitle ?? this.title) || this.title;
        this.answer = this.extractTextFromHtml(renderedAnswer ?? mappedAnswer ?? this.answer) || this.answer;
        this.categories = toStringArray(getValue(data, 'categories', 'Categories', 'tags', 'Tags')) ?? this.categories;
        this.imageUrl = mappedImage ?? null;
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.changeDetectorRef.markForCheck();
      },
    });
  }

  private resolveRichHtml(primaryText: string | null, jsonText: string | null): string | null {
    const directPrimary = this.tryExtractHtml(primaryText);
    if (directPrimary) {
      return directPrimary;
    }

    const fromJson = this.tryExtractHtml(jsonText);
    if (fromJson) {
      return fromJson;
    }

    const structuredHtml = this.tryExtractHtmlFromJsonString(jsonText) ?? this.tryExtractHtmlFromJsonString(primaryText);
    if (structuredHtml) {
      return structuredHtml;
    }

    const fallback = primaryText ?? jsonText;
    if (!fallback) {
      return null;
    }

    const escaped = this.escapeHtml(fallback);
    return `<p>${escaped.replaceAll('\n', '<br/>')}</p>`;
  }

  private tryExtractHtml(value: string | null): string | null {
    if (!value) {
      return null;
    }

    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return null;
    }

    return /<\/?[a-z][\s\S]*>/i.test(trimmed) ? trimmed : null;
  }

  private tryExtractHtmlFromJsonString(value: string | null): string | null {
    if (!value) {
      return null;
    }

    const trimmed = value.trim();
    if (trimmed.length === 0 || (!trimmed.startsWith('{') && !trimmed.startsWith('['))) {
      return null;
    }

    try {
      const parsed = JSON.parse(trimmed);
      const direct = this.tryExtractHtmlFromUnknown(parsed);
      if (direct) {
        return direct;
      }

      return this.renderStructuredContent(parsed);
    } catch {
      return null;
    }
  }

  private renderStructuredContent(value: unknown): string | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const record = value as Record<string, unknown>;
    const content = record['content'];
    let maybeNodes: unknown[] | null = null;
    if (Array.isArray(content)) {
      maybeNodes = content;
    } else if (Array.isArray(value)) {
      maybeNodes = value;
    }

    if (!maybeNodes) {
      return null;
    }

    const html = maybeNodes
      .map((node) => this.renderNode(node))
      .filter((node): node is string => typeof node === 'string' && node.trim().length > 0)
      .join('');

    return html.length > 0 ? html : null;
  }

  private renderNode(node: unknown): string | null {
    if (!node || typeof node !== 'object') {
      return null;
    }

    const record = node as Record<string, unknown>;
    const type = typeof record['type'] === 'string' ? record['type'] : null;
    const content = this.renderChildContent(record['content']);

    const renderedByType = this.renderNodeByType(type, record, content);
    if (renderedByType !== null) {
      return renderedByType;
    }

    const wrapped = this.wrapNode(type, content);
    if (wrapped) {
      return wrapped;
    }

    return content || null;
  }

  private renderNodeByType(type: string | null, record: Record<string, unknown>, content: string): string | null {
    switch (type) {
      case 'text':
        return this.renderTextNode(record);
      case 'hardBreak':
        return '<br/>';
      case 'image':
        return this.renderImageNode(record);
      case 'heading':
        return this.renderHeadingNode(record, content);
      case 'doc':
        return content;
      default:
        return null;
    }
  }

  private renderTextNode(record: Record<string, unknown>): string {
    const textValue = this.escapeHtml(typeof record['text'] === 'string' ? record['text'] : '');
    return this.applyMarks(textValue, record['marks']);
  }

  private renderImageNode(record: Record<string, unknown>): string | null {
    const attrs = record['attrs'];
    const attrsRecord = attrs && typeof attrs === 'object' ? (attrs as Record<string, unknown>) : null;
    const srcRaw = typeof attrsRecord?.['src'] === 'string' ? attrsRecord['src'] : '';

    if (!srcRaw) {
      return null;
    }

    const normalizedSrc = toApiMediaUrl(srcRaw) ?? srcRaw;
    const src = this.escapeHtml(normalizedSrc);
    const alt = this.escapeHtml(typeof attrsRecord?.['alt'] === 'string' ? attrsRecord['alt'] : this.title || 'Answer image');
    const title = this.escapeHtml(typeof attrsRecord?.['title'] === 'string' ? attrsRecord['title'] : '');
    const titleAttr = title ? ` title="${title}"` : '';

    return `<img src="${src}" alt="${alt}" loading="lazy"${titleAttr} />`;
  }

  private renderHeadingNode(record: Record<string, unknown>, content: string): string {
    const attrs = record['attrs'];
    const attrsRecord = attrs && typeof attrs === 'object' ? (attrs as Record<string, unknown>) : null;
    const levelRaw = typeof attrsRecord?.['level'] === 'number' ? attrsRecord['level'] : 2;
    const level = Math.min(6, Math.max(1, levelRaw));
    return `<h${level}>${content}</h${level}>`;
  }

  private wrapNode(type: string | null, content: string): string | null {
    const wrappers: Record<string, [string, string]> = {
      paragraph: ['<p>', '</p>'],
      blockquote: ['<blockquote>', '</blockquote>'],
      bulletList: ['<ul>', '</ul>'],
      orderedList: ['<ol>', '</ol>'],
      listItem: ['<li>', '</li>'],
    };

    if (!type || !wrappers[type]) {
      return null;
    }

    const [openTag, closeTag] = wrappers[type];
    return `${openTag}${content}${closeTag}`;
  }

  private renderChildContent(content: unknown): string {
    if (!Array.isArray(content)) {
      return '';
    }

    return content
      .map((item) => this.renderNode(item))
      .filter((item): item is string => typeof item === 'string')
      .join('');
  }

  private applyMarks(value: string, marks: unknown): string {
    if (!Array.isArray(marks) || marks.length === 0) {
      return value;
    }

    return marks.reduce((result, mark) => {
      if (!mark || typeof mark !== 'object') {
        return result;
      }

      const record = mark as Record<string, unknown>;
      const type = typeof record['type'] === 'string' ? record['type'] : '';

      if (type === 'bold' || type === 'strong') {
        return `<strong>${result}</strong>`;
      }

      if (type === 'italic' || type === 'em') {
        return `<em>${result}</em>`;
      }

      if (type === 'underline') {
        return `<u>${result}</u>`;
      }

      if (type === 'strike') {
        return `<s>${result}</s>`;
      }

      if (type === 'link') {
        const attrs = record['attrs'];
        const attrsRecord = attrs && typeof attrs === 'object' ? (attrs as Record<string, unknown>) : null;
        const href = typeof attrsRecord?.['href'] === 'string' ? attrsRecord['href'] : '#';
        const escapedHref = this.escapeHtml(href);
        return `<a href="${escapedHref}" target="_blank" rel="noopener noreferrer">${result}</a>`;
      }

      return result;
    }, value);
  }

  private tryExtractHtmlFromUnknown(value: unknown): string | null {
    if (typeof value === 'string') {
      return this.tryExtractHtml(value);
    }

    if (!value || typeof value !== 'object') {
      return null;
    }

    const record = value as Record<string, unknown>;
    const directHtml = this.readDirectHtml(record);
    if (directHtml) {
      return directHtml;
    }

    return this.readNestedHtml(record);
  }

  private readDirectHtml(record: Record<string, unknown>): string | null {
    const directHtml = this.tryExtractHtml(typeof record['html'] === 'string' ? record['html'] : null);
    if (directHtml) {
      return directHtml;
    }

    return this.tryExtractHtml(typeof record['content'] === 'string' ? record['content'] : null);
  }

  private readNestedHtml(record: Record<string, unknown>): string | null {
    const values = Object.values(record);
    for (const entry of values) {
      if (Array.isArray(entry)) {
        const arrayHtml = this.readHtmlFromArray(entry);
        if (arrayHtml) {
          return arrayHtml;
        }
        continue;
      }

      const nestedHtml = this.tryExtractHtmlFromUnknown(entry);
      if (nestedHtml) {
        return nestedHtml;
      }
    }

    return null;
  }

  private readHtmlFromArray(values: unknown[]): string | null {
    for (const nestedEntry of values) {
      const nestedHtml = this.tryExtractHtmlFromUnknown(nestedEntry);
      if (nestedHtml) {
        return nestedHtml;
      }
    }

    return null;
  }

  private toSafeHtml(value: string): SafeHtml {
    const sanitized = DOMPurify.sanitize(value, {
      ALLOWED_TAGS: [
        'p', 'div', 'span', 'strong', 'em', 'u', 's', 'b', 'i', 'br', 'ul', 'ol', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'img',
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style', 'src', 'alt', 'title', 'width', 'height', 'loading'],
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
      KEEP_CONTENT: true,
    });

    return this.sanitizer.bypassSecurityTrustHtml(sanitized);
  }

  private extractTextFromHtml(value: string): string {
    return value
      .replaceAll(/<br\s*\/?>/gi, '\n')
      .replaceAll(/<[^>]+>/g, ' ')
      .replaceAll(/\s+/g, ' ')
      .trim();
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  onImageError(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLImageElement && !target.src.endsWith(QuestionComponent.fallbackImage)) {
      target.src = QuestionComponent.fallbackImage;
    }
  }

  async downloadPdf(): Promise<void> {
    const titleText = this.title || 'Question';
    const answerHtml = this.prepareAnswerHtmlForPdf();
    let exportContainer: HTMLDivElement | null = null;

    try {
      const jsPDF = (await import('jspdf')).jsPDF;
      const html2canvas = (await import('html2canvas')).default;
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

      exportContainer = document.createElement('div');
      exportContainer.style.position = 'fixed';
      exportContainer.style.left = '-10000px';
      exportContainer.style.top = '0';
      exportContainer.style.width = '794px';
      exportContainer.style.background = '#ffffff';
      exportContainer.style.color = '#111827';
      exportContainer.style.padding = '32px';
      exportContainer.style.fontFamily = 'Arial, sans-serif';
      exportContainer.style.lineHeight = '1.65';

      const questionImage = this.imageUrl
        ? `<img src="${this.escapeHtml(this.imageUrl)}" alt="${this.escapeHtml(titleText)}" style="max-width:100%;height:auto;border-radius:8px;margin:12px 0 20px;" />`
        : '';

      exportContainer.innerHTML = `
        <h1 style="font-size:28px;line-height:1.3;margin:0 0 16px;color:#111827;">${this.escapeHtml(titleText)}</h1>
        ${questionImage}
        <div style="font-size:16px;line-height:1.75;">${answerHtml}</div>
      `;

      document.body.appendChild(exportContainer);
      await this.inlineContainerImages(exportContainer);
      await this.waitForImages(exportContainer);

      const canvas = await html2canvas(exportContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const imageHeight = (canvas.height * pageWidth) / canvas.width;

      let heightLeft = imageHeight;
      let position = 0;

      doc.addImage(imgData, 'JPEG', 0, position, pageWidth, imageHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imageHeight;
        doc.addPage();
        doc.addImage(imgData, 'JPEG', 0, position, pageWidth, imageHeight);
        heightLeft -= pageHeight;
      }

      const safeTitle = titleText.replaceAll(/[^a-z0-9-]/gi, '_').slice(0, 60);
      doc.save(`${safeTitle || 'question'}.pdf`);
    } catch {
      // fallback: open print dialog for manual PDF
      const printWindow = globalThis.open('', '_blank');
      if (printWindow) {
        const html = `
          <html>
            <head>
              <title>${this.escapeHtml(titleText)}</title>
              <style>
                body { font-family: Arial, sans-serif; color: #111827; line-height: 1.7; padding: 24px; }
                h1 { margin: 0 0 16px; }
                img { max-width: 100%; height: auto; display: block; margin: 12px 0; }
              </style>
            </head>
            <body>
              <h1>${this.escapeHtml(titleText)}</h1>
              ${this.imageUrl ? `<img src="${this.escapeHtml(this.imageUrl)}" alt="${this.escapeHtml(titleText)}" />` : ''}
              <div>${answerHtml}</div>
            </body>
          </html>
        `;
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }
    } finally {
      exportContainer?.remove();
    }
  }

  private prepareAnswerHtmlForPdf(): string {
    const rawHtml = this.answerHtmlRaw ?? this.escapeHtml(this.answer || '').replaceAll('\n', '<br/>');
    return this.normalizeHtmlMediaSources(rawHtml);
  }

  private normalizeHtmlMediaSources(html: string): string {
    const parser = new DOMParser();
    const documentNode = parser.parseFromString(`<div id="pdf-answer-root">${html}</div>`, 'text/html');
    const root = documentNode.body.querySelector('#pdf-answer-root');
    if (!root) {
      return html;
    }

    const images = Array.from(root.querySelectorAll('img'));
    for (const image of images) {
      const srcCandidate = (image.getAttribute('src') ?? image.dataset['src'] ?? '').trim();
      if (!srcCandidate) {
        continue;
      }

      const normalizedSrc = this.isInlineImageSource(srcCandidate)
        ? srcCandidate
        : (toApiMediaUrl(srcCandidate) ?? srcCandidate);

      image.setAttribute('src', normalizedSrc);
      image.removeAttribute('srcset');
      image.removeAttribute('sizes');
      image.setAttribute('loading', 'eager');
      image.style.maxWidth = '100%';
      image.style.height = 'auto';
      image.style.display = 'block';
      image.style.margin = '12px 0';
    }

    return root.innerHTML;
  }

  private async inlineContainerImages(container: HTMLElement): Promise<void> {
    const images = Array.from(container.querySelectorAll('img'));
    if (images.length === 0) {
      return;
    }

    await Promise.all(
      images.map(async (image) => {
        const source = (image.getAttribute('src') ?? '').trim();
        if (!source || this.isInlineImageSource(source)) {
          return;
        }

        const normalizedSource = toApiMediaUrl(source) ?? source;
        image.setAttribute('crossorigin', 'anonymous');

        try {
          const response = await fetch(normalizedSource, {
            mode: 'cors',
            cache: 'force-cache',
          });

          if (!response.ok) {
            image.setAttribute('src', normalizedSource);
            return;
          }

          const blob = await response.blob();
          const dataUrl = await this.convertBlobToDataUrl(blob);
          image.setAttribute('src', dataUrl);
        } catch {
          image.setAttribute('src', normalizedSource);
        }
      }),
    );
  }

  private isInlineImageSource(value: string): boolean {
    return value.startsWith('data:') || value.startsWith('blob:');
  }

  private convertBlobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
          return;
        }

        reject(new Error('Failed to convert image blob to data URL.'));
      };
      reader.onerror = () => {
        reject(reader.error ?? new Error('Unable to read image blob.'));
      };
      reader.readAsDataURL(blob);
    });
  }

  private async waitForImages(container: HTMLElement): Promise<void> {
    const images = Array.from(container.querySelectorAll('img'));
    if (images.length === 0) {
      return;
    }

    await Promise.all(
      images.map(
        (image) =>
          new Promise<void>((resolve) => {
            if (image.complete) {
              resolve();
              return;
            }

            image.addEventListener('load', () => resolve(), { once: true });
            image.addEventListener('error', () => resolve(), { once: true });
          }),
      ),
    );
  }

  async share(): Promise<void> {
    const url = this.getShareUrl();
    try {
      // Use Web Share API if available (navigator.share is not in strict TS types for all browsers)
      const navigatorWithShare = (globalThis.navigator as { share?: (data: ShareData) => Promise<void> });
      if (navigatorWithShare.share) {
        await navigatorWithShare.share({ title: this.title, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        // minimal feedback - in-app toasts would be better
        globalThis.alert('Link copied to clipboard');
      } else {
        globalThis.prompt('Copy this link', url);
      }
    } catch {
      // ignore share errors
    }
  }

  private getShareUrl(): string {
    try {
      const url = new URL(globalThis.location.href);
      // Ensure only the id (and categories) are present in the shared URL to avoid leaking content
      url.searchParams.delete('title');
      url.searchParams.set('id', this.id);
      return url.toString();
    } catch {
      return globalThis.location.href;
    }
  }
}
