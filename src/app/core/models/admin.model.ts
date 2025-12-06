import { Id, ISODate } from './base.model';

export interface AdminDto {
  id: Id;
  userId?: Id;
  email?: string;
  firstName?: string;
  lastName?: string;
  department?: string | null;
  phoneNumber?: string | null;
  isSuperAdmin?: boolean;
  isActive?: boolean;
  joinedDate?: ISODate;
  lastLoginDate?: ISODate;
}

export interface UpdateAdminRequest {
  department?: string | null;
  phoneNumber?: string | null;
}

export default AdminDto;
