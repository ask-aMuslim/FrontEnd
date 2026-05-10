import { Component, Input } from '@angular/core';


/**
 * Container Section Component
 * 
 * A reusable component that provides full-width backgrounds with constrained content.
 * Use this component to wrap page sections that need backgrounds extending to viewport edges
 * while keeping content within a maximum width container.
 * 
 * @example
 * ```html
 * <app-container-section [containerSize]="'4xl'" [bgClass]="'bg-gray-50'">
 *   <h2>Your Section Title</h2>
 *   <p>Your content here...</p>
 * </app-container-section>
 * ```
 */
@Component({
    selector: 'app-container-section',
    standalone: true,
    imports: [],
    template: `
    <section [class]="sectionClasses">
      <div [class]="containerClasses">
        <ng-content></ng-content>
      </div>
    </section>
  `,
    styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class ContainerSectionComponent {
    /**
     * Container size - determines max-width of content
     * Options: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full'
     * @default '4xl'
     */
    @Input() containerSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full' = '4xl';

    /**
     * Additional CSS classes for the section (background) element
     */
    @Input() bgClass: string = '';

    /**
     * Additional CSS classes for the container (content) element
     */
    @Input() contentClass: string = '';

    /**
     * Apply vertical padding to the section
     * @default true
     */
    @Input() applyPadding: boolean = true;

    get sectionClasses(): string {
        const classes = ['full-width-section'];
        if (this.applyPadding) {
            classes.push('py-page');
        }
        if (this.bgClass) {
            classes.push(this.bgClass);
        }
        return classes.join(' ');
    }

    get containerClasses(): string {
        const classes = ['container'];
        if (this.containerSize !== 'full') {
            classes.push(`container-${this.containerSize}`);
        }
        if (this.contentClass) {
            classes.push(this.contentClass);
        }
        return classes.join(' ');
    }
}
