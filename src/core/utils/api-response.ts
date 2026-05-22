export type SuccessApiResponse<T> = {
  success: true;
  message: string;
  data: T;
};

export type ErrorApiResponse = {
  success: false;
  statusCode: number;
  error: string;
  message: string;
  timestamp: string;
  path: string;
};

export const createSuccessResponse = <T>(
  message: string,
  data: T,
): SuccessApiResponse<T> => ({
  success: true,
  message,
  data,
});

export const createErrorResponse = (
  statusCode: number,
  error: string,
  message: string,
  path: string,
): ErrorApiResponse => ({
  success: false,
  statusCode,
  error,
  message,
  timestamp: new Date().toISOString(),
  path,
});
