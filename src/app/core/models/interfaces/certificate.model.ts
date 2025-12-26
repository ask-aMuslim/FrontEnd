import { Id, ISODate } from './base.model';

export interface CertificateDto {
  id: Id;
  studentId: Id;
  levelId: Id;
  url: string;
  issuedAt?: ISODate;
}

export interface CreateCertificateRequest {
  studentId: Id;
  levelId: Id;
  url: string;
}

export default CertificateDto;
