import { Id } from './base.model';

export interface QADto {
  id: Id;
  imageUrl?: string | null;
  videoUrl?: string | null;
  isPublished?: boolean;
  translations?: {
    id?: Id;
    language: number;
    questionText: string;
    answerText: string;
    isDeleted?: boolean;
  }[];
  tagIds?: Id[];
}

export interface CreateQARequest {
  imageUrl?: string | null;
  videoUrl?: string | null;
  isPublished?: boolean;
  translations: {
    language: number;
    questionText: string;
    answerText: string;
  }[];
  tagIds?: Id[];
}

export default QADto;
