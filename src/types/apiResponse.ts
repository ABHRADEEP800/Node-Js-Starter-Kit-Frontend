export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  success: boolean;

  // Optional fields for error responses
  errors?: string[];
  name?: string;
}
