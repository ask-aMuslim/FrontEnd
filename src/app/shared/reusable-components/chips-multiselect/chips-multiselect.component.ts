
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

export interface ChipOption<T = unknown> {
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
export class ChipsMultiselectComponent<T = unknown> implements OnDestroy {
  options = input.required<ChipOption<T>[]>();
  selected = input.required<ChipOption<T>[]>();
  placeholder = input('Select options');
  icon = input<string>('/icons/icons-24/arrow-down.svg');
  error = input<boolean>(false);

  add = output<ChipOption<T>>();
  remove = output<ChipOption<T>>();

  isOpen = signal(false);

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private renderer: Renderer2,
  ) {
    this.renderer.listen('document', 'click', (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node) || !this.elementRef.nativeElement.contains(target)) {
        this.isOpen.set(false);
      }
    });
  }

  ngOnDestroy(): void { }

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
