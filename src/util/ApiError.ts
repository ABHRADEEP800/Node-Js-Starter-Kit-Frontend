class ApiError extends Error {
  constructor(message: string, cause?: string) {
    super(message);
    this.name = "ApiError";
    this.cause = cause;
  }
}
export default ApiError;
