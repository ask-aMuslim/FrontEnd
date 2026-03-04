import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly jsonHeaders = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private readonly http: HttpClient) {}

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
      .get<T>(url, { headers: this.jsonHeaders, params: httpParams })
      .pipe(retry(1), catchError(this.handleError));
  }

  post<T>(url: string, body: unknown): Observable<T> {
    return this.http
      .post<T>(url, body, { headers: this.jsonHeaders })
      .pipe(retry(1), catchError(this.handleError));
  }

  put<T>(url: string, body: unknown): Observable<T> {
    return this.http
      .put<T>(url, body, { headers: this.jsonHeaders })
      .pipe(retry(1), catchError(this.handleError));
  }

  delete<T>(url: string): Observable<T> {
    return this.http
      .delete<T>(url, { headers: this.jsonHeaders })
      .pipe(retry(1), catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse | { status?: number; message?: string; error?: { message?: string } }) {
    let errMsg = 'An unknown error occurred';
    if (error?.error?.message) {
      errMsg = error.error.message;
    } else if (error?.message) {
      errMsg = error.message;
    }
    return throwError(() => ({ status: error?.status || 0, message: errMsg }));
  }
}
