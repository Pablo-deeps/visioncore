import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { DetectedObject } from '../types';

class DetectionService {
  private model: cocoSsd.ObjectDetection | null = null;
  private isBackendReady = false;

  constructor() {
    this.initializeBackend();
  }

  private async initializeBackend() {
    if (this.isBackendReady) return;
    try {
      // Force WebGL for performance
      await tf.setBackend('webgl');
      await tf.ready();
      this.isBackendReady = true;
      console.log('TFJS Backend initialized:', tf.getBackend());
    } catch (e) {
      console.warn('WebGL failed, falling back to CPU', e);
      await tf.setBackend('cpu');
      this.isBackendReady = true;
    }
  }

  public async loadModel(): Promise<void> {
    if (this.model) return;
    
    // Ensure backend is ready before loading model
    if (!this.isBackendReady) {
      await this.initializeBackend();
    }
    
    try {
      // 'lite_mobilenet_v2' is the fastest backbone for mobile
      this.model = await cocoSsd.load({
        base: 'lite_mobilenet_v2' 
      });
      console.log('COCO-SSD Model loaded successfully');
    } catch (error) {
      console.error('Failed to load model:', error);
      throw error;
    }
  }

  public async detect(videoElement: HTMLVideoElement, confidenceThreshold: number = 0.5): Promise<DetectedObject[]> {
    if (!this.model) return [];
    
    // Safety check: ensure video has data
    if (videoElement.readyState < 2 || videoElement.videoWidth === 0) return [];

    try {
      const start = performance.now();
      
      // We do NOT need to tensor cleanup here as coco-ssd handles it internally 
      // when passing an HTMLVideoElement directly.
      const predictions = await this.model.detect(videoElement, undefined, confidenceThreshold);
      
      // Optional: Log inference time for debugging if needed
      // const end = performance.now();
      // console.log(`Inference: ${Math.round(end - start)}ms`);

      return predictions.map(pred => ({
        bbox: pred.bbox,
        class: pred.class,
        score: pred.score
      }));
    } catch (error) {
      console.error('Detection runtime error:', error);
      return [];
    }
  }

  public isReady(): boolean {
    return this.model !== null;
  }
}

export const detectionService = new DetectionService();