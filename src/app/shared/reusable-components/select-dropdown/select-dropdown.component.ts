import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  OnDestroy,
  output,
  Renderer2,
  signal,
} from '@angular/core';

export interface SelectOption<T = unknown> {
  value: T;
  label: string;
}

@Component({
  selector: 'app-select-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './select-dropdown.component.html',
  styleUrl: './select-dropdown.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectDropdownComponent<T = unknown> implements OnDestroy {
  options = input.required<SelectOption<T>[]>();
  value = input<T | null>(null);
  placeholder = input<string>('Select');
  error = input<boolean>(false);
  icon = input<string>('/icons/icons-24/arrow-down.svg');

  open = signal(false);
  select = output<T>();

  private unlistener: (() => void) | null = null;

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2,
  ) {
    this.renderer.listen('document', 'click', (event: MouseEvent) => {
      if (!this.elementRef.nativeElement.contains(event.target)) {
        this.open.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.unlistener?.();
  }

  selectedLabel = computed(() => this.options().find((o) => o.value === this.value())?.label);

  toggle(): void {
    this.open.update((v) => !v);
  }

  onSelect(option: SelectOption<T>): void {
    this.select.emit(option.value);
    this.open.set(false);
  }
}
