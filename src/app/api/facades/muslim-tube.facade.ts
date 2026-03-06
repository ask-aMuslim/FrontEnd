import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { asArray, extractData } from './shared';

export interface MuslimTubeChannelDto {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    followers: number;
    videosCount: number;
}

export interface MuslimTubeVideoDto {
    id: string;
    channelId: string;
    image: string;
    duration: string;
    title: string;
    channelLogo: string;
    channelTitle: string;
    date: string;
    likes: number;
    description?: string;
}

type UnknownRecord = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class MuslimTubeFacade {
    constructor(private readonly api: ApiService) { }

    getChannels(params?: { pageNumber?: number; pageSize?: number; searchTerm?: string }): Observable<MuslimTubeChannelDto[]> {
        return extractData(this.api.get<unknown>('/api/MuslimTube/channels', {
            PageNumber: params?.pageNumber,
            PageSize: params?.pageSize,
            SearchTerm: params?.searchTerm,
        }), []).pipe(
            map(asArray<UnknownRecord>),
            map(items => items.map(item => this.mapChannel(item)))
        );
    }

    getHomeVideos(params?: {
        searchTerm?: string;
        randomize?: boolean;
        publishedAfter?: string;
        publishedBefore?: string;
        pageNumber?: number;
        pageSize?: number;
    }): Observable<MuslimTubeVideoDto[]> {
        return extractData(this.api.get<unknown>('/api/MuslimTube/videos', {
            SearchTerm: params?.searchTerm,
            Randomize: params?.randomize ?? true,
            PublishedAfter: params?.publishedAfter,
            PublishedBefore: params?.publishedBefore,
            PageNumber: params?.pageNumber,
            PageSize: params?.pageSize,
        }), []).pipe(
            map(asArray<UnknownRecord>),
            map(items => items.map(item => this.mapVideo(item)))
        );
    }

    getVideoById(id: string): Observable<MuslimTubeVideoDto | null> {
        return extractData(this.api.get<unknown>(`/api/MuslimTube/videos/${id}`), null).pipe(
            map(item => {
                if (!item || typeof item !== 'object') {
                    return null;
                }
                return this.mapVideo(item as UnknownRecord);
            })
        );
    }

    getVideosByChannel(channelId: string, params?: {
        searchTerm?: string;
        publishedAfter?: string;
        publishedBefore?: string;
        pageNumber?: number;
        pageSize?: number;
    }): Observable<MuslimTubeVideoDto[]> {
        return extractData(this.api.get<unknown>(`/api/MuslimTube/channels/${channelId}/videos`, {
            SearchTerm: params?.searchTerm,
            PublishedAfter: params?.publishedAfter,
            PublishedBefore: params?.publishedBefore,
            PageNumber: params?.pageNumber,
            PageSize: params?.pageSize,
        }), []).pipe(
            map(asArray<UnknownRecord>),
            map(items => items.map(item => this.mapVideo(item)))
        );
    }

    private mapChannel(raw: UnknownRecord): MuslimTubeChannelDto {
        const id = this.asString(raw['id'] ?? raw['channelId'], '');
        return {
            id,
            title: this.asString(raw['title'] ?? raw['name'] ?? raw['channelTitle'], 'Untitled Channel'),
            description: this.asString(raw['description'], ''),
            imageUrl: this.asString(raw['imageUrl'] ?? raw['thumbnailUrl'] ?? raw['logoUrl'] ?? raw['avatarUrl'], '/images/channel1.png'),
            followers: this.asNumber(raw['followers'] ?? raw['subscribers'] ?? raw['subscriberCount'], 0),
            videosCount: this.asNumber(raw['videosCount'] ?? raw['videoCount'], 0),
        };
    }

    private mapVideo(raw: UnknownRecord): MuslimTubeVideoDto {
        return {
            id: this.asString(raw['id'] ?? raw['videoId'], ''),
            channelId: this.asString(raw['channelId'], ''),
            image: this.asString(raw['imageUrl'] ?? raw['thumbnailUrl'], '/images/video1.png'),
            duration: this.asDuration(raw['duration']),
            title: this.asString(raw['title'] ?? raw['name'], 'Untitled Video'),
            channelLogo: this.asString(raw['channelLogo'] ?? raw['channelImageUrl'] ?? raw['channelAvatarUrl'], '/images/channel1.png'),
            channelTitle: this.asString(raw['channelTitle'] ?? raw['channelName'], 'Unknown Channel'),
            date: this.asString(raw['publishedAt'] ?? raw['date'] ?? raw['createdAt'], ''),
            likes: this.asNumber(raw['likes'] ?? raw['likeCount'] ?? raw['views'] ?? raw['viewCount'], 0),
            description: this.asString(raw['description'], ''),
        };
    }

    private asString(value: unknown, fallback: string): string {
        return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
    }

    private asNumber(value: unknown, fallback: number): number {
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value;
        }
        if (typeof value === 'string') {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : fallback;
        }
        return fallback;
    }

    private asDuration(value: unknown): string {
        if (typeof value === 'string' && value.trim().length > 0) {
            return value;
        }
        if (typeof value === 'number' && Number.isFinite(value)) {
            const totalSeconds = Math.max(0, Math.floor(value));
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            return `${minutes}:${String(seconds).padStart(2, '0')}`;
        }
        return '0:00';
    }
}
