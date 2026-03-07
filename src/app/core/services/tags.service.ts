import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class TagsService {
  private static readonly TAGS_PATH = '/api/Tags';

  constructor(private readonly api: ApiService) {}

  getAll(params?: { pageNumber?: number; pageSize?: number }): Observable<unknown> {
    return this.api.get<unknown>(TagsService.TAGS_PATH, params);
  }
}
