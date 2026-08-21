/**
 * DeepDetect API Service (Frontend)
 *
 * Updated to match the Flask backend endpoints found under `/api/*`.
 * Handles authentication, media uploads, and history retrieval.
 */

import type { DetectionResult, User } from '../App';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')
  : '';

const buildUrl = (path: string) => {
  if (API_BASE_URL) {
    return `${API_BASE_URL}/api${path}`;
  }
  return `/api${path}`;
};

type BackendUser = {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  status?: string | null;
  created_at: string;
  last_login_at?: string | null;
  total_scans?: number; // Added by backend /admin/users endpoint
};

type BackendRegisterResponse = {
  message: string;
  access_token: string;
  user: BackendUser;
};

type BackendLoginResponse = {
  message: string;
  access_token: string;
  user: BackendUser;
};

type BackendMediaFile = {
  id: number;
  user_id: number;
  original_filename: string;
  stored_filename: string;
  storage_path: string;
  file_type: string;
  file_size?: number | null;
  uploaded_at: string;
  last_analyzed_at?: string | null;
};

type BackendDetectionModel = {
  id: number;
  name: string;
  version: string;
};

type BackendAnalysisResult = {
  id: number;
  user_id: number | null;
  media_file_id: number;
  model_id: number | null;
  prediction_label: string;
  confidence_score: number;
  processing_time_ms?: number | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  media_file?: BackendMediaFile | null;
  model?: BackendDetectionModel | null;
};

type BackendPredictResponse = {
  message: string;
  media_file: BackendMediaFile;
  analysis: BackendAnalysisResult;
  gradcam_heatmap?: string; // Base64 encoded heatmap
  video_analysis?: {
    total_frames: number;
    fake_frames: number;
    real_frames: number;
    fake_ratio: number;
    frame_results: Array<{
      frame_number: number;
      prediction: string;
      confidence: number;
      heatmap?: string;
    }>;
  };
};

type BackendHistoryResponse = {
  total: number;
  pages: number;
  current_page: number;
  per_page: number;
  results: BackendAnalysisResult[];
};

export interface UploadProgressCallback {
  (progress: number): void;
}

const toFrontendUser = (user: BackendUser): User => ({
  id: user.id.toString(),
  name: user.username,
  email: user.email,
  role: user.is_admin ? 'admin' : 'user',
  status: (user.status === 'suspended' || user.status === 'banned') ? 'suspended' : 'active',
  joinDate: user.created_at.split('T')[0],
  lastActive: user.last_login_at ? user.last_login_at.split('T')[0] : user.created_at.split('T')[0],
  totalScans: user.total_scans ?? 0, // Use total_scans from backend if available
});

const toFrontendDetectionResult = (
  analysis: BackendAnalysisResult,
  media?: BackendMediaFile | null,
  model?: BackendDetectionModel | null,
): DetectionResult => {
  const prediction = analysis.prediction_label?.toUpperCase() === 'FAKE' ? 'deepfake' : 'authentic';
  const confidencePercent =
    analysis.confidence_score <= 1 ? Math.round(analysis.confidence_score * 100) : Math.round(analysis.confidence_score);

  return {
    id: analysis.id.toString(),
    fileName: media?.original_filename ?? 'Unknown file',
    date: analysis.created_at.split('T')[0],
    result: prediction,
    confidence: confidencePercent,
    fileUrl: undefined,
    userId: analysis.user_id ? analysis.user_id.toString() : undefined,
    modelUsed: model ? `${model.name} ${model.version}` : undefined,
    processingTime: analysis.processing_time_ms
      ? Math.round(analysis.processing_time_ms / 1000)
      : undefined,
  };
};

class ApiService {
  private token: string | null;

  constructor() {
    const stored = localStorage.getItem('authToken');
    // Only set token if it's a non-empty string
    this.token = stored && stored.trim() ? stored : null;
    if (!this.token) {
      localStorage.removeItem('authToken');
    }
  }

  setToken(token: string) {
    if (!token || !token.trim()) {
      this.clearToken();
      return;
    }
    this.token = token.trim();
    localStorage.setItem('authToken', this.token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  private getAuthHeaders(contentType: string | null = 'application/json'): HeadersInit {
    const headers: HeadersInit = {};

    if (contentType) {
      headers['Content-Type'] = contentType;
    }

    // Always check localStorage for fresh token
    const stored = localStorage.getItem('authToken');
    const tokenToUse = stored && stored.trim() ? stored.trim() : (this.token && this.token.trim() ? this.token.trim() : null);
    
    if (tokenToUse) {
      headers['Authorization'] = `Bearer ${tokenToUse}`;
      // Update instance variable to keep it in sync
      if (this.token !== tokenToUse) {
        this.token = tokenToUse;
      }
    }

    return headers;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(buildUrl(path), init);
    const isJson = response.headers.get('content-type')?.includes('application/json');

    if (!response.ok) {
      const errorBody = isJson ? await response.json().catch(() => ({})) : {};
      const message =
        (errorBody as { error?: string; message?: string }).error ??
        (errorBody as { error?: string; message?: string }).message ??
        `HTTP ${response.status}`;
      
      // Only clear token on actual authentication errors, not on protected routes that might fail for other reasons
      // Don't clear on 422 (validation errors) - those are not auth failures
      if (response.status === 401) {
        const errorMsg = message.toLowerCase();
        // Only clear if it's actually an auth error, not a different 401
        if (errorMsg.includes('token') || errorMsg.includes('unauthorized') || errorMsg.includes('authentication') || errorMsg.includes('login')) {
          console.warn('Authentication error detected, clearing token');
          this.clearToken();
        }
      }

      throw new Error(message);
    }

    if (isJson) {
      return response.json();
    }

    // @ts-expect-error returning void when no JSON
    return undefined;
  }

  async register(username: string, email: string, password: string): Promise<User> {
    const payload = { username, email, password };
    const data = await this.request<BackendRegisterResponse>('/register', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    // Set token from registration response for immediate login
    if (!data.access_token) {
      throw new Error('No access token received from server');
    }
    
    this.setToken(data.access_token);
    console.log('Token stored after registration, length:', data.access_token.length);
    
    // Verify it was stored
    const verifyToken = localStorage.getItem('authToken');
    if (!verifyToken || verifyToken !== data.access_token) {
      console.error('Token storage verification failed!');
      throw new Error('Failed to store authentication token');
    }

    return toFrontendUser(data.user);
  }

  async login(identifier: string, password: string): Promise<User> {
    const body = JSON.stringify({ username: identifier, password });
    const data = await this.request<BackendLoginResponse>('/login', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body,
    });

    if (!data.access_token) {
      throw new Error('No access token received from server');
    }
    
    this.setToken(data.access_token);
    console.log('Token stored after login, length:', data.access_token.length);
    
    // Verify it was stored
    const verifyToken = localStorage.getItem('authToken');
    if (!verifyToken || verifyToken !== data.access_token) {
      console.error('Token storage verification failed!');
      throw new Error('Failed to store authentication token');
    }
    
    return toFrontendUser(data.user);
  }

  async getCurrentUser(): Promise<User> {
    // Refresh token from localStorage before making request
    const stored = localStorage.getItem('authToken');
    if (stored && stored.trim()) {
      this.token = stored.trim();
    }
    
    const data = await this.request<BackendUser>('/user', {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    return toFrontendUser(data);
  }

  async getGoogleAuthUrl(redirectUri?: string): Promise<{ auth_url: string; redirect_uri: string }> {
    const body = redirectUri ? JSON.stringify({ redirect_uri: redirectUri }) : undefined;
    return this.request<{ auth_url: string; redirect_uri: string }>('/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    });
  }

  async googleSignIn(idToken: string): Promise<User> {
    const data = await this.request<BackendLoginResponse>('/auth/google/callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id_token: idToken }),
    });

    if (!data.access_token) {
      throw new Error('No access token received from server');
    }
    
    this.setToken(data.access_token);
    
    // Verify it was stored
    const verifyToken = localStorage.getItem('authToken');
    if (!verifyToken || verifyToken !== data.access_token) {
      console.error('Token storage verification failed!');
      throw new Error('Failed to store authentication token');
    }
    
    return toFrontendUser(data.user);
  }

  async logout(): Promise<void> {
    this.clearToken();
  }

  async detectDeepfake(file: File, onProgress?: UploadProgressCallback): Promise<DetectionResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('generate_gradcam', 'true'); // Enable GRAD-CAM by default

    const url = buildUrl('/predict');

    return new Promise<DetectionResult>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        try {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response: BackendPredictResponse = JSON.parse(xhr.responseText);
            const result = toFrontendDetectionResult(
              response.analysis, 
              response.media_file, 
              response.analysis.model ?? undefined
            );
            
            // Add GRAD-CAM heatmap if available
            console.log('[API] Response received:', {
              has_gradcam: !!response.gradcam_heatmap,
              gradcam_length: response.gradcam_heatmap?.length || 0,
              gradcam_preview: response.gradcam_heatmap?.substring(0, 50) || 'none'
            });
            
            if (response.gradcam_heatmap) {
              result.gradcamHeatmap = response.gradcam_heatmap;
              console.log('[API] GRAD-CAM heatmap added to result:', {
                has_heatmap: !!result.gradcamHeatmap,
                length: result.gradcamHeatmap?.length || 0
              });
            } else {
              console.warn('[API] No GRAD-CAM heatmap in response');
            }
            
            // Add video analysis if available
            if (response.video_analysis) {
              result.videoAnalysis = response.video_analysis;
            }
            
            resolve(result);
          } else {
            let errorMessage = `Upload failed (${xhr.status})`;
            try {
              const error = JSON.parse(xhr.responseText);
              errorMessage = error.error || error.message || errorMessage;
            } catch {
              // If response is not JSON, use status text
              errorMessage = xhr.statusText || errorMessage;
            }
            
            // Handle authentication errors (401 and 422 from JWT)
            if (xhr.status === 401 || xhr.status === 422) {
              const errorMsg = errorMessage.toLowerCase();
              // 422 from Flask-JWT-Extended means invalid/malformed token
              // 401 means unauthorized/expired token
              if (errorMsg.includes('token') || errorMsg.includes('unauthorized') || 
                  errorMsg.includes('authentication') || errorMsg.includes('login') ||
                  errorMsg.includes('expired') || errorMsg.includes('invalid') ||
                  xhr.status === 422) {
                console.error('Authentication failed during upload, clearing token. Status:', xhr.status);
                console.error('Response:', xhr.responseText);
                console.error('Error message:', errorMessage);
                this.clearToken();
              }
            }
            
            reject(new Error(errorMessage));
          }
        } catch (err) {
          reject(err instanceof Error ? err : new Error('Failed to parse server response'));
        }
      });

      xhr.addEventListener('error', () => {
        console.error('XHR error during upload');
        reject(new Error('Network error during upload'));
      });
      xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

      xhr.open('POST', url);
      
      // Get fresh token from localStorage and also check instance variable
      const storedToken = localStorage.getItem('authToken');
      const tokenToUse = storedToken && storedToken.trim() ? storedToken.trim() : (this.token && this.token.trim() ? this.token.trim() : null);
      
      if (tokenToUse) {
        xhr.setRequestHeader('Authorization', `Bearer ${tokenToUse}`);
        console.log('Sending upload request with token (length:', tokenToUse.length, ')');
      } else {
        console.error('No token available for upload request');
        console.error('localStorage token:', storedToken);
        console.error('instance token:', this.token);
        reject(new Error('Authentication required. Please log in again.'));
        return;
      }
      
      // Don't set Content-Type header - let browser set it with boundary for FormData
      xhr.send(formData);
    });
  }

  async detectDeepfakeFromUrl(url: string, onProgress?: UploadProgressCallback): Promise<DetectionResult> {
    // Simulate progress for URL downloads
    if (onProgress) {
      onProgress(10); // Download started
      setTimeout(() => onProgress(50), 200); // Downloading
      setTimeout(() => onProgress(80), 500); // Processing
    }

    const response = await this.request<BackendPredictResponse>('/predict-url', {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        generate_gradcam: true,
      }),
    });

    if (onProgress) {
      onProgress(100);
    }

    const result = toFrontendDetectionResult(
      response.analysis,
      response.media_file,
      response.analysis.model ?? undefined
    );

    // Add GRAD-CAM heatmap if available
    if (response.gradcam_heatmap) {
      result.gradcamHeatmap = response.gradcam_heatmap;
    }
    
    // Add text explanation if available
    // Add video analysis if available
    if (response.video_analysis) {
      result.videoAnalysis = response.video_analysis;
    }

    return result;
  }

  async getDetectionHistory(page = 1, perPage = 20): Promise<{ results: DetectionResult[]; total: number }> {
    const data = await this.request<BackendHistoryResponse>(`/history?page=${page}&per_page=${perPage}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    const mappedResults = data.results.map((result) =>
      toFrontendDetectionResult(result, result.media_file, result.model ?? undefined),
    );

    return {
      results: mappedResults,
      total: data.total,
    };
  }

  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string; database: string; model_loaded: boolean }>('/health', {
      method: 'GET',
    });
  }

  // ==================== Admin Endpoints ====================

  async getAllUsers(): Promise<User[]> {
    const data = await this.request<{ users: BackendUser[] }>('/admin/users', {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    return data.users.map(toFrontendUser);
  }

  async getAdminHistory(page = 1, perPage = 100): Promise<{ results: DetectionResult[]; total: number }> {
    const data = await this.request<BackendHistoryResponse>(`/admin/history?page=${page}&per_page=${perPage}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    const mappedResults = data.results.map((result) =>
      toFrontendDetectionResult(result, result.media_file, result.model ?? undefined),
    );

    return {
      results: mappedResults,
      total: data.total,
    };
  }

  async getAdminStats(timeRange: string = '30d'): Promise<{
    total_users: number;
    regular_users: number;
    admin_users: number;
    active_users: number;
    total_media_files: number;
    total_analyses: number;
    deepfakes_detected: number;
    authentic_detected: number;
    detection_rate: number;
    avg_confidence: number;
  }> {
    return this.request(`/admin/stats?time_range=${timeRange}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  async getAnalytics(timeRange: string = '30d'): Promise<{
    daily_scans: Array<{ date: string; scans: number; deepfakes: number }>;
    confidence_distribution: Array<{ range: string; count: number }>;
  }> {
    return this.request(`/admin/analytics?time_range=${timeRange}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  async deleteUser(userId: string): Promise<void> {
    await this.request(`/admin/users/${userId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
  }

  async toggleUserStatus(userId: string, action?: 'suspend' | 'activate'): Promise<{ status: string }> {
    return this.request(`/admin/users/${userId}/toggle-status`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ action: action || 'toggle' }),
    });
  }

  // ==================== File Management Endpoints ====================

  async getAllFiles(page = 1, perPage = 20, filters?: { userId?: number; fileType?: string }): Promise<{
    total: number;
    pages: number;
    current_page: number;
    per_page: number;
    files: Array<{
      id: number;
      user_id: number;
      original_filename: string;
      stored_filename: string;
      storage_path: string;
      file_type: string;
      file_size: number | null;
      uploaded_at: string;
      last_analyzed_at: string | null;
      owner: { id: number; username: string; email: string } | null;
    }>;
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });
    if (filters?.userId) params.append('user_id', filters.userId.toString());
    if (filters?.fileType) params.append('file_type', filters.fileType);

    return this.request(`/admin/files?${params.toString()}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  async deleteFile(fileId: string): Promise<void> {
    await this.request(`/admin/files/${fileId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
  }

  async getStorageStats(): Promise<{
    total_files: number;
    total_size_bytes: number;
    total_size_mb: number;
    type_breakdown: Array<{ type: string; count: number; size: number }>;
    user_breakdown: Array<{ username: string; count: number; size: number }>;
  }> {
    return this.request('/admin/storage-stats', {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  // ==================== System Logs Endpoints ====================

  async getSystemLogs(
    page = 1,
    perPage = 50,
    filters?: { actionType?: string; userId?: number; statusCode?: number; search?: string }
  ): Promise<{
    total: number;
    pages: number;
    current_page: number;
    per_page: number;
    logs: Array<{
      id: number;
      user_id: number | null;
      action_type: string;
      status_code: number | null;
      ip_address: string | null;
      user_agent: string | null;
      details: Record<string, unknown>;
      created_at: string;
      user?: { id: number; username: string; email: string } | null;
    }>;
    available_action_types: string[];
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });
    if (filters?.actionType) params.append('action_type', filters.actionType);
    if (filters?.userId) params.append('user_id', filters.userId.toString());
    if (filters?.statusCode) params.append('status_code', filters.statusCode.toString());
    if (filters?.search) params.append('search', filters.search);

    return this.request(`/admin/logs?${params.toString()}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }
}

export const api = new ApiService();
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';