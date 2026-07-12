import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

export interface YouTubePlayer {
    getCurrentTime(): number;
    getDuration(): number;
    seekTo(seconds: number, allowSeekAhead?: boolean): void;
    destroy(): void;
}

export interface YouTubePlayerReadyEvent {
    target: YouTubePlayer;
}

export interface YouTubePlayerStateChangeEvent {
    target: YouTubePlayer;
    data: number;
}

export interface YouTubePlayerErrorEvent {
    data: number;
}

export const YOUTUBE_PLAYER_STATE = {
    UNSTARTED: -1,
    ENDED: 0,
    PLAYING: 1,
    PAUSED: 2,
    BUFFERING: 3,
    CUED: 5,
} as const;

export type YouTubePlayerState = (typeof YOUTUBE_PLAYER_STATE)[keyof typeof YOUTUBE_PLAYER_STATE];

export interface YouTubePlayerEvents {
    onReady?: (event: YouTubePlayerReadyEvent) => void;
    onStateChange?: (event: YouTubePlayerStateChangeEvent) => void;
    onError?: (event: YouTubePlayerErrorEvent) => void;
}

type YouTubePlayerConstructor = new (
    host: string | HTMLElement,
    options: {
        host?: string;
        videoId: string;
        playerVars: Record<string, string | number>;
        events: {
            onReady?: (event: YouTubePlayerReadyEvent) => void;
            onStateChange?: (event: YouTubePlayerStateChangeEvent) => void;
            onError?: (event: YouTubePlayerErrorEvent) => void;
        };
    },
) => YouTubePlayer;

interface YouTubeNamespace {
    Player: YouTubePlayerConstructor;
}

declare global {
    interface Window {
        YT?: YouTubeNamespace;
        onYouTubeIframeAPIReady?: () => void;
    }
}

@Injectable({ providedIn: 'root' })
export class YouTubePlayerService {
    private static readonly scriptId = 'aam-youtube-iframe-api';
    private static apiReadyPromise: Promise<void> | null = null;

    private readonly document = inject(DOCUMENT);
    private readonly platformId = inject(PLATFORM_ID);
    private readonly isBrowser = isPlatformBrowser(this.platformId);

    loadApi(): Promise<void> {
        if (!this.isBrowser) {
            return Promise.reject(new Error('YouTube API can only be loaded in the browser.'));
        }

        const window = this.document.defaultView;
        if (!window) {
            return Promise.reject(new Error('Window object is unavailable.'));
        }

        if (window.YT?.Player) {
            return Promise.resolve();
        }

        if (YouTubePlayerService.apiReadyPromise !== null) {
            return YouTubePlayerService.apiReadyPromise;
        }

        YouTubePlayerService.apiReadyPromise = new Promise<void>((resolve, reject) => {
            const existingScript = this.document.getElementById(YouTubePlayerService.scriptId);
            if (existingScript && window.YT?.Player) {
                resolve();
                return;
            }

            const finalizeReady = () => {
                if (window.YT?.Player) {
                    resolve();
                    return;
                }

                reject(new Error('YouTube API loaded but player constructor is unavailable.'));
            };

            const previousReadyHandler = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => {
                previousReadyHandler?.();
                finalizeReady();
            };

            if (existingScript) {
                existingScript.addEventListener('load', finalizeReady, { once: true });
                existingScript.addEventListener('error', () => reject(new Error('Failed to load YouTube API script.')), {
                    once: true,
                });
                return;
            }

            const script = this.document.createElement('script');
            script.id = YouTubePlayerService.scriptId;
            script.src = 'https://www.youtube.com/iframe_api';
            script.async = true;
            script.defer = true;
            script.addEventListener('error', () => reject(new Error('Failed to load YouTube API script.')), { once: true });
            this.document.body.appendChild(script);
        });

        return YouTubePlayerService.apiReadyPromise;
    }

    async createPlayer(
        host: string | HTMLElement,
        videoId: string,
        events: YouTubePlayerEvents = {},
    ): Promise<YouTubePlayer> {
        await this.loadApi();

        const window = this.document.defaultView;
        const playerFactory = window?.YT?.Player;
        if (!playerFactory) {
            throw new Error('YouTube player constructor is unavailable.');
        }

        return await new Promise<YouTubePlayer>((resolve, reject) => {
            let isResolved = false;

            const player = new playerFactory(host, {
                host: 'https://www.youtube-nocookie.com',
                videoId,
                playerVars: {
                    rel: 0,
                    modestbranding: 1,
                    playsinline: 1,
                    origin: window.location.origin,
                },
                events: {
                    onReady: (event) => {
                        events.onReady?.(event);
                        if (!isResolved) {
                            isResolved = true;
                            resolve(event.target);
                        }
                    },
                    onStateChange: (event) => {
                        events.onStateChange?.(event);
                    },
                    onError: (event) => {
                        events.onError?.(event);
                        if (!isResolved) {
                            reject(new Error(`YouTube player error: ${event.data}`));
                        }
                    },
                },
            });

            if (!player) {
                reject(new Error('Unable to initialize YouTube player.'));
            }
        });
    }

    destroyPlayer(player: YouTubePlayer | null): void {
        if (!player) {
            return;
        }

        try {
            player.destroy();
        } catch {
            // no-op: destroy failures should not crash UI cleanup
        }
    }
}

