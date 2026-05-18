import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../../shared/reusable-components/header/header.component';
import { FooterComponent } from '../../../shared/reusable-components/footer/footer.component';
import { AnnouncementBarComponent } from '../../../shared/reusable-components/announcement-bar/announcement-bar.component';

@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, AnnouncementBarComponent],
  templateUrl: './app-layout.component.html',
  styleUrls: ['./app-layout.component.scss'],
})
export class AppLayoutComponent {

}
