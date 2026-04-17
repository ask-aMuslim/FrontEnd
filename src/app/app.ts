import { Component, OnDestroy, inject, PLATFORM_ID, afterNextRender } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { GlobalLoadingService } from './core/services/global-loading.service';
import { LateImageLoadingService } from './core/services/late-image-loading.service';
import * as AOS from 'aos';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App implements OnDestroy {
  protected readonly title = 'AskAMuslim';
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly globalLoadingService = inject(GlobalLoadingService);
  private readonly lateImageLoadingService = inject(LateImageLoadingService);

  // Use the debounced/min-visible overlay boolean
  protected readonly globalIsLoading = this.globalLoadingService.isVisible;

  constructor() {
    this.lateImageLoadingService.initialize();

    if (this.isBrowser) {
      afterNextRender(() => {
        AOS.init({
          duration: 500,
          easing: 'ease-out-quad',
          once: true,
          offset: 50
        });

        const window = this.document.defaultView;

        // Scroll to top on route navigation (browser only)
        this.router.events
          .pipe(
            filter((event) => event instanceof NavigationEnd),
          )
          .subscribe(() => {
            window?.scrollTo(0, 0);
            setTimeout(() => {
              AOS.refresh();
            }, 100);
          });
      });
    }
  }

  ngOnDestroy(): void {
    this.lateImageLoadingService.destroy();
  }
}


