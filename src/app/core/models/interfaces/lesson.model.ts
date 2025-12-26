import { Id, ISODate } from './base.model';
import { LessonType } from './enums.model';

export interface LessonDto {
  id: Id;
  courseId: Id;
  title: string;
  description?: string | null;
  type?: LessonType | number;
  order?: number;
  thumbnailUrl?: string | null;
  contentUrl?: string | null;
  createdAt?: ISODate;
}

export interface CreateLessonRequest {
  courseId: Id;
  title: string;
  description?: string | null;
  type?: LessonType | number;
  contentUrl?: string | null;
  transcript?: string | null;
  thumbnailUrl?: string | null;
  order?: number;
}

export interface UpdateLessonRequest extends Partial<CreateLessonRequest> {
  id: Id;
}

export default LessonDto;
