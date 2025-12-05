import { Id } from './base.model';

export interface OptionDto {
  id: Id;
  text: string;
  isCorrect?: boolean;
}

export interface CreateOptionRequest {
  questionId: Id;
  text: string;
  isCorrect?: boolean;
}

export interface UpdateOptionRequest {
  id: Id;
  text: string;
  isCorrect?: boolean;
}

export default OptionDto;
