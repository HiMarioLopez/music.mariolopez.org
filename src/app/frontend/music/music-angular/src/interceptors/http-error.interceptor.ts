import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, retryWhen, throwError, timer, Observable, mergeMap } from 'rxjs';
import { ApiError } from '../services/api.service';

/**
 * Maximum number of retry attempts for failed requests
 */
const MAX_RETRY_ATTEMPTS = 2;

/**
 * Delay between retry attempts in milliseconds
 */
const RETRY_DELAY_MS = 1000;

/**
 * HTTP status codes that should trigger a retry (transient errors)
 */
const RETRIABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];

/**
 * HTTP Error Interceptor
 * 
 * Handles HTTP errors globally with:
 * - Retry logic for transient failures
 * - Consistent error transformation to ApiError
 * - User-friendly error messages
 */
export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    retryWhen((errors: Observable<HttpErrorResponse>) => 
      errors.pipe(
        mergeMap((error: HttpErrorResponse, retryCount: number) => {
          // Don't retry if we've exceeded max attempts
          if (retryCount >= MAX_RETRY_ATTEMPTS) {
            return throwError(() => error);
          }
          
          // Only retry on specific status codes
          if (!RETRIABLE_STATUS_CODES.includes(error.status)) {
            return throwError(() => error);
          }
          
          // Exponential backoff: 1s, 2s
          return timer(RETRY_DELAY_MS * (retryCount + 1));
        })
      )
    ),
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';
      
      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = error.error.message || 'A network error occurred';
      } else if (error.status === 0) {
        // Network error (no response from server)
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      } else if (error.status >= 400 && error.status < 500) {
        // Client error (4xx)
        errorMessage = error.error?.message || error.message || `Request failed: ${error.statusText}`;
      } else if (error.status >= 500) {
        // Server error (5xx)
        errorMessage = 'The server encountered an error. Please try again later.';
      }

      // Transform to ApiError for consistent error handling
      const apiError = new ApiError(errorMessage, error.status);
      return throwError(() => apiError);
    })
  );
};

