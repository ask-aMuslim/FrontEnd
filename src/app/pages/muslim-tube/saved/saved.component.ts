import { Component } from '@angular/core';


@Component({
  standalone: true,
  selector: 'app-mt-saved',
  imports: [],
  template: `<div class="p-6">
    <h2 class="text-2xl font-semibold">Saved</h2>
    <p class="mt-2 text-muted">Saved videos and playlists will appear here.</p>
  </div>`,
})
export class SavedComponent {}
