/**
 * Mock API Service for Development
 * 
 * This service simulates backend responses for development
 * without requiring the Python ML backend to be running.
 */

import type { 
  DetectionResult, 
  User, 
  DetectionModel,
  SystemStats 
} from '../App';

// Mock delay to simulate network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock data storage
let mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user',
    status: 'active',
    joinDate: '2024-01-10',
    lastActive: '2024-01-15',
    totalScans: 15
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'user',
    status: 'active',
    joinDate: '2024-01-12',
    lastActive: '2024-01-14',
    totalScans: 8
  },
  {
    id: '3',
    name: 'Admin User',
    email: 'admin@deepdetect.com',
    role: 'admin',
    status: 'active',
    joinDate: '2024-01-01',
    lastActive: '2024-01-15',
    totalScans: 0
  }
];

let mockDetectionResults: DetectionResult[] = [
  {
    id: '1',
    fileName: 'sample_video.mp4',
    date: '2024-01-15',
    result: 'deepfake',
    confidence: 87,
    userId: '1',
    modelUsed: 'Combined ResNet18',
    processingTime: 45
  },
  {
    id: '2',
    fileName: 'interview_clip.mp4',
    date: '2024-01-14',
    result: 'authentic',
    confidence: 94,
    userId: '2',
    modelUsed: 'Combined ResNet18',
    processingTime: 120
  },
  {
    id: '3',
    fileName: 'profile_image.jpg',
    date: '2024-01-13',
    result: 'authentic',
    confidence: 98,
    userId: '1',
    modelUsed: 'Combined ResNet18',
    processingTime: 12
  }
];

let currentUser: User | null = null;
let authToken: string | null = null;

/**
 * Mock API Service Class
 */
export class MockApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('authToken');
    if (this.token) {
      // Restore user from localStorage
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        currentUser = JSON.parse(storedUser);
      }
    }
  }

  setToken(token: string) {
    this.token = token;
    authToken = token;
    localStorage.setItem('authToken', token);
  }

  clearToken() {
    this.token = null;
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
  }

  // ==================== Authentication ====================

  async login(email: string, password: string) {
    await delay(500);

    const user = mockUsers.find(u => u.email === email);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }

    currentUser = user;
    const token = `mock-token-${Date.now()}`;
    this.setToken(token);
    localStorage.setItem('currentUser', JSON.stringify(user));

    return {
      user,
      token,
    };
  }

  async signup(name: string, email: string, password: string) {
    await delay(500);

    const existingUser = mockUsers.find(u => u.email === email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      role: 'user',
      status: 'active',
      joinDate: new Date().toISOString().split('T')[0],
      lastActive: new Date().toISOString().split('T')[0],
      totalScans: 0
    };

    mockUsers.push(newUser);
    currentUser = newUser;
    const token = `mock-token-${Date.now()}`;
    this.setToken(token);
    localStorage.setItem('currentUser', JSON.stringify(newUser));

    return {
      user: newUser,
      token,
    };
  }

  async logout() {
    await delay(200);
    this.clearToken();
  }

  async verifySession() {
    await delay(200);
    
    if (!this.token || !currentUser) {
      throw new Error('Not authenticated');
    }

    return currentUser;
  }

  // ==================== Detection ====================

  async detectDeepfake(
    file: File,
    onProgress?: (progress: number) => void
  ) {
    // Simulate upload progress
    if (onProgress) {
      for (let i = 0; i <= 100; i += 10) {
        await delay(100);
        onProgress(i);
      }
    }

    // Simulate processing time (Combined ResNet18 processing)
    const processingTime = 4000;
    await delay(processingTime);

    // Generate realistic result
    const isDeepfake = Math.random() > 0.6;
    const baseConfidence = 95; // High accuracy for Combined ResNet18
    const variance = 5; // Low variance for combined model
    const confidence = Math.min(99, Math.max(85, baseConfidence + (Math.random() - 0.5) * variance));

    const result: DetectionResult = {
      id: Date.now().toString(),
      fileName: file.name,
      date: new Date().toISOString().split('T')[0],
      result: isDeepfake ? 'deepfake' : 'authentic',
      confidence: Math.floor(confidence),
      fileUrl: URL.createObjectURL(file),
      userId: currentUser?.id,
      modelUsed: 'Combined ResNet18',
      processingTime: processingTime / 1000
    };

    mockDetectionResults.unshift(result);

    return {
      result,
      processingTime: processingTime / 1000,
      modelVersion: 'v2.0.0'
    };
  }

  async detectDeepfakeFromUrl(url: string, onProgress?: (progress: number) => void): Promise<DetectionResult> {
    // Simulate URL download and analysis
    if (onProgress) {
      for (let i = 0; i <= 100; i += 10) {
        await delay(100);
        onProgress(i);
      }
    }

    const processingTime = 4000;
    await delay(processingTime);

    const isDeepfake = Math.random() > 0.6;
    const baseConfidence = 95;
    const variance = 5;
    const confidence = Math.min(99, Math.max(85, baseConfidence + (Math.random() - 0.5) * variance));

    const result: DetectionResult = {
      id: Date.now().toString(),
      fileName: url.split('/').pop() || 'image_from_url.jpg',
      date: new Date().toISOString().split('T')[0],
      result: isDeepfake ? 'deepfake' : 'authentic',
      confidence: Math.floor(confidence),
      fileUrl: url,
      userId: currentUser?.id,
      modelUsed: 'Combined ResNet18',
      processingTime: processingTime / 1000
    };

    mockDetectionResults.unshift(result);
    return result;
  }

  async getDetectionResult(resultId: string) {
    await delay(300);
    
    const result = mockDetectionResults.find(r => r.id === resultId);
    if (!result) {
      throw new Error('Result not found');
    }

    return result;
  }

  async getDetectionHistory(page = 1, limit = 50) {
    await delay(300);

    const start = (page - 1) * limit;
    const end = start + limit;
    const userResults = mockDetectionResults.filter(r => r.userId === currentUser?.id);
    
    return {
      results: userResults.slice(start, end),
      total: userResults.length
    };
  }

  async deleteDetectionResult(resultId: string) {
    await delay(300);
    mockDetectionResults = mockDetectionResults.filter(r => r.id !== resultId);
  }

  // ==================== User Management ====================

  async getUserProfile() {
    await delay(300);
    
    if (!currentUser) {
      throw new Error('Not authenticated');
    }

    return currentUser;
  }

  async updateUserProfile(updates: Partial<User>) {
    await delay(300);
    
    if (!currentUser) {
      throw new Error('Not authenticated');
    }

    currentUser = { ...currentUser, ...updates };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    const userIndex = mockUsers.findIndex(u => u.id === currentUser!.id);
    if (userIndex !== -1) {
      mockUsers[userIndex] = currentUser;
    }

    return currentUser;
  }

  // ==================== Admin ====================

  async getAllUsers() {
    await delay(300);
    
    if (currentUser?.role !== 'admin') {
      throw new Error('Unauthorized');
    }

    return mockUsers;
  }

  async getSystemStats() {
    await delay(300);
    
    if (currentUser?.role !== 'admin') {
      throw new Error('Unauthorized');
    }

    const stats: SystemStats = {
      totalUsers: mockUsers.length,
      activeUsers: mockUsers.filter(u => u.status === 'active').length,
      totalScans: mockDetectionResults.length,
      deepfakesDetected: mockDetectionResults.filter(r => r.result === 'deepfake').length,
      avgConfidence: mockDetectionResults.reduce((sum, r) => sum + r.confidence, 0) / mockDetectionResults.length,
      systemUptime: '99.9%'
    };

    return stats;
  }

  async updateUserStatus(userId: string, status: 'active' | 'suspended') {
    await delay(300);
    
    if (currentUser?.role !== 'admin') {
      throw new Error('Unauthorized');
    }

    const user = mockUsers.find(u => u.id === userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.status = status;
    return user;
  }

  async deleteUser(userId: string) {
    await delay(300);
    
    if (currentUser?.role !== 'admin') {
      throw new Error('Unauthorized');
    }

    mockUsers = mockUsers.filter(u => u.id !== userId);
  }
}

// Export singleton instance
export const mockApi = new MockApiService();
