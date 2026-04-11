import { Injectable } from '@angular/core';

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

    loadApi(): Promise<void> {
        if (globalThis.window === undefined || globalThis.document === undefined) {
            return Promise.reject(new Error('YouTube API can only be loaded in the browser.'));
        }

        if (globalThis.window.YT?.Player) {
            return Promise.resolve();
        }

        if (YouTubePlayerService.apiReadyPromise !== null) {
            return YouTubePlayerService.apiReadyPromise;
        }

        YouTubePlayerService.apiReadyPromise = new Promise<void>((resolve, reject) => {
            const existingScript = globalThis.document.getElementById(YouTubePlayerService.scriptId);
            if (existingScript && globalThis.window.YT?.Player) {
                resolve();
                return;
            }

            const finalizeReady = () => {
                if (globalThis.window.YT?.Player) {
                    resolve();
                    return;
                }

                reject(new Error('YouTube API loaded but player constructor is unavailable.'));
            };

            const previousReadyHandler = globalThis.window.onYouTubeIframeAPIReady;
            globalThis.window.onYouTubeIframeAPIReady = () => {
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

            const script = globalThis.document.createElement('script');
            script.id = YouTubePlayerService.scriptId;
            script.src = 'https://www.youtube.com/iframe_api';
            script.async = true;
            script.defer = true;
            script.addEventListener('error', () => reject(new Error('Failed to load YouTube API script.')), { once: true });
            globalThis.document.body.appendChild(script);
        });

        return YouTubePlayerService.apiReadyPromise;
    }

    async createPlayer(
        host: string | HTMLElement,
        videoId: string,
        events: YouTubePlayerEvents = {},
    ): Promise<YouTubePlayer> {
        await this.loadApi();

        const playerFactory = globalThis.window.YT?.Player;
        if (!playerFactory) {
            throw new Error('YouTube player constructor is unavailable.');
        }

        return await new Promise<YouTubePlayer>((resolve, reject) => {
            let isResolved = false;

            const player = new playerFactory(host, {
                videoId,
                playerVars: {
                    rel: 0,
                    modestbranding: 1,
                    playsinline: 1,
                    origin: globalThis.location.origin,
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
