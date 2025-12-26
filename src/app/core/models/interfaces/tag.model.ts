import { Id } from './base.model';

export interface TagDto {
  id: Id;
  name: string;
  slug?: string | null;
  color?: string | null;
}

export interface CreateTagRequest {
  name: string;
  slug?: string | null;
  color?: string | null;
}

export interface UpdateTagRequest extends Partial<CreateTagRequest> {
  id: Id;
}

export default TagDto;
