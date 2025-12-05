import { Id } from './base.model';

export interface QuizDto {
  id: Id;
  levelId?: Id | null;
  courseId?: Id | null;
  lessonId?: Id | null;
  targetType?: number;
  title?: string;
  totalMarks?: number;
  questionsCount?: number;
}

export interface CreateQuizRequest {
  levelId?: Id | null;
  courseId?: Id | null;
  lessonId?: Id | null;
  targetType?: number;
  title: string;
  totalMarks?: number;
}

export interface UpdateQuizRequest extends Partial<CreateQuizRequest> {
  id: Id;
}

export default QuizDto;
