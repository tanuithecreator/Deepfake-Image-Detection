import { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { Dashboard } from './components/Dashboard';
import { UploadPage } from './components/UploadPage';
import { ResultsPage } from './components/ResultsPage';
import { HistoryPage } from './components/HistoryPage';
import { SettingsPage } from './components/SettingsPage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminUserManagement } from './components/admin/AdminUserManagement';
import { AdminAnalytics } from './components/admin/AdminAnalytics';
import { AdminSystemSettings } from './components/admin/AdminSystemSettings';
import { AdminAuthPage } from './components/admin/AdminAuthPage';

export interface DetectionResult {
  id: string;
  fileName: string;
  date: string;
  result: 'authentic' | 'deepfake';
  confidence: number;
  fileUrl?: string;
  userId?: string;
  modelUsed?: string;
  processingTime?: number;
}

export interface DetectionModel {
  id: string;
  name: string;
  version: string;
  description: string;
  accuracy: number;
  speed: 'fast' | 'medium' | 'slow';
  speciality: string;
  processingTime: string;
  recommendedFor: string[];
  isPremium?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended';
  joinDate: string;
  lastActive: string;
  totalScans: number;
}

export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalScans: number;
  deepfakesDetected: number;
  avgConfidence: number;
  systemUptime: string;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>('landing');
  
  // Add this debug line
  console.log('App rendering, currentPage:', currentPage);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([
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
  ]);
  const [detectionResults, setDetectionResults] = useState<DetectionResult[]>([
    {
      id: '1',
      fileName: 'sample_video.mp4',
      date: '2024-01-15',
      result: 'deepfake',
      confidence: 87,
      userId: '1'
    },
    {
      id: '2',
      fileName: 'interview_clip.mp4',
      date: '2024-01-14',
      result: 'authentic',
      confidence: 94,
      userId: '2'
    },
    {
      id: '3',
      fileName: 'profile_image.jpg',
      date: '2024-01-13',
      result: 'authentic',
      confidence: 98,
      userId: '1'
    }
  ]);

  const navigate = (page: string) => {
    setCurrentPage(page);
  };

  const login = (email: string, password: string) => {
    // Mock login - check if admin
    if (email === 'admin@deepdetect.com') {
      const adminUser = users.find(u => u.email === email);
      setUser(adminUser || {
        id: '3',
        name: 'Admin User',
        email: 'admin@deepdetect.com',
        role: 'admin',
        status: 'active',
        joinDate: '2024-01-01',
        lastActive: new Date().toISOString().split('T')[0],
        totalScans: 0
      });
      setIsAuthenticated(true);
      setCurrentPage('admin-dashboard');
    } else {
      const regularUser = users.find(u => u.email === email) || {
        id: Date.now().toString(),
        name: 'John Doe',
        email,
        role: 'user' as const,
        status: 'active' as const,
        joinDate: new Date().toISOString().split('T')[0],
        lastActive: new Date().toISOString().split('T')[0],
        totalScans: 0
      };
      setUser(regularUser);
      setIsAuthenticated(true);
      setCurrentPage('dashboard');
    }
  };

  const signup = (name: string, email: string, password: string) => {
    // Mock signup
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      role: 'user' as const,
      status: 'active' as const,
      joinDate: new Date().toISOString().split('T')[0],
      lastActive: new Date().toISOString().split('T')[0],
      totalScans: 0
    };
    setUsers([...users, newUser]);
    setUser(newUser);
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setCurrentPage('landing');
  };

  const addDetectionResult = (result: DetectionResult) => {
    setDetectionResults([result, ...detectionResults]);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage navigate={navigate} isAuthenticated={isAuthenticated} />;
      case 'auth':
        return <AuthPage navigate={navigate} login={login} signup={signup} />;
      case 'dashboard':
        return (
          <Dashboard 
            navigate={navigate} 
            user={user} 
            logout={logout} 
            recentResults={detectionResults.slice(0, 5)} 
          />
        );
      case 'upload':
        return (
          <UploadPage 
            navigate={navigate} 
            user={user} 
            logout={logout} 
            addDetectionResult={addDetectionResult}
          />
        );
      case 'results':
        return (
          <ResultsPage 
            navigate={navigate} 
            user={user} 
            logout={logout} 
            result={detectionResults[0]}
          />
        );
      case 'history':
        return (
          <HistoryPage 
            navigate={navigate} 
            user={user} 
            logout={logout} 
            results={detectionResults}
          />
        );
      case 'settings':
        return (
          <SettingsPage 
            navigate={navigate} 
            user={user} 
            logout={logout} 
            updateUser={updateUser}
          />
        );
      case 'admin-dashboard':
        return (
          <AdminDashboard 
            navigate={navigate} 
            user={user} 
            logout={logout} 
            users={users}
            detectionResults={detectionResults}
          />
        );
      case 'admin-users':
        return (
          <AdminUserManagement 
            navigate={navigate} 
            user={user} 
            logout={logout}
            users={users}
            setUsers={setUsers}
          />
        );
      case 'admin-analytics':
        return (
          <AdminAnalytics 
            navigate={navigate} 
            user={user} 
            logout={logout}
            users={users}
            detectionResults={detectionResults}
          />
        );
      case 'admin-settings':
        return (
          <AdminSystemSettings 
            navigate={navigate} 
            user={user} 
            logout={logout} 
          />
        );
      case 'admin-auth':
        return (
          <AdminAuthPage 
            navigate={navigate} 
            login={login} 
            signup={signup} 
          />
        );
      default:
        return <LandingPage navigate={navigate} isAuthenticated={isAuthenticated} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderPage()}
    </div>
  );
}