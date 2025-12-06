import { Id } from './base.model';

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
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
  userId?: Id;
}

export default AuthResponse;
