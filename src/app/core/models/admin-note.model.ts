import { Id, ISODate } from './base.model';

export interface AdminNoteDto {
  id?: Id;
  studentId: Id;
  content: string;
  isPrivate?: boolean;
  createdAt?: ISODate;
}

export interface CreateAdminNoteRequest {
  studentId: Id;
  content: string;
  isPrivate?: boolean;
}

export default AdminNoteDto;
