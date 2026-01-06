import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InlineSvgDirective } from '../../directives/inline-svg.directive';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, InlineSvgDirective],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss',
})
export class PaginationComponent {
  @Input() pages: number[] = [];
  @Input() currentPage: number = 1;
  @Input() arrowLeftIcon: string = '';
  @Input() arrowRightIcon: string = '';

  @Output() prevPage = new EventEmitter<void>();
  @Output() nextPage = new EventEmitter<void>();
  @Output() goToPage = new EventEmitter<number>();

  onPrevPage(): void {
    this.prevPage.emit();
  }

  onNextPage(): void {
    this.nextPage.emit();
  }

  onGoToPage(page: number): void {
    this.goToPage.emit(page);
  }

  trackByIndex(index: number): number {
    return index;
  }
}
