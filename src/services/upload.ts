import * as tus from 'tus-js-client';
import { api } from './api';
import { toBase64 } from '../utils';
import type { Language, SummarizationType, UploadProgress } from '../types';

export interface UploadOptions {
  file: File;
  title?: string;
  language: Language;
  summarizationType: SummarizationType;
  onProgress?: (progress: UploadProgress) => void;
  onSuccess?: (lectureId: string) => void;
  onError?: (error: Error) => void;
}

export class UploadService {
  private currentUpload: tus.Upload | null = null;

  start(options: UploadOptions): void {
    const { file, title, language, summarizationType, onProgress, onSuccess, onError } = options;

    const metadata = {
      filename: toBase64(file.name),
      filetype: toBase64(file.type),
      title: toBase64(title || file.name),
      language: toBase64(language),
      summarizationType: toBase64(summarizationType),
    };

    const authHeader = api.getAuthHeader();
    if (!authHeader) {
      onError?.(new Error('Not authenticated'));
      return;
    }

    this.currentUpload = new tus.Upload(file, {
      endpoint: api.getUploadEndpoint(),
      retryDelays: [0, 3000, 5000, 10000],
      chunkSize: 10 * 1024 * 1024, // 10MB chunks
      metadata,
      headers: {
        Authorization: authHeader,
      },
      onError: (error) => {
        onError?.(error);
        this.currentUpload = null;
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
        onProgress?.({
          bytesUploaded,
          bytesTotal,
          percentage,
        });
      },
      onSuccess: () => {
        const lectureId = this.currentUpload?.url?.split('/').pop() || '';
        onSuccess?.(lectureId);
        this.currentUpload = null;
      },
    });

    this.currentUpload.start();
  }

  abort(): void {
    if (this.currentUpload) {
      this.currentUpload.abort();
      this.currentUpload = null;
    }
  }

  isUploading(): boolean {
    return this.currentUpload !== null;
  }
}

// Singleton instance
export const uploadService = new UploadService();
