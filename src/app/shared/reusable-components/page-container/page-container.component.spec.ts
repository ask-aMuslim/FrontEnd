import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';

import { PageContainerComponent } from './page-container.component';

@Component({
    standalone: true,
    imports: [PageContainerComponent],
    template: `<app-page-container>Test Content</app-page-container>`,
})
class TestHostComponent { }

describe('PageContainerComponent', () => {
    let component: PageContainerComponent;
    let fixture: ComponentFixture<PageContainerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PageContainerComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(PageContainerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have default size of lg', () => {
        expect(component.size).toBe('lg');
    });

    it('should render with correct size class', () => {
        const element = fixture.nativeElement.querySelector('.page-container');
        expect(element.classList.contains('page-container--lg')).toBeTruthy();
    });

    it('should have fullWidth as false by default', () => {
        expect(component.fullWidth).toBeFalsy();
    });

    it('should render content', () => {
        const hostFixture = TestBed.createComponent(TestHostComponent);
        hostFixture.detectChanges();
        const container = hostFixture.nativeElement.querySelector('.page-container') as HTMLElement | null;
        expect(container).toBeTruthy();
        expect(container?.textContent).toContain('Test Content');
    });

    it('should have page-container class', () => {
        const element = fixture.nativeElement.querySelector('.page-container');
        expect(element.classList.contains('page-container')).toBeTruthy();
    });
});
