import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../../../shared/reusable-components/header/header';
import { Footer } from '../../../shared/reusable-components/footer/footer';
import { AnnouncementBar } from '../../../shared/reusable-components/announcement-bar/announcement-bar';

@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [RouterOutlet, Header, Footer, AnnouncementBar],
  templateUrl: './app-layout.component.html',
  styleUrls: ['./app-layout.component.scss'],
})
export class AppLayoutComponent {

}
