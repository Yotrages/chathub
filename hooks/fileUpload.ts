import { api } from '@/libs/axios/config';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadedFile {
  id: string;
  url: string;
  filename: string;
  originalName: string;
  size: number;
  type: string;
  thumbnail?: string;
}

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  onError?: (error: Error) => void;
  onSuccess?: (file: UploadedFile) => void;
}

class FileUploadService {
  private maxFileSize = 50 * 1024 * 1024; 
  private allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  private allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
  private allowedFileTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed'
  ];

  validateFile(file: File): { isValid: boolean; error?: string } {
    if (file.size > this.maxFileSize) {
      return {
        isValid: false,
        error: `File size must be less than ${this.maxFileSize / (1024 * 1024)}MB`
      };
    }

    const allAllowedTypes = [
      ...this.allowedImageTypes,
      ...this.allowedVideoTypes,
      ...this.allowedFileTypes
    ];

    if (!allAllowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'File type not supported'
      };
    }

    return { isValid: true };
  }

  getFileType(file: File): 'image' | 'video' | 'file' {
    if (this.allowedImageTypes.includes(file.type)) {
      return 'image';
    }
    if (this.allowedVideoTypes.includes(file.type)) {
      return 'video';
    }
    return 'file';
  }

  async uploadSingle(file: File, options?: UploadOptions): Promise<UploadedFile> {
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      const error = new Error(validation.error);
      options?.onError?.(error);
      throw error;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', this.getFileType(file));

    try {
      const response = await api.post('/upload/single', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && options?.onProgress) {
            const progress: UploadProgress = {
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total)
            };
            options.onProgress(progress);
          }
        }
      });

      const uploadedFile: UploadedFile = response.data.data;
      options?.onSuccess?.(uploadedFile);
      return uploadedFile;
    } catch (error) {
      const uploadError = new Error('Upload failed');
      options?.onError?.(uploadError);
      throw uploadError;
    }
  }

  async uploadMultiple(files: File[], options?: UploadOptions): Promise<UploadedFile[]> {
    const validFiles: File[] = [];
    
    for (const file of files) {
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        const error = new Error(`${file.name}: ${validation.error}`);
        options?.onError?.(error);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      throw new Error('No valid files to upload');
    }

    const formData = new FormData();
    validFiles.forEach((file, index) => {
      formData.append('files', file);
      formData.append(`types[${index}]`, this.getFileType(file));
    });

    try {
      const response = await api.post('/upload/multiple', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && options?.onProgress) {
            const progress: UploadProgress = {
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total)
            };
            options.onProgress(progress);
          }
        }
      });

      const uploadedFiles: UploadedFile[] = response.data.data;
      options?.onSuccess?.(uploadedFiles[0]); 
      return uploadedFiles;
    } catch (error) {
      const uploadError = new Error('Upload failed');
      options?.onError?.(uploadError);
      throw uploadError;
    }
  }

  async uploadForChat(file: File, conversationId: string, options?: UploadOptions): Promise<UploadedFile> {
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      const error = new Error(validation.error);
      options?.onError?.(error);
      throw error;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', conversationId);
    formData.append('type', this.getFileType(file));

    try {
      const response = await api.post('/upload/chat', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && options?.onProgress) {
            const progress: UploadProgress = {
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total)
            };
            options.onProgress(progress);
          }
        }
      });

      const uploadedFile: UploadedFile = response.data.data;
      options?.onSuccess?.(uploadedFile);
      return uploadedFile;
    } catch (error) {
      const uploadError = new Error('Upload failed');
      options?.onError?.(uploadError);
      throw uploadError;
    }
  }

  async uploadForPost(files: File[], postId?: string, options?: UploadOptions): Promise<UploadedFile[]> {
    const validFiles: File[] = [];
    
    for (const file of files) {
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        const error = new Error(`${file.name}: ${validation.error}`);
        options?.onError?.(error);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      throw new Error('No valid files to upload');
    }

    const formData = new FormData();
    validFiles.forEach((file, index) => {
      formData.append('files', file);
      formData.append(`types[${index}]`, this.getFileType(file));
    });
    
    if (postId) {
      formData.append('postId', postId);
    }

    try {
      const response = await api.post('/upload/post', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && options?.onProgress) {
            const progress: UploadProgress = {
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total)
            };
            options.onProgress(progress);
          }
        }
      });

      const uploadedFiles: UploadedFile[] = response.data.data;
      return uploadedFiles;
    } catch (error) {
      const uploadError = new Error('Upload failed');
      options?.onError?.(uploadError);
      throw uploadError;
    }
  }

  createImagePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.allowedImageTypes.includes(file.type)) {
        reject(new Error('Not an image file'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIcon(fileType: string): string {
    if (this.allowedImageTypes.includes(fileType)) {
      return '🖼️';
    }
    if (this.allowedVideoTypes.includes(fileType)) {
      return '🎥';
    }
    if (fileType === 'application/pdf') {
      return '📄';
    }
    if (fileType.includes('word')) {
      return '📝';
    }
    if (fileType.includes('excel') || fileType.includes('sheet')) {
      return '📊';
    }
    if (fileType.includes('zip') || fileType.includes('rar')) {
      return '🗜️';
    }
    return '📎';
  }
}

export const fileUploadService = new FileUploadService();