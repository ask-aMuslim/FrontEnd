import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-mt-videos',
  imports: [CommonModule],
  template: `<div class="p-6">
    <h2 class="text-2xl font-semibold">Videos</h2>
    <p class="mt-2 text-muted">Video list will appear here.</p>
  </div>`,
})
export class VideosComponent {}
