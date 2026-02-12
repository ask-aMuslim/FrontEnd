
import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
  categories: string[] = [];
  isSaved = false;

  readonly saveIcon = '/icons/icons-24/save.svg';
  readonly savedIcon = '/icons/icons-24/saved.svg';
  readonly shareIcon = '/icons/icons-24/share.svg';
  readonly eventImage = '/images/placeholder.png';
  readonly downloadIcon = '/icons/icons-24/download.svg';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.id = params.get('id') ?? '';
      this.title = params.get('title') ?? '';
      this.description = params.get('description') ?? '';
      const categoriesParam = params.get('categories');
      this.categories = categoriesParam ? this.parseCategories(categoriesParam) : [];
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
}
