import { Id } from './base.model';
import type { ReligiousStatus } from '../../../api/models';

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  religiousStatus: ReligiousStatus;
  role?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SocialLoginRequest {
  idToken?: string; // google
  accessToken?: string; // facebook
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  userId?: Id;
}

export default AuthResponse;
