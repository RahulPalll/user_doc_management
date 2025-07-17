export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface JwtPayload {
  sub: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthResult {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}

export interface FileUploadResult {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
}
