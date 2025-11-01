/**
 * DeepDetect API Service
 * 
 * This service handles all communication with the Python ML backend.
 * It provides methods for authentication, file upload, detection analysis,
 * and result retrieval.
 */

import type { 
  DetectionResult, 
  User, 
  DetectionModel,
  SystemStats 
} from '../App';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_VERSION = 'v1';
const API_URL = `${API_BASE_URL}/api/${API_VERSION}`;

// Request/Response Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface DetectionRequest {
  file: File;
  modelId: string;
  userId: string;
}

export interface DetectionResponse {
  result: DetectionResult;
  processingTime: number;
  modelVersion: string;
}

export interface UploadProgressCallback {
  (progress: number): void;
}

/**
 * API Service Class
 * Handles all HTTP requests to the backend
 */
class ApiService {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('authToken');
  }

  /**
   * Set authentication token
   */
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  /**
   * Clear authentication token
   */
  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  /**
   * Get common headers for API requests
   */
  private getHeaders(includeAuth = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'An error occurred',
      }));
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // ==================== Authentication ====================

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ email, password }),
    });

    const data = await this.handleResponse<AuthResponse>(response);
    this.setToken(data.token);
    return data;
  }

  /**
   * Sign up new user
   */
  async signup(name: string, email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ name, email, password }),
    });

    const data = await this.handleResponse<AuthResponse>(response);
    this.setToken(data.token);
    return data;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: this.getHeaders(),
      });
    } finally {
      this.clearToken();
    }
  }

  /**
   * Verify current session
   */
  async verifySession(): Promise<User> {
    const response = await fetch(`${API_URL}/auth/verify`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<User>(response);
  }

  // ==================== Detection ====================

  /**
   * Upload file and run deepfake detection
   */
  async detectDeepfake(
    file: File,
    modelId: string,
    onProgress?: UploadProgressCallback
  ): Promise<DetectionResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('modelId', modelId);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            onProgress(progress);
          }
        });
      }

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Failed to parse response'));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.message || `Upload failed with status ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Network error occurred'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      // Send request
      xhr.open('POST', `${API_URL}/detection/analyze`);
      if (this.token) {
        xhr.setRequestHeader('Authorization', `Bearer ${this.token}`);
      }
      xhr.send(formData);
    });
  }

  /**
   * Get detection result by ID
   */
  async getDetectionResult(resultId: string): Promise<DetectionResult> {
    const response = await fetch(`${API_URL}/detection/results/${resultId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<DetectionResult>(response);
  }

  /**
   * Get all detection results for current user
   */
  async getDetectionHistory(
    page = 1,
    limit = 50
  ): Promise<{ results: DetectionResult[]; total: number }> {
    const response = await fetch(
      `${API_URL}/detection/history?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );

    return this.handleResponse<{ results: DetectionResult[]; total: number }>(response);
  }

  /**
   * Delete detection result
   */
  async deleteDetectionResult(resultId: string): Promise<void> {
    const response = await fetch(`${API_URL}/detection/results/${resultId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    return this.handleResponse<void>(response);
  }

  // ==================== Models ====================

  /**
   * Get available detection models
   */
  async getAvailableModels(): Promise<DetectionModel[]> {
    const response = await fetch(`${API_URL}/models`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<DetectionModel[]>(response);
  }

  /**
   * Get model details
   */
  async getModelDetails(modelId: string): Promise<DetectionModel> {
    const response = await fetch(`${API_URL}/models/${modelId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<DetectionModel>(response);
  }

  // ==================== User Management ====================

  /**
   * Get current user profile
   */
  async getUserProfile(): Promise<User> {
    const response = await fetch(`${API_URL}/users/profile`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<User>(response);
  }

  /**
   * Update user profile
   */
  async updateUserProfile(updates: Partial<User>): Promise<User> {
    const response = await fetch(`${API_URL}/users/profile`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });

    return this.handleResponse<User>(response);
  }

  // ==================== Admin ====================

  /**
   * Get all users (admin only)
   */
  async getAllUsers(): Promise<User[]> {
    const response = await fetch(`${API_URL}/admin/users`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<User[]>(response);
  }

  /**
   * Get system statistics (admin only)
   */
  async getSystemStats(): Promise<SystemStats> {
    const response = await fetch(`${API_URL}/admin/stats`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<SystemStats>(response);
  }

  /**
   * Update user status (admin only)
   */
  async updateUserStatus(
    userId: string,
    status: 'active' | 'suspended'
  ): Promise<User> {
    const response = await fetch(`${API_URL}/admin/users/${userId}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status }),
    });

    return this.handleResponse<User>(response);
  }

  /**
   * Delete user (admin only)
   */
  async deleteUser(userId: string): Promise<void> {
    const response = await fetch(`${API_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    return this.handleResponse<void>(response);
  }
}

// Export singleton instance
export const api = new ApiService();

// Export mock flag for development
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';
