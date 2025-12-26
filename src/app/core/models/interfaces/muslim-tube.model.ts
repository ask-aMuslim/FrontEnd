import { Id, ISODate } from './base.model';

export interface MuslimTubeChannelDto {
  id: Id;
  youTubeChannelId?: string;
  name?: string;
  description?: string | null;
  thumbnailDefaultUrl?: string | null;
  thumbnailMediumUrl?: string | null;
  thumbnailHighUrl?: string | null;
}

export interface MuslimTubeVideoDto {
  id: Id;
  youTubeVideoId?: string;
  muslimTubeChannelId?: Id;
  title?: string;
  description?: string | null;
  thumbnailDefaultUrl?: string | null;
  thumbnailMediumUrl?: string | null;
  thumbnailHighUrl?: string | null;
  publishedAt?: ISODate;
  videoUrl?: string | null;
}

export interface AddChannelRequest {
  channelUrlOrId: string;
  fetchVideosImmediately?: boolean;
  initialVideoLimit?: number;
}

export interface ResyncChannelRequest {
  channelId: Id;
  maxVideos?: number;
}

export default MuslimTubeVideoDto;
