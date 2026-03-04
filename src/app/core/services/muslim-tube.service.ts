import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';

@Injectable({ providedIn: 'root' })
export class MuslimTubeService {
  constructor(private api: ApiService) {}

  // Channels
  getChannels(): Observable<unknown> {
    return this.api.get(API_ENDPOINTS.muslimTube.channels.getAll());
  }

  createChannel(payload: unknown): Observable<unknown> {
    return this.api.post(API_ENDPOINTS.muslimTube.channels.create(), payload);
  }

  deleteChannel(channelId: string): Observable<unknown> {
    return this.api.delete(API_ENDPOINTS.muslimTube.channels.delete(channelId));
  }

  resyncChannel(channelId: string): Observable<unknown> {
    return this.api.post(API_ENDPOINTS.muslimTube.channels.resync(channelId), {});
  }

  getChannelVideos(channelId: string): Observable<unknown> {
    return this.api.get(API_ENDPOINTS.muslimTube.channels.getVideos(channelId));
  }

  // Videos
  getVideos(): Observable<unknown> {
    return this.api.get(API_ENDPOINTS.muslimTube.videos.getAll());
  }

  getVideoById(id: string): Observable<unknown> {
    return this.api.get(API_ENDPOINTS.muslimTube.videos.getById(id));
  }
}
