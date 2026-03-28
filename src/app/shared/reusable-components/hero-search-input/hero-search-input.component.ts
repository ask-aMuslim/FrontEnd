import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    ElementRef,
    input,
    output,
    signal,
    ViewChild,
} from '@angular/core';


type HeroSearchVisualState = 'default' | 'hovering' | 'writing' | 'finished';

@Component({
    selector: 'app-hero-search-input',
    standalone: true,
    imports: [],
    templateUrl: './hero-search-input.component.html',
    styleUrls: ['./hero-search-input.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroSearchInputComponent implements AfterViewInit {
    @ViewChild('editableField') private readonly editableField?: ElementRef<HTMLDivElement>;

    readonly inputId = input<string>('hero-search');
    readonly name = input<string>('q');
    readonly value = input<string>('');
    readonly placeholder = input<string>('Do you have a religious question in mind?');
    readonly ariaLabel = input<string>('Search question');
    readonly disabled = input<boolean>(false);

    readonly valueChange = output<string>();
    readonly submitted = output<void>();

    private readonly hovered = signal(false);
    private readonly focused = signal(false);

    private readonly syncFieldEffect = effect(() => {
        const nextValue = this.value();
        const isFocused = this.focused();

        if (isFocused) {
            return;
        }

        this.syncEditableValue(nextValue);
    });

    readonly visualState = computed<HeroSearchVisualState>(() => {
        if (this.focused()) {
            return 'writing';
        }

        if (this.value().trim().length > 0) {
            return 'finished';
        }

        if (this.hovered()) {
            return 'hovering';
        }

        return 'default';
    });

    onMouseEnter(): void {
        if (this.disabled()) {
            return;
        }

        this.hovered.set(true);
    }

    onMouseLeave(): void {
        this.hovered.set(false);
    }

    onFocus(): void {
        if (this.disabled()) {
            return;
        }

        this.focused.set(true);
    }

    onBlur(): void {
        this.focused.set(false);
        this.syncEditableValue(this.value());
    }

    onEditableInput(event: Event): void {
        const target = event.target as HTMLDivElement | null;
        const nextValue = (target?.textContent ?? '').replaceAll('\u00a0', ' ').replaceAll('\n', ' ');
        this.valueChange.emit(nextValue);
    }

    onEditableKeydown(event: KeyboardEvent): void {
        if (event.key !== 'Enter') {
            return;
        }

        if (this.disabled()) {
            return;
        }

        event.preventDefault();
        this.submitted.emit();
    }

    ngAfterViewInit(): void {
        this.syncEditableValue(this.value());
    }

    private syncEditableValue(nextValue: string): void {
        const field = this.editableField?.nativeElement;
        if (!field) {
            return;
        }

        if ((field.textContent ?? '') !== nextValue) {
            field.textContent = nextValue;
        }
    }
}
