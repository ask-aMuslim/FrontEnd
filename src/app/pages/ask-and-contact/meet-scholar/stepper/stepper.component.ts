
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface Step {
  label: string;
  index: number;
}

@Component({
  selector: 'app-stepper',
  standalone: true,
  imports: [],
  templateUrl: './stepper.component.html',
  styleUrls: ['./stepper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepperComponent {
  steps = input.required<Step[]>();
  currentStep = input.required<number>();
}
