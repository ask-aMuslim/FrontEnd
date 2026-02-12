import { Component, Input } from '@angular/core';

import { RouterLink } from '@angular/router';

export type AcademyPageVariant = 'course' | 'lesson' | 'quiz';
export type AcademyLayoutMode = 'default' | 'quiz-progress';
export type AcademySidebarPosition = 'left' | 'right';

export interface AcademyBreadcrumbItem {
    label: string;
    link?: string | Array<string | number>;
}

@Component({
    selector: 'app-academy-page-shell',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './academy-page-shell.component.html',
    styleUrls: ['./academy-page-shell.component.scss'],
})
export class AcademyPageShellComponent {
    @Input() variant: AcademyPageVariant = 'course';
    @Input() layoutMode: AcademyLayoutMode = 'default';
    @Input() sidebarPosition: AcademySidebarPosition = 'right';
    @Input() showSidebar = true;
    @Input() isSidebarCollapsed = false;
    @Input() showBanner = true;

    @Input() bannerImageUrl = '';
    @Input() bannerAlt = 'Page banner';

    @Input() breadcrumbs: readonly AcademyBreadcrumbItem[] = [];
    @Input() currentBreadcrumb = '';

    get hasBreadcrumbs(): boolean {
        return this.breadcrumbs.length > 0 || this.currentBreadcrumb.length > 0;
    }

    get hasBanner(): boolean {
        return this.bannerImageUrl.trim().length > 0;
    }
}
