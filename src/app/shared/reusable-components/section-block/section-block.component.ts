import { Component, Input, ChangeDetectionStrategy } from '@angular/core';


@Component({
    selector: 'app-section-block',
    standalone: true,
    imports: [],
    template: `
    <div class="section-block">
      <ng-content></ng-content>
    </div>
  `,
    styles: [`
    /* Global section-block styles are defined in containers.css */
    /* This component just provides a convenient wrapper */
  `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionBlockComponent {
    // Optional: allow override of container class if needed
    @Input() readonly customClass: string = '';
}
