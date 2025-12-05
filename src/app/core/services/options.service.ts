import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';

@Injectable({ providedIn: 'root' })
export class OptionsService {
  constructor(private api: ApiService) {}

  getByQuestion(questionId: string): Observable<any> {
    return this.api.get(API_ENDPOINTS.options.getByQuestion(questionId));
  }

  create(payload: any): Observable<any> {
    return this.api.post(API_ENDPOINTS.options.create(), payload);
  }

  update(id: string, payload: any): Observable<any> {
    return this.api.put(API_ENDPOINTS.options.update(id), payload);
  }

  delete(id: string): Observable<any> {
    return this.api.delete(API_ENDPOINTS.options.delete(id));
  }
}
