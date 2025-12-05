import { Id } from './base.model';

export interface QuestionDto {
  id: Id;
  text: string;
  optionsCount?: number;
}

export interface CreateQuestionRequest {
  quizId: Id;
  text: string;
}

export interface UpdateQuestionRequest {
  id: Id;
  text: string;
}

export default QuestionDto;
