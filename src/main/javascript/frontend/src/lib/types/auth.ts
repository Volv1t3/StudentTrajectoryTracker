export interface AuthUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface JWTPayload {
  sub: number;
  role: 'collaborator' | 'admin';
  iat?: number;
  exp?: number;
}

export interface LoginResponse {
  access_token: string;
  user: AuthUser;
}

export interface SessionData {
  user: AuthUser | null;
  accessToken: string | null;
}
