import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly jsonHeaders = new HttpHeaders({ 'Content-Type': 'application/json' });
  private readonly apiBaseUrl = environment.apiBaseUrl.replaceAll(/\/+$/g, '');
  private readonly apiHostUrl = this.apiBaseUrl.endsWith('/api')
    ? this.apiBaseUrl.slice(0, -4)
    : this.apiBaseUrl;

  constructor(private readonly http: HttpClient) { }

  get<T>(url: string, params?: Record<string, unknown>): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        const val = params[key];
        if (val !== undefined && val !== null) {
          httpParams = httpParams.append(key, String(val));
        }
      });
    }
    return this.http
      .get<T>(this.resolveUrl(url), { headers: this.jsonHeaders, params: httpParams })
      .pipe(retry(1), catchError(this.handleError));
  }

  post<T>(url: string, body: unknown): Observable<T> {
    return this.http
      .post<T>(this.resolveUrl(url), body, { headers: this.jsonHeaders })
      .pipe(retry(1), catchError(this.handleError));
  }

  put<T>(url: string, body: unknown): Observable<T> {
    return this.http
      .put<T>(this.resolveUrl(url), body, { headers: this.jsonHeaders })
      .pipe(retry(1), catchError(this.handleError));
  }

  delete<T>(url: string): Observable<T> {
    return this.http
      .delete<T>(this.resolveUrl(url), { headers: this.jsonHeaders })
      .pipe(retry(1), catchError(this.handleError));
  }

  private resolveUrl(url: string): string {
    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    if (url.startsWith('/api/')) {
      return `${this.apiHostUrl}${url}`;
    }

    if (url.startsWith('/')) {
      return `${this.apiBaseUrl}${url}`;
    }

    return `${this.apiBaseUrl}/${url}`;
  }

  private handleError(error: unknown) {
    let errMsg = 'An unknown error occurred';
    if (this.isErrorWithNestedMessage(error)) {
      errMsg = error.error.message;
    } else if (this.isErrorWithMessage(error)) {
      errMsg = error.message;
    }
    return throwError(() => ({ status: this.extractStatus(error), message: errMsg }));
  }

  private isErrorWithNestedMessage(error: unknown): error is { error: { message: string } } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'error' in error &&
      typeof (error as { error?: unknown }).error === 'object' &&
      (error as { error?: { message?: unknown } }).error?.message !== undefined &&
      typeof (error as { error?: { message?: unknown } }).error?.message === 'string'
    );
  }

  private isErrorWithMessage(error: unknown): error is { message: string } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message?: unknown }).message === 'string'
    );
  }

  private extractStatus(error: unknown): number {
    if (
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      typeof (error as { statusCode?: unknown }).statusCode === 'number'
    ) {
      return (error as { statusCode: number }).statusCode;
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      typeof (error as { status?: unknown }).status === 'number'
    ) {
      return (error as { status: number }).status;
    }

    return 0;
  }
}
