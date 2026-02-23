
import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { QasService } from '../../../../core/services/qas.service';
import { asRecord, getValue, toStringValue, toStringArray } from '../../../../core/helpers/api-response.helper';
import { toApiMediaUrl } from '../../../../core/helpers/media-url.helper';

@Component({
  selector: 'app-question',
  standalone: true,
  imports: [],
  templateUrl: './question.component.html',
  styleUrls: ['./question.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionComponent implements OnDestroy {
  private readonly destroy$ = new Subject<void>();

  id = '';
  title = '';
  description = '';
  answer = '';
  categories: string[] = [];
  imageUrl: string | null = null;
  isSaved = false;

  readonly saveIcon = '/icons/icons-24/save.svg';
  readonly savedIcon = '/icons/icons-24/saved.svg';
  readonly shareIcon = '/icons/icons-24/share.svg';
  readonly downloadIcon = '/icons/icons-24/download.svg';

  private static readonly fallbackImage = '/images/events-picture.png';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly qasService: QasService,
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

        const mappedTitle = toStringValue(getValue(record, 'questionText', 'QuestionText', 'title', 'Title'));
        const mappedQuestion = toStringValue(getValue(record, 'description', 'Description', 'question', 'Question'));
        const mappedAnswer = toStringValue(getValue(record, 'answerText', 'AnswerText', 'answer', 'Answer'));
        const mappedImage = toApiMediaUrl(
          toStringValue(getValue(record, 'imageUrl', 'ImageUrl', 'questionImage', 'QuestionImage')),
        );

        this.title = mappedTitle ?? this.title;
        this.description = mappedQuestion ?? this.description;
        this.answer = mappedAnswer ?? this.answer;
        this.categories = toStringArray(getValue(record, 'categories', 'Categories', 'tags', 'Tags')) ?? this.categories;
        this.imageUrl = mappedImage ?? null;
      },
      error: () => void 0,
    });
  }

  onImageError(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLImageElement && !target.src.endsWith(QuestionComponent.fallbackImage)) {
      target.src = QuestionComponent.fallbackImage;
    }
  }

  async downloadPdf(): Promise<void> {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const titleText = this.title || 'Question';
      const bodyText = (this.answer || '').trim() || (this.description || '').trim();
      doc.setFontSize(16);
      doc.text(titleText, 10, 10);
      doc.setFontSize(12);
      const split = doc.splitTextToSize(bodyText, 180);
      doc.text(split, 10, 20);
      const safeTitle = titleText.replaceAll(/[^a-z0-9-]/gi, '_').slice(0, 60);
      doc.save(`${safeTitle || 'question'}.pdf`);
    } catch {
      // fallback: open print dialog for manual PDF
      const printWindow = globalThis.open('', '_blank');
      if (printWindow) {
        const html = `<html><head><title>${this.title}</title></head><body><h1>${this.title}</h1><pre>${this.answer || this.description}</pre></body></html>`;
        printWindow.document.open();
        printWindow.document.close();
        // populate body safely
        if (printWindow.document.body) {
          printWindow.document.body.innerHTML = html;
        } else {
          // in case body isn't ready yet
          printWindow.document.addEventListener('DOMContentLoaded', () => {
            const body = printWindow.document.body;
            if (body) {
              body.innerHTML = html;
            }
          });
        }
        printWindow.focus();
        printWindow.print();
      }
    }
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
      url.searchParams.delete('description');
      url.searchParams.set('id', this.id);
      return url.toString();
    } catch {
      return globalThis.location.href;
    }
  }
}
