import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { asArray, extractData } from './shared';
// Connect to generated API definitions
import { getForms, GetForms$Params } from '../fn/forms/get-forms';
import { getFormById } from '../fn/forms/get-form-by-id';
import { createFormSubmission } from '../fn/forms/create-form-submission';

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
  isMultiSelect?: boolean;
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
    const queryParams: GetForms$Params = {
      PageNumber: params.pageNumber,
      PageSize: params.pageSize,
      SearchTerm: params.searchTerm ?? null,
      IsPublished: params.isPublished,
    };

    return extractData(
      this.api.get<unknown>(getForms.PATH, queryParams as Record<string, unknown>),
      [],
    ).pipe(map(asArray<FormDto>));
  }

  getFormById(id: string): Observable<FormDto | null> {
    return extractData(this.api.get<unknown>(getFormById.PATH.replace('{id}', id)), null);
  }

  submitForm(formId: string, payload: FormSubmissionPayload): Observable<string> {
    return this.api.post<string>(createFormSubmission.PATH.replace('{formId}', formId), payload);
  }

  submitFormWithFiles(formId: string, formData: FormData): Observable<string> {
    // FormData is sent as multipart/form-data; browser sets Content-Type automatically
    return this.api.postFormData<string>(createFormSubmission.PATH.replace('{formId}', formId), formData);
  }
}
