import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

@Component({
    selector: 'app-page-container',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div
      class="page-container"
      [ngClass]="[
        'page-container--' + size,
        { 'page-container--full-width': fullWidth }
      ]"
    >
      <ng-content></ng-content>
    </div>
  `,
    styleUrl: './page-container.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageContainerComponent {
    @Input() readonly size: ContainerSize = 'lg';
    @Input() readonly fullWidth: boolean = false;
}
