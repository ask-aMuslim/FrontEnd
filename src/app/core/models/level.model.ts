import { Id } from './base.model';

export interface LevelDto {
  id: Id;
  title: string;
  description?: string | null;
  order?: number;
  difficulty?: number;
}

export interface CreateLevelRequest {
  title: string;
  description?: string | null;
  order?: number;
  difficulty?: number;
}

export interface UpdateLevelRequest extends Partial<CreateLevelRequest> {
  id: Id;
}

export default LevelDto;
