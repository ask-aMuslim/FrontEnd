
import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import DOMPurify from 'dompurify';
import { QasService } from '../../../../core/services/qas.service';
import { asRecord, extractArray, getValue, toStringValue, toStringArray } from '../../../../core/helpers/api-response.helper';
import { toApiMediaUrl } from '../../../../core/helpers/media-url.helper';
import { TiptapViewerComponent } from '../../../../shared/components/tiptap-viewer/tiptap-viewer.component';

interface ImageInliningReport {
  total: number;
  inlined: number;
  unresolved: number;
  unresolvedCrossOrigin: number;
}

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
  private readonly isBrowser: boolean;

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
    @Inject(PLATFORM_ID) private readonly platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

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
    void this.router.navigate(['/question-and-answer/topics']);
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

        const isPublished = getValue(data, 'isPublished', 'IsPublished');
        if (isPublished === false) {
          this.title = 'This answer is unavailable.';
          this.answer = '';
          this.answerViewerContent = null;
          this.questionHtml = null;
          this.answerHtmlRaw = null;
          this.imageUrl = null;
          this.changeDetectorRef.markForCheck();
          return;
        }

        const translations = extractArray(getValue(data, 'translations', 'Translations'));
        const firstTranslation = translations
          .map((translation) => asRecord(translation))
          .find((translation) => {
            const translationPublished = getValue(translation, 'isPublished', 'IsPublished');
            const translationDeleted = getValue(translation, 'isDeleted', 'IsDeleted');
            return translationPublished !== false && translationDeleted !== true;
          }) ?? null;

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

        if (!mappedAnswer?.trim()) {
          this.title = mappedTitle?.trim() || 'This answer is unavailable.';
          this.answer = '';
          this.answerViewerContent = null;
          this.questionHtml = mappedTitle ? this.toSafeHtml(this.escapeHtml(mappedTitle)) : null;
          this.answerHtmlRaw = null;
          this.imageUrl = mappedImage ?? null;
          this.changeDetectorRef.markForCheck();
          return;
        }

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
    if (!this.isBrowser) {
      return;
    }

    const titleText = this.title || 'Question';
    const answerHtml = this.getRenderedAnswerHtmlForPdf() ?? this.prepareAnswerHtmlForPdf();
    const richTextStyles = this.getPdfRichTextStyles();
    let exportContainer: HTMLDivElement | null = null;

    try {
      const jsPDF = (await import('jspdf')).jsPDF;
      const html2canvas = (await import('html2canvas')).default;
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

      exportContainer = globalThis.document.createElement('div');
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
        <style>${richTextStyles}</style>
        <div class="pdf-export-root">
          <h1 style="font-size:28px;line-height:1.3;margin:0 0 16px;color:#111827;">${this.escapeHtml(titleText)}</h1>
          ${questionImage}
          <div class="pdf-export-content">${answerHtml}</div>
        </div>
      `;

      globalThis.document.body.appendChild(exportContainer);
      const imageReport = await this.inlineContainerImages(exportContainer);
      await this.waitForImages(exportContainer);

      if (imageReport.unresolvedCrossOrigin > 0) {
        this.openPrintFallbackWindow(titleText, answerHtml, richTextStyles, this.imageUrl ?? null);
        return;
      }

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
      this.openPrintFallbackWindow(titleText, answerHtml, richTextStyles, this.imageUrl ?? null);
    } finally {
      exportContainer?.remove();
    }
  }

  private prepareAnswerHtmlForPdf(): string {
    const rawHtml = this.answerHtmlRaw ?? this.escapeHtml(this.answer || '').replaceAll('\n', '<br/>');
    return this.normalizeHtmlMediaSources(rawHtml);
  }

  private getRenderedAnswerHtmlForPdf(): string | null {
    if (!this.isBrowser) {
      return null;
    }

    const renderedAnswer = globalThis.document.querySelector('.paragraph .ProseMirror');
    if (!(renderedAnswer instanceof HTMLElement)) {
      return null;
    }

    return this.normalizeHtmlMediaSources(renderedAnswer.innerHTML);
  }

  private getPdfRichTextStyles(): string {
    return `
      .pdf-export-root {
        font-family: Arial, sans-serif;
        color: #111827;
        line-height: 1.65;
      }

      .pdf-export-root .pdf-export-content,
      .pdf-export-root .ProseMirror {
        font-size: 16px;
        line-height: 1.75;
      }

      .pdf-export-root :where(p, div) {
        margin: 0 0 0.9rem;
      }

      .pdf-export-root :where(h1, h2, h3, h4, h5, h6) {
        font-weight: 700;
        line-height: 1.35;
        margin: 1rem 0 0.6rem;
      }

      .pdf-export-root ul {
        list-style: disc;
        padding-inline-start: 1.5rem;
        margin: 0 0 0.9rem;
      }

      .pdf-export-root ul ul {
        list-style: circle;
      }

      .pdf-export-root ul ul ul {
        list-style: square;
      }

      .pdf-export-root ol {
        list-style: decimal;
        padding-inline-start: 1.5rem;
        margin: 0 0 0.9rem;
      }

      .pdf-export-root li {
        margin: 0.2rem 0;
      }

      .pdf-export-root blockquote {
        border-inline-start: 3px solid #156b40;
        margin: 0.8rem 0;
        padding-inline-start: 0.75rem;
        color: #4b5563;
      }

      .pdf-export-root a {
        color: #156b40;
        text-decoration: underline;
        text-underline-offset: 2px;
      }

      .pdf-export-root img {
        display: block;
        max-width: 100% !important;
        height: auto !important;
        margin: 0.75rem auto;
        border-radius: 8px;
      }
    `;
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

  private async inlineContainerImages(container: HTMLElement): Promise<ImageInliningReport> {
    const images = Array.from(container.querySelectorAll('img'));
    const report: ImageInliningReport = {
      total: images.length,
      inlined: 0,
      unresolved: 0,
      unresolvedCrossOrigin: 0,
    };

    if (images.length === 0) {
      return report;
    }

    await Promise.all(
      images.map(async (image) => {
        const source = (image.getAttribute('src') ?? '').trim();
        if (!source || this.isInlineImageSource(source)) {
          if (source) {
            report.inlined += 1;
          }
          return;
        }

        const normalizedSource = toApiMediaUrl(source) ?? source;
        const dataUrl = await this.resolveImageDataUrl(normalizedSource);
        if (dataUrl) {
          image.setAttribute('src', dataUrl);
          report.inlined += 1;
          return;
        }

        image.setAttribute('crossorigin', 'anonymous');

        if (this.isCrossOriginSource(normalizedSource)) {
          report.unresolvedCrossOrigin += 1;
        }

        report.unresolved += 1;
        image.setAttribute('src', normalizedSource);
      }),
    );

    return report;
  }

  private async resolveImageDataUrl(source: string): Promise<string | null> {
    const authToken = this.readAccessTokenFromStorage();
    const requestOptions: RequestInit[] = authToken
      ? [
        {
          mode: 'cors',
          cache: 'force-cache',
          credentials: 'include',
        },
        {
          mode: 'cors',
          cache: 'force-cache',
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
        {
          mode: 'cors',
          cache: 'force-cache',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      ]
      : [
        {
          mode: 'cors',
          cache: 'force-cache',
          credentials: 'include',
        },
      ];

    for (const options of requestOptions) {
      try {
        const response = await globalThis.fetch(source, options);
        if (!response.ok) {
          continue;
        }

        const blob = await response.blob();
        if (blob.size === 0) {
          continue;
        }

        return await this.convertBlobToDataUrl(blob);
      } catch {
        continue;
      }
    }

    return null;
  }

  private readAccessTokenFromStorage(): string | null {
    if (!this.isBrowser) {
      return null;
    }

    try {
      const raw = globalThis.localStorage.getItem('aam_auth');
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as { accessToken?: unknown };
      return typeof parsed.accessToken === 'string' && parsed.accessToken.trim().length > 0
        ? parsed.accessToken
        : null;
    } catch {
      return null;
    }
  }

  private isCrossOriginSource(source: string): boolean {
    try {
      const sourceUrl = new URL(source, globalThis.location.href);
      return sourceUrl.origin !== globalThis.location.origin;
    } catch {
      return false;
    }
  }

  private openPrintFallbackWindow(
    titleText: string,
    contentHtml: string,
    richTextStyles: string,
    imageUrl: string | null,
  ): void {
    const printWindow = globalThis.open('', '_blank');
    if (!printWindow) {
      return;
    }

    const printDocument = printWindow.document;
    printDocument.title = this.escapeHtml(titleText);

    while (printDocument.head.firstChild) {
      printDocument.head.firstChild.remove();
    }

    while (printDocument.body.firstChild) {
      printDocument.body.firstChild.remove();
    }

    const style = printDocument.createElement('style');
    style.textContent = `
      @page { size: A4; margin: 16mm; }
      body { font-family: Arial, sans-serif; color: #111827; line-height: 1.65; }
      .pdf-export-content { font-size: 16px; line-height: 1.75; }
      ${richTextStyles}
    `;
    printDocument.head.appendChild(style);

    const title = printDocument.createElement('h1');
    title.style.fontSize = '28px';
    title.style.lineHeight = '1.3';
    title.style.margin = '0 0 16px';
    title.style.color = '#111827';
    title.textContent = titleText;
    printDocument.body.appendChild(title);

    if (imageUrl) {
      const image = printDocument.createElement('img');
      image.src = imageUrl;
      image.alt = titleText;
      image.style.maxWidth = '100%';
      image.style.height = 'auto';
      image.style.display = 'block';
      image.style.margin = '12px 0 20px';
      image.style.borderRadius = '8px';
      printDocument.body.appendChild(image);
    }

    const content = printDocument.createElement('div');
    content.className = 'pdf-export-content';
    content.innerHTML = contentHtml;
    printDocument.body.appendChild(content);

    printWindow.focus();
    globalThis.setTimeout(() => {
      printWindow.print();
    }, 350);
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
    if (!this.isBrowser) {
      return;
    }

    const url = this.getShareUrl();
    try {
      // Use Web Share API if available (navigator.share is not in strict TS types for all browsers)
      const navigatorWithShare = (globalThis.navigator as { share?: (data: ShareData) => Promise<void> });
      if (navigatorWithShare.share) {
        await navigatorWithShare.share({ title: this.title, url });
      } else if (globalThis.navigator.clipboard) {
        await globalThis.navigator.clipboard.writeText(url);
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
    if (!this.isBrowser) {
      return '';
    }

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
