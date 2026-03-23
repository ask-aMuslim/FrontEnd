import { Component, inject, PLATFORM_ID } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { GlobalLoadingService } from './core/services/global-loading.service';
import * as AOS from 'aos';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {
  protected readonly title = 'AskAMuslim';
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly globalLoadingService = inject(GlobalLoadingService);

  // Use the debounced/min-visible overlay boolean
  protected readonly globalIsLoading = this.globalLoadingService.isVisible;

  constructor() {
    // Scroll to top on route navigation (browser only)
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        if (isPlatformBrowser(this.platformId)) {
          window.scrollTo(0, 0);
          setTimeout(() => {
            AOS.refresh();
          }, 100);
        }
      });

    if (isPlatformBrowser(this.platformId)) {
      AOS.init({
        duration: 500,
        easing: 'ease-out-quad',
        once: true,
        offset: 50
      });
    }
  }
}

