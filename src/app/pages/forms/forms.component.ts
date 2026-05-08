import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsFacade, FormDto } from '../../api/facades/forms.facade';

interface FormCard {
  id: string;
  title: string;
  description: string;
}

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

  readonly isLoading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly forms = signal<FormDto[]>([]);
  readonly searchTerm = signal('');
  readonly currentPage = signal(1);
  readonly pageSize = signal(FormsComponent.defaultPageSize);
  readonly hasNextPage = signal(false);

  readonly formCards = computed<FormCard[]>(() =>
    this.forms().map((form) => ({
      id: form.id,
      title: form.title,
      description: this.resolveDescription(form),
    })),
  );

  readonly hasForms = computed(() => this.formCards().length > 0);
  readonly isFirstPage = computed(() => this.currentPage() === 1);
  readonly showPagination = computed(
    () => this.currentPage() > 1 || this.hasNextPage(),
  );

  ngOnInit(): void {
    this.loadForms();
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
    return description && description.length > 0
      ? description
      : FormsComponent.emptyDescription;
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
