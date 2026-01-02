import { Component } from '@angular/core';
import { MuslimTubeSidebarComponent } from './sidebar/sidebar.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-muslim-tube',
  imports: [MuslimTubeSidebarComponent, RouterOutlet],
  templateUrl: './muslim-tube.component.html',
  styleUrl: './muslim-tube.component.scss',
})
export class MuslimTubeComponent {}
