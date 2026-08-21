/**
 * API Service Facade
 * 
 * This module exports the appropriate API service based on the environment.
 * - In development with VITE_USE_MOCK_API=true, it uses the mock API
 * - In production or with VITE_USE_MOCK_API=false, it uses the real API
 */

import { api as realApi, USE_MOCK_API } from './api';
import { mockApi } from './mockApi';

// Export the appropriate API based on environment
export const apiService = USE_MOCK_API ? mockApi : realApi;

// Re-export types
export type { 
  LoginRequest,
  SignupRequest,
  AuthResponse,
  DetectionRequest,
  DetectionResponse,
  UploadProgressCallback
} from './api';

// Export for explicit usage
export { api as realApi } from './api';
export { mockApi } from './mockApi';
