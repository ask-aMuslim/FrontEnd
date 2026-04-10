import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, Renderer2, RendererFactory2, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LateImageLoadingService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly rendererFactory = inject(RendererFactory2);
  private readonly renderer: Renderer2 = this.rendererFactory.createRenderer(null, null);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private observer: MutationObserver | null = null;
  private readonly trackedImages = new Set<HTMLImageElement>();
  private readonly listenerCleanup = new WeakMap<HTMLImageElement, Array<() => void>>();

  initialize(): void {
    if (!this.isBrowser || this.observer) {
      return;
    }

    this.hydrateExistingImages();

    this.observer = new MutationObserver((mutations) => {
      this.processMutations(mutations);
    });

    this.observer.observe(this.document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'srcset'],
    });
  }

  destroy(): void {
    this.observer?.disconnect();
    this.observer = null;

    for (const image of this.trackedImages) {
      this.unbindImageListeners(image);
    }

    this.trackedImages.clear();
  }

  private hydrateExistingImages(): void {
    const images = this.document.querySelectorAll<HTMLImageElement>('img');

    for (const image of images) {
      this.prepareImage(image);
    }
  }

  private processMutations(mutations: MutationRecord[]): void {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.target instanceof HTMLImageElement) {
        this.prepareImage(mutation.target);
        continue;
      }

      for (const node of mutation.addedNodes) {
        this.processAddedNode(node);
      }
    }
  }

  private processAddedNode(node: Node): void {
    if (!(node instanceof Element)) {
      return;
    }

    if (node instanceof HTMLImageElement) {
      this.prepareImage(node);
      return;
    }

    const nestedImages = node.querySelectorAll<HTMLImageElement>('img');
    for (const image of nestedImages) {
      this.prepareImage(image);
    }
  }

  private prepareImage(image: HTMLImageElement): void {
    this.ensureBaseAttributes(image);
    this.bindImageListeners(image);

    if (image.complete && image.naturalWidth > 0) {
      this.markLoaded(image);
      return;
    }

    this.markPending(image);
  }

  private ensureBaseAttributes(image: HTMLImageElement): void {
    if (!image.getAttribute('loading')) {
      this.renderer.setAttribute(image, 'loading', 'lazy');
    }

    if (!image.getAttribute('decoding')) {
      this.renderer.setAttribute(image, 'decoding', 'async');
    }
  }

  private bindImageListeners(image: HTMLImageElement): void {
    if (this.listenerCleanup.has(image)) {
      return;
    }

    const removeLoadListener = this.renderer.listen(image, 'load', () => {
      this.markLoaded(image);
    });
    const removeErrorListener = this.renderer.listen(image, 'error', () => {
      this.markLoaded(image);
    });

    this.listenerCleanup.set(image, [removeLoadListener, removeErrorListener]);
    this.trackedImages.add(image);
  }

  private unbindImageListeners(image: HTMLImageElement): void {
    const cleanupCallbacks = this.listenerCleanup.get(image);
    if (!cleanupCallbacks) {
      return;
    }

    for (const cleanup of cleanupCallbacks) {
      cleanup();
    }

    this.listenerCleanup.delete(image);
    this.trackedImages.delete(image);
  }

  private markPending(image: HTMLImageElement): void {
    this.renderer.addClass(image, 'aam-late-image');
    this.renderer.removeClass(image, 'aam-late-image--loaded');
  }

  private markLoaded(image: HTMLImageElement): void {
    this.renderer.addClass(image, 'aam-late-image');
    this.renderer.addClass(image, 'aam-late-image--loaded');
  }
}