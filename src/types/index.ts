// Domain types for Trendify
// Requirements: 12.1

export type PermissionType = 'camera' | 'location' | 'notifications';
export type PermissionStatus = 'granted' | 'denied' | 'undetermined';
export type Category =
  | 'technology'
  | 'sports'
  | 'finance'
  | 'entertainment'
  | 'health'
  | 'science';

export interface AuthToken {
  accessToken: string;
  expiresAt: number; // unix timestamp
}

export interface AuthResult {
  success: boolean;
  token?: AuthToken;
  error?: string;
}

export interface BiometricResult {
  success: boolean;
  error?: string;
}

export interface CaptureResult {
  uri: string;
  width: number;
  height: number;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
}

export interface TrendItem {
  id: string;
  title: string;
  description: string;
  source: string;
  publishedAt: string; // ISO 8601
  imageUrl?: string | null;
  url: string;
  category: Category;
  regionCode?: string;
  locale?: string;
  strapiId?: string;
}

export interface TrendItemPage {
  items: TrendItem[];
  nextCursor?: string;
  totalCount: number;
}

export interface FetchTrendParams {
  categories?: Category[];
  regionCode?: string;
  cursor?: string;
  pageSize?: number;
}

export interface PermissionResults {
  camera: PermissionStatus;
  location: PermissionStatus;
  notifications: PermissionStatus;
}
