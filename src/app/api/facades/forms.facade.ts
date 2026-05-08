import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { asArray, extractData } from './shared';

export type FormFieldType =
  | 'Text'
  | 'TextArea'
  | 'Email'
  | 'Number'
  | 'Date'
  | 'Checkbox'
  | 'Radio'
  | 'Select'
  | 'File'
  | 'PhoneNumber';

export interface FormFieldOptionDto {
  id: string;
  label: string;
  value: string;
  order: number;
}

export interface FormFieldDto {
  id: string;
  label: string;
  type: FormFieldType;
  isRequired: boolean;
  order: number;
  options: FormFieldOptionDto[];
}

export interface FormDto {
  id: string;
  title: string;
  description: string | null;
  isPublished: boolean;
  fields: FormFieldDto[];
}

export interface FormSubmissionPayload {
  formId: string;
  answersJson: string;
}

export interface GetFormsParams {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  isPublished: boolean;
}

@Injectable({ providedIn: 'root' })
export class FormsFacade {
  constructor(private readonly api: ApiService) { }

  getForms(params: GetFormsParams): Observable<FormDto[]> {
    return extractData(
      this.api.get<unknown>('/api/Forms', {
        PageNumber: params.pageNumber,
        PageSize: params.pageSize,
        SearchTerm: params.searchTerm ?? undefined,
        IsPublished: params.isPublished,
      }),
      [],
    ).pipe(map(asArray<FormDto>));
  }

  getFormById(id: string): Observable<FormDto | null> {
    return extractData(this.api.get<unknown>(`/api/Forms/${id}`), null);
  }

  submitForm(formId: string, payload: FormSubmissionPayload): Observable<string> {
    return this.api.post<string>(`/api/Forms/${formId}/submissions`, payload);
  }

  submitFormWithFiles(formId: string, formData: FormData): Observable<string> {
    // FormData is sent as multipart/form-data; browser sets Content-Type automatically
    return this.api.postFormData<string>(`/api/Forms/${formId}/submissions`, formData);
  }
}
