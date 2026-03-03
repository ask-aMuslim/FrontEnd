import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
    selector: 'app-contact',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './contact.component.html',
    styleUrls: ['./contact.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent {
    private fb = new FormBuilder();

    contactForm = this.fb.group({
        name: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        message: ['', [Validators.required, Validators.minLength(10)]],
    });

    isSubmitting = false;
    isSuccess = false;

    onSubmit() {
        if (this.contactForm.invalid) {
            this.contactForm.markAllAsTouched();
            return;
        }

        this.isSubmitting = true;

        // Simulate API call
        setTimeout(() => {
            this.isSubmitting = false;
            this.isSuccess = true;
            this.contactForm.reset();

            // Reset success state after a few seconds
            setTimeout(() => {
                this.isSuccess = false;
            }, 5000);
        }, 1500);
    }

    isFieldInvalid(field: string): boolean {
        const control = this.contactForm.get(field);
        return control ? control.invalid && control.touched : false;
    }
}
