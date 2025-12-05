import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';

@Injectable({ providedIn: 'root' })
export class MuslimTubeService {
  constructor(private api: ApiService) {}

  // Channels
  getChannels(): Observable<any> {
    return this.api.get(API_ENDPOINTS.muslimTube.channels.getAll());
  }

  createChannel(payload: any): Observable<any> {
    return this.api.post(API_ENDPOINTS.muslimTube.channels.create(), payload);
  }

  deleteChannel(channelId: string): Observable<any> {
    return this.api.delete(API_ENDPOINTS.muslimTube.channels.delete(channelId));
  }

  resyncChannel(channelId: string): Observable<any> {
    return this.api.post(API_ENDPOINTS.muslimTube.channels.resync(channelId), {});
  }

  getChannelVideos(channelId: string): Observable<any> {
    return this.api.get(API_ENDPOINTS.muslimTube.channels.getVideos(channelId));
  }

  // Videos
  getVideos(): Observable<any> {
    return this.api.get(API_ENDPOINTS.muslimTube.videos.getAll());
  }

  getVideoById(id: string): Observable<any> {
    return this.api.get(API_ENDPOINTS.muslimTube.videos.getById(id));
  }
}
