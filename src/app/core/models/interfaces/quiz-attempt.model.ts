import { Id, ISODate } from './base.model';

export interface QuizAttemptDto {
  id: Id;
  quizId: Id;
  studentId: Id;
  score?: number;
  isPassed?: boolean;
  startedAt?: ISODate;
  completedAt?: ISODate;
  attemptNumber?: number;
}

export interface CreateQuizAttemptRequest {
  quizId: Id;
  studentId: Id;
}

export interface CompleteQuizAttemptRequest {
  attemptId: Id;
  answers: Array<{
    questionId: Id;
    selectedOptionId: Id;
  }>;
}

export default QuizAttemptDto;
