export interface DetectedObject {
  bbox: [number, number, number, number]; // [x, y, width, height]
  class: string;
  score: number;
}

export interface DetectionStats {
  fps: number;
  objectCounts: Record<string, number>;
  totalObjects: number;
}

export type CameraMode = 'user' | 'environment';

export interface VideoDimensions {
  width: number;
  height: number;
}
