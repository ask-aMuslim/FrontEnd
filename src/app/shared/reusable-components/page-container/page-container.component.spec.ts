import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageContainerComponent } from './page-container.component';

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
        const testContent = 'Test Content';
        fixture.nativeElement.innerHTML = `<app-page-container>${testContent}</app-page-container>`;
        fixture.detectChanges();
        const container = fixture.nativeElement.querySelector('.page-container');
        expect(container).toBeTruthy();
    });

    it('should have page-container class', () => {
        const element = fixture.nativeElement.querySelector('.page-container');
        expect(element.classList.contains('page-container')).toBeTruthy();
    });
});
