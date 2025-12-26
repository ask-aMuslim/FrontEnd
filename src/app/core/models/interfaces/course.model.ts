import { Id, ISODate } from './base.model';

export interface CourseDto {
  id: Id;
  levelId?: Id | null;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  isPublished?: boolean;
  order?: number;
  tagIds?: Id[];
  createdAt?: ISODate;
  updatedAt?: ISODate;
}

export interface CreateCourseRequest {
  levelId?: Id | null;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  isPublished?: boolean;
  order?: number;
  tagIds?: Id[];
}

export interface UpdateCourseRequest {
  levelId?: Id | null;
  title?: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  isPublished?: boolean;
  order?: number;
  tagIds?: Id[];
}

export default CourseDto;
