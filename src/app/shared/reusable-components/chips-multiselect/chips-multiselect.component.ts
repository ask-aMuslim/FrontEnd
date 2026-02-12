
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  OnDestroy,
  output,
  Renderer2,
  signal,
} from '@angular/core';

export interface ChipOption<T = any> {
  value: T;
  label: string;
}

@Component({
  selector: 'app-chips-multiselect',
  standalone: true,
  imports: [],
  templateUrl: './chips-multiselect.component.html',
  styleUrls: ['./chips-multiselect.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipsMultiselectComponent<T = any> implements OnDestroy {
  options = input.required<ChipOption<T>[]>();
  selected = input.required<ChipOption<T>[]>();
  placeholder = input('Select options');
  icon = input<string>('/icons/icons-24/arrow-down.svg');
  error = input<boolean>(false);

  add = output<ChipOption<T>>();
  remove = output<ChipOption<T>>();

  isOpen = signal(false);

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2,
  ) {
    this.renderer.listen('document', 'click', (event: MouseEvent) => {
      if (!this.elementRef.nativeElement.contains(event.target)) {
        this.isOpen.set(false);
      }
    });
  }

  ngOnDestroy(): void {}

  toggleDropdown(): void {
    this.isOpen.set(!this.isOpen());
  }

  onAdd(option: ChipOption<T>): void {
    this.add.emit(option);
    this.isOpen.set(false);
  }

  onRemove(event: Event, option: ChipOption<T>): void {
    event.stopPropagation();
    this.remove.emit(option);
  }
}
