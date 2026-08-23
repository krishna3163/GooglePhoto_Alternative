import type { PhotoAsset } from '../types';

export interface MemoryHighlight {
    id: string;
    title: string; // e.g. "1 Year Ago Today", "Rediscover August 2025"
    subtitle: string;
    dateDescription: string;
    coverPhoto: PhotoAsset;
    photos: PhotoAsset[];
    type: 'on_this_day' | 'same_month' | 'highlight_reel' | 'trip';
    yearDiff?: number;
}

export type SmartCategory =
    | 'all'
    | 'screenshots'
    | 'documents'
    | 'camera'
    | 'portraits'
    | 'panoramas'
    | 'videos'
    | 'travel'
    | 'food'
    | 'tech';

export interface SmartCollection {
    id: SmartCategory;
    name: string;
    iconName: string;
    count: number;
    coverUrl?: string;
}
