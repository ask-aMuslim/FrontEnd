import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsFacade, FormDto } from '../../api/facades/forms.facade';
import { SeoService } from '../../core/services/seo.service';

interface FormCard {
  id: string;
  title: string;
  description: string;
  externalUrl?: string;
}

const STATIC_GOOGLE_FORMS: FormCard[] = [
  {
    id: 'join-ask-a-muslim',
    title: 'Join the Ask A Muslim Team',
    description: 'Register to join our team and contribute to global da’wah outreach.',
  },
  {
    id: 'revert-buddy-program',
    title: 'Revert Buddy Program',
    description: 'Connect with a mentor or become a buddy to support new Muslims.',
  },
  {
    id: 'dawah-workshop',
    title: 'Request a Da’wah Workshop',
    description: 'Request an interactive workshop to learn effective da’wah techniques.',
  },
  {
    id: 'dawah-table',
    title: 'Establish a Da’wah Table',
    description: 'Apply to set up and manage a da’wah table in your local area or campus.',
  },
  {
    id: 'new-muslim-support',
    title: 'New Muslim Support',
    description: 'Guidance, mentorship, and resources for new Muslims.',
    externalUrl: 'https://www.noorohio.org/newmuslims/',
  },
];

@Component({
  selector: 'app-forms',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './forms.component.html',
  styleUrls: ['./forms.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormsComponent implements OnInit {
  private static readonly emptyDescription = 'No description has been added yet.';
  private static readonly loadFailureMessage = 'Unable to load forms right now.';
  private static readonly defaultPageSize = 9;

  private readonly formsFacade = inject(FormsFacade);
  private readonly seoService = inject(SeoService);

  readonly isLoading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly forms = signal<FormDto[]>([]);
  readonly searchTerm = signal('');
  readonly currentPage = signal(1);
  readonly pageSize = signal(FormsComponent.defaultPageSize);
  readonly hasNextPage = signal(false);

  readonly formCards = computed<FormCard[]>(() => {
    const apiForms = this.forms().map((form) => ({
      id: form.id,
      title: this.resolveTitle(form),
      description: this.resolveDescription(form),
    }));

    const search = this.searchTerm().trim().toLowerCase();

    // Include static Google forms that aren't already represented by an API form
    const staticForms = STATIC_GOOGLE_FORMS.filter((staticForm) => {
      const isAlreadyInApi = apiForms.some((apiForm) =>
        (apiForm.title.toLowerCase().includes('join') || apiForm.title.toLowerCase().includes('ask a muslim'))
        && staticForm.id === 'join-ask-a-muslim'
      );
      if (isAlreadyInApi) {
        return false;
      }
      if (!search) {
        return true;
      }
      return (
        staticForm.title.toLowerCase().includes(search) ||
        staticForm.description.toLowerCase().includes(search)
      );
    });

    return [...apiForms, ...staticForms];
  });

  readonly hasForms = computed(() => this.formCards().length > 0);
  readonly isFirstPage = computed(() => this.currentPage() === 1);
  readonly showPagination = computed(
    () => this.currentPage() > 1 || this.hasNextPage(),
  );

  private resolveTitle(form: FormDto): string {
    const title = form.title?.trim() || 'Form';
    return title.replace(/AskAMuslim/g, 'Ask A Muslim');
  }

  ngOnInit(): void {
    this.loadForms();
    this.seoService.setMetaTags({
      title: 'Forms & Registrations',
      description: 'Fill out and submit forms for different community services, registrations, and requests at Ask A Muslim.',
      keywords: ['Islamic community forms', 'registration forms', 'scholar inquiry', 'Ask A Muslim requests']
    });
  }

  trackById(_index: number, item: FormCard): string {
    return item.id;
  }

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
  }

  applySearch(): void {
    this.currentPage.set(1);
    this.loadForms();
  }

  clearSearch(): void {
    if (!this.searchTerm().trim()) {
      return;
    }

    this.searchTerm.set('');
    this.applySearch();
  }

  prevPage(): void {
    if (this.isFirstPage()) {
      return;
    }

    this.currentPage.update((page) => Math.max(1, page - 1));
    this.loadForms();
  }

  nextPage(): void {
    if (!this.hasNextPage()) {
      return;
    }

    this.currentPage.update((page) => page + 1);
    this.loadForms();
  }

  private loadForms(): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.hasNextPage.set(false);

    const trimmedSearch = this.searchTerm().trim();
    const pageSize = this.pageSize();

    this.formsFacade
      .getForms({
        pageNumber: this.currentPage(),
        pageSize,
        searchTerm: trimmedSearch.length > 0 ? trimmedSearch : undefined,
        isPublished: true,
      })
      .subscribe({
        next: (forms) => {
          this.forms.set(forms ?? []);
          this.hasNextPage.set((forms ?? []).length >= pageSize);
          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          this.loadError.set(this.resolveErrorMessage(error));
          this.isLoading.set(false);
        },
      });
  }

  private resolveDescription(form: FormDto): string {
    const description = form.description?.trim();
    if (description && description.length > 0) {
      return description.replace(/AskAMuslim/g, 'Ask A Muslim');
    }
    const titleLower = (form.title || '').toLowerCase();
    if (titleLower.includes('join') || titleLower.includes('ask a muslim') || titleLower.includes('askamuslim')) {
      return 'Register to join our team and contribute to global da’wah outreach.';
    }
    if (titleLower.includes('table') || titleLower.includes('establish')) {
      return 'Apply to set up and manage a da’wah table in your local area or campus.';
    }
    if (titleLower.includes('workshop')) {
      return 'Request an interactive workshop to learn effective da’wah techniques.';
    }
    if (titleLower.includes('buddy') || titleLower.includes('revert')) {
      return 'Connect with a mentor or become a buddy to support new Muslims.';
    }
    if (titleLower.includes('new muslim') || titleLower.includes('support')) {
      return 'Access dedicated guidance, mentorship, and resources for new Muslims.';
    }
    return FormsComponent.emptyDescription;
  }

  private resolveErrorMessage(error: unknown): string {
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message?: unknown }).message === 'string'
    ) {
      return (error as { message: string }).message;
    }

    return FormsComponent.loadFailureMessage;
  }
}
