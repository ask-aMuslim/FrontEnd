import { Id, ISODate } from './base.model';

export interface InquiryRequestDto {
  id: Id;
  requesterId?: Id;
  scholarId?: Id;
  topic?: number;
  message?: string | null;
  languages?: number[];
  status?: number;
  response?: string | null;
  created?: ISODate;
}

export interface CreateInquiryRequest {
  topic: number;
  message: string;
  languages: number[];
}

export interface UpdateInquiryStatusRequest {
  id: Id;
  status: number;
}

export interface UpdateInquiryResponseRequest {
  id: Id;
  response: string;
}

export default InquiryRequestDto;
