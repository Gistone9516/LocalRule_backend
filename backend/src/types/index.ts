export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface Rotation3D {
  x: number;
  y: number;
  z: number;
}

export interface Scale3D {
  x: number;
  y: number;
  z: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type LanguageCode = 'ko' | 'en' | 'ja' | 'zh';
export type IconType = 'prohibited' | 'warning' | 'tip' | 'info';
export type TriggerType = 'warning' | 'caution' | 'info';
export type SpaceStatus = 'draft' | 'published' | 'archived';
export type ExploreMode = 'vr' | 'ar';
export type VibrationPattern = 'none' | 'short' | 'long';
export type SoundEffect = 'none' | 'ding' | 'alert';
export type EventType = 'object_click' | 'trigger_enter' | 'trigger_exit' | 'mode_switch' | 'calibration_complete';
