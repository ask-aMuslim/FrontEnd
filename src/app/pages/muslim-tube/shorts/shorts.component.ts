import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-mt-shorts',
  imports: [CommonModule],
  template: `<div class="p-6">
    <h2 class="text-2xl font-semibold">Shorts</h2>
    <p class="mt-2 text-muted">Short-form videos will appear here.</p>
  </div>`,
})
export class ShortsComponent {}
