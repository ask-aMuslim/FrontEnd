import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';

@Injectable({ providedIn: 'root' })
export class CertificatesService {
  constructor(private api: ApiService) {}

  getById(id: string): Observable<any> {
    return this.api.get(API_ENDPOINTS.certificates.getById(id));
  }

  delete(id: string): Observable<any> {
    return this.api.delete(API_ENDPOINTS.certificates.delete(id));
  }

  getByStudent(studentId: string): Observable<any> {
    return this.api.get(API_ENDPOINTS.certificates.getByStudent(studentId));
  }

  create(payload: any): Observable<any> {
    return this.api.post(API_ENDPOINTS.certificates.create(), payload);
  }
}
