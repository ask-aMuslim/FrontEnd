import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-mt-saved',
  imports: [CommonModule],
  template: `<div class="p-6">
    <h2 class="text-2xl font-semibold">Saved</h2>
    <p class="mt-2 text-muted">Saved videos and playlists will appear here.</p>
  </div>`,
})
export class SavedComponent {}
