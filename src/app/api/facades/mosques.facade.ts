import { Injectable } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { asArray, extractData } from './shared';
import { getMosqueById } from '../fn/mosques/get-mosque-by-id';
import { getMosques, GetMosques$Params } from '../fn/mosques/get-mosques';
import { getNearbyMosques } from '../fn/mosques/get-nearby-mosques';
import { searchMosques } from '../fn/mosques/search-mosques';

type UnknownRecord = Record<string, unknown>;

export interface MosqueDto {
    id: string;
    name: string;
    description: string | null;
    address: string | null;
    country: string | null;
    governorate: string | null;
    city: string | null;
    district: string | null;
    latitude: number | null;
    longitude: number | null;
    googleMapsUrl: string | null;
    phoneNumber: string | null;
    email: string | null;
    websiteUrl: string | null;
    imamName: string | null;
    hasWomenPrayerArea: boolean;
    hasFridayKhutbah: boolean;
    mainImageUrl: string | null;
    isActive: boolean;
    isVerified: boolean;
    createdAt: string | null;
    updatedAt: string | null;
    distanceInKm: number | null;
}

export interface MosqueListResult {
    items: MosqueDto[];
    pageNumber: number;
    totalPages: number;
    totalCount: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}

export interface GetPublicMosquesParams {
    pageNumber?: number;
    pageSize?: number;
    name?: string;
    city?: string;
    country?: string;
    governorate?: string;
    district?: string;
}

export interface GetNearbyMosquesParams {
    latitude: number;
    longitude: number;
    radiusInKm?: number;
    pageNumber?: number;
    pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class MosquesFacade {
    private static readonly fallbackPage: MosqueListResult = {
        items: [],
        pageNumber: 1,
        totalPages: 1,
        totalCount: 0,
        hasPreviousPage: false,
        hasNextPage: false,
    };

    constructor(private readonly api: ApiService) { }

    getMosques(params: GetPublicMosquesParams = {}): Observable<MosqueListResult> {
        const queryParams: GetMosques$Params = {
            Name: params.name ?? null,
            City: params.city ?? null,
            Country: params.country ?? null,
            Governorate: params.governorate ?? null,
            District: params.district ?? null,
            IsActive: true,
            PageNumber: params.pageNumber ?? 1,
            PageSize: params.pageSize ?? 9,
        };

        const path = this.hasSearchFilters(params) ? searchMosques.PATH : getMosques.PATH;

        return extractData(
            this.api.get<unknown>(path, queryParams as Record<string, unknown>),
            MosquesFacade.fallbackPage,
        ).pipe(map((page) => this.mapPage(page)));
    }

    getMosqueById(id: string): Observable<MosqueDto | null> {
        const trimmedId = id.trim();
        if (!trimmedId) {
            return of(null);
        }

        const path = getMosqueById.PATH.replace('{id}', encodeURIComponent(trimmedId));

        return extractData(
            this.api.get<unknown>(path),
            null,
        ).pipe(map((mosque) => (mosque ? this.mapMosque(mosque) : null)));
    }

    getNearbyMosques(params: GetNearbyMosquesParams): Observable<MosqueDto[]> {
        return extractData(
            this.api.get<unknown>(getNearbyMosques.PATH, {
                Lat: params.latitude,
                Lng: params.longitude,
                Radius: params.radiusInKm ?? 15,
                IsActive: true,
                PageNumber: params.pageNumber ?? 1,
                PageSize: params.pageSize ?? 5,
            }),
            [],
        ).pipe(map((items) => asArray(items).map((item) => this.mapMosque(item))));
    }

    private hasSearchFilters(params: GetPublicMosquesParams): boolean {
        return Boolean(
            params.name?.trim() ||
            params.city?.trim() ||
            params.country?.trim() ||
            params.governorate?.trim() ||
            params.district?.trim(),
        );
    }

    private mapPage(raw: unknown): MosqueListResult {
        const record = this.asRecord(raw);
        if (!record) {
            return MosquesFacade.fallbackPage;
        }

        const rawItems = record['items'] ?? record['Items'] ?? [];
        const items = Array.isArray(rawItems)
            ? rawItems.map((item) => this.mapMosque(item))
            : [];

        const pageNumber = this.asNumber(record['pageNumber'] ?? record['PageNumber'], 1);
        const totalPages = this.asNumber(record['totalPages'] ?? record['TotalPages'], 1);
        const totalCount = this.asNumber(record['totalCount'] ?? record['TotalCount'], items.length);
        const hasPreviousPage = this.asBoolean(
            record['hasPreviousPage'] ?? record['HasPreviousPage'],
            pageNumber > 1,
        );
        const hasNextPage = this.asBoolean(
            record['hasNextPage'] ?? record['HasNextPage'],
            pageNumber < totalPages,
        );

        return {
            items,
            pageNumber,
            totalPages: Math.max(1, totalPages),
            totalCount: Math.max(items.length, totalCount),
            hasPreviousPage,
            hasNextPage,
        };
    }

    private mapMosque(raw: unknown): MosqueDto {
        const record = this.asRecord(raw);

        return {
            id: this.asString(record?.['id'], ''),
            name: this.asString(record?.['name'], 'Unnamed mosque'),
            description: this.asOptionalString(record?.['description']),
            address: this.asOptionalString(record?.['address']),
            country: this.asOptionalString(record?.['country']),
            governorate: this.asOptionalString(record?.['governorate']),
            city: this.asOptionalString(record?.['city']),
            district: this.asOptionalString(record?.['district']),
            latitude: this.asOptionalNumber(record?.['latitude']),
            longitude: this.asOptionalNumber(record?.['longitude']),
            googleMapsUrl: this.asOptionalString(record?.['googleMapsUrl']),
            phoneNumber: this.asOptionalString(record?.['phoneNumber']),
            email: this.asOptionalString(record?.['email']),
            websiteUrl: this.asOptionalString(record?.['websiteUrl']),
            imamName: this.asOptionalString(record?.['imamName']),
            hasWomenPrayerArea: this.asBoolean(record?.['hasWomenPrayerArea'], false),
            hasFridayKhutbah: this.asBoolean(record?.['hasFridayKhutbah'], false),
            mainImageUrl: this.asOptionalString(record?.['mainImageUrl']),
            isActive: this.asBoolean(record?.['isActive'], true),
            isVerified: this.asBoolean(record?.['isVerified'], false),
            createdAt: this.asOptionalString(record?.['createdAt']),
            updatedAt: this.asOptionalString(record?.['updatedAt']),
            distanceInKm: this.asOptionalNumber(record?.['distanceInKm']),
        };
    }

    private asRecord(value: unknown): UnknownRecord | null {
        return value && typeof value === 'object' ? (value as UnknownRecord) : null;
    }

    private asString(value: unknown, fallback: string): string {
        return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
    }

    private asOptionalString(value: unknown): string | null {
        return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
    }

    private asOptionalNumber(value: unknown): number | null {
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value;
        }

        if (typeof value === 'string') {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : null;
        }

        return null;
    }

    private asNumber(value: unknown, fallback: number): number {
        const parsed = this.asOptionalNumber(value);
        return parsed === null ? fallback : parsed;
    }

    private asBoolean(value: unknown, fallback: boolean): boolean {
        if (typeof value === 'boolean') {
            return value;
        }

        if (typeof value === 'string') {
            const normalized = value.trim().toLowerCase();
            if (normalized === 'true') {
                return true;
            }
            if (normalized === 'false') {
                return false;
            }
        }

        return fallback;
    }
}
