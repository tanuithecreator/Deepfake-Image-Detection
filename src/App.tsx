import { useEffect, useMemo, useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { Dashboard } from './components/Dashboard';
import { UploadPage } from './components/UploadPage';
import { ResultsPage } from './components/ResultsPage';
import { HistoryPage } from './components/HistoryPage';
import { SettingsPage } from './components/SettingsPage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminUserManagement } from './components/admin/AdminUserManagement';
import { AdminFileManagement } from './components/admin/AdminFileManagement';
import { AdminLogsViewer } from './components/admin/AdminLogsViewer';
import { AdminAnalytics } from './components/admin/AdminAnalytics';
import { AdminSystemSettings } from './components/admin/AdminSystemSettings';
import { AdminAuthPage } from './components/admin/AdminAuthPage';
import { api, USE_MOCK_API } from './services/api';
import { MockApiService } from './services/mockApi';

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
  gradcamHeatmap?: string; // Base64 encoded GRAD-CAM heatmap image
  videoAnalysis?: {
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
  const [users, setUsers] = useState<User[]>([]);
  const [detectionResults, setDetectionResults] = useState<DetectionResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<DetectionResult | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const mockApi = useMemo(() => (USE_MOCK_API ? new MockApiService() : null), []);

  useEffect(() => {
    const bootstrap = async () => {
      if (USE_MOCK_API && mockApi) {
        try {
          const currentUser = await mockApi.verifySession();
          setUser(currentUser);
          setIsAuthenticated(true);
          setCurrentPage(currentUser.role === 'admin' ? 'admin-dashboard' : 'dashboard');
          const history = await mockApi.getDetectionHistory();
          setDetectionResults(history.results);
        } catch {
          mockApi.clearToken();
        } finally {
          setIsLoadingSession(false);
        }
        return;
      }

      // Check if token exists before trying to get user
      const token = localStorage.getItem('authToken');
      if (!token || !token.trim()) {
        // No token, user is not authenticated
        setUser(null);
        setIsAuthenticated(false);
        setDetectionResults([]);
        setSelectedResult(null);
        setIsLoadingSession(false);
        return;
      }

      try {
        const currentUser = await api.getCurrentUser();
        setUser(currentUser);
        setIsAuthenticated(true);
        setCurrentPage(currentUser.role === 'admin' ? 'admin-dashboard' : 'dashboard');

        // Fetch data based on user role
        try {
          if (currentUser.role === 'admin') {
            // Fetch admin data
            try {
              const [allUsers, history] = await Promise.all([
                api.getAllUsers(),
                api.getDetectionHistory(),
              ]);
              setUsers(allUsers);
              setDetectionResults(history.results);
            } catch (adminError) {
              console.warn('Failed to load admin data:', adminError);
              setUsers([]);
              setDetectionResults([]);
              setSelectedResult(null);
            }
          } else {
            // Fetch regular user history
            const history = await api.getDetectionHistory();
            setDetectionResults(history.results);
          }
        } catch (dataError) {
          // Data fetch failed, but user is authenticated - just log it
          console.warn('Failed to load data:', dataError);
          setDetectionResults([]);
          setSelectedResult(null);
        }
      } catch (error) {
        // Only clear token if it's actually an auth error, not a network error
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('Invalid')) {
          console.warn('Authentication failed on bootstrap, clearing token');
          api.clearToken();
        } else {
          console.warn('Bootstrap error (may be network issue):', errorMessage);
          // Don't clear token on network errors - might be temporary
        }
        setUser(null);
        setIsAuthenticated(false);
        setDetectionResults([]);
        setSelectedResult(null);
      } finally {
        setIsLoadingSession(false);
      }
    };

    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigate = (page: string) => {
    // Clear errors when navigating to landing or auth pages
    if (page === 'landing' || page === 'auth') {
      setErrorMessage(null);
    }
    setCurrentPage(page);
  };

  const login = async (identifier: string, password: string) => {
    try {
      setErrorMessage(null);
      let authenticatedUser: User;
      if (USE_MOCK_API && mockApi) {
        const response = await mockApi.login(identifier, password);
        authenticatedUser = response.user;
      } else {
        authenticatedUser = await api.login(identifier, password);
        // Verify token is stored after login
        const tokenCheck = localStorage.getItem('authToken');
        if (!tokenCheck || !tokenCheck.trim()) {
          throw new Error('Failed to store authentication token. Please try again.');
        }
      }
      setUser(authenticatedUser);
      setIsAuthenticated(true);
      setCurrentPage(authenticatedUser.role === 'admin' ? 'admin-dashboard' : 'dashboard');

      // Fetch data based on user role
      try {
        if (authenticatedUser.role === 'admin') {
          // Fetch admin data
          if (!USE_MOCK_API) {
            try {
              const [allUsers, history] = await Promise.all([
                api.getAllUsers(),
                api.getDetectionHistory(),
              ]);
              setUsers(allUsers);
              setDetectionResults(history.results);
            } catch (adminError) {
              console.warn('Failed to load admin data:', adminError);
              setUsers([]);
              setDetectionResults([]);
              setSelectedResult(null);
            }
          } else if (mockApi) {
            const [allUsers, history] = await Promise.all([
              mockApi.getAllUsers(),
              mockApi.getDetectionHistory(),
            ]);
            setUsers(allUsers);
            setDetectionResults(history.results);
          }
        } else {
          // Fetch regular user history
          const history = USE_MOCK_API && mockApi
            ? await mockApi.getDetectionHistory()
            : await api.getDetectionHistory();
          setDetectionResults(history.results);
        }
      } catch (dataError) {
        console.warn('Failed to load data after login:', dataError);
        setDetectionResults([]);
        setSelectedResult(null);
        // Don't throw - login was successful
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to login. Please try again.',
      );
      // Clear any partial state on login failure
      setUser(null);
      setIsAuthenticated(false);
      setDetectionResults([]);
      setSelectedResult(null);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      setErrorMessage(null);
      if (USE_MOCK_API && mockApi) {
        await mockApi.signup(name, email, password);
        await login(email, password);
      } else {
        // Register - now returns token automatically, so we're already logged in
        const registeredUser = await api.register(name, email, password);
        
        // Verify token is stored after registration
        const tokenCheck = localStorage.getItem('authToken');
        if (!tokenCheck || !tokenCheck.trim()) {
          throw new Error('Failed to store authentication token. Please try logging in.');
        }
        
        setUser(registeredUser);
        setIsAuthenticated(true);
        setCurrentPage(registeredUser.role === 'admin' ? 'admin-dashboard' : 'dashboard');

        // Fetch history - don't fail signup if history fails
        try {
          const history = await api.getDetectionHistory();
          setDetectionResults(history.results);
        } catch (historyError) {
          console.warn('Failed to load history after signup:', historyError);
          setDetectionResults([]);
          setSelectedResult(null);
          // Don't throw - signup was successful
        }
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to create your account. Please try again.',
      );
      // Clear any partial state on signup failure
      setUser(null);
      setIsAuthenticated(false);
      setDetectionResults([]);
      setSelectedResult(null);
    }
  };

  const logout = async () => {
    try {
      if (USE_MOCK_API && mockApi) {
        await mockApi.logout();
      } else {
        await api.logout();
      }
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setDetectionResults([]);
      setSelectedResult(null);
      setErrorMessage(null); // Clear any error messages
      setCurrentPage('landing');
    }
  };

  const addDetectionResult = async (result: DetectionResult) => {
    // Add to local state immediately for UI responsiveness
    setDetectionResults(prev => [result, ...prev]);
    setSelectedResult(result);
    
    // Refresh from API to ensure we have the latest data from database
    // But preserve GRAD-CAM from the newly uploaded result
    if (!USE_MOCK_API) {
      try {
        const history = await api.getDetectionHistory();
        // Merge: preserve GRAD-CAM from the new result if it exists
        const resultInHistory = history.results.find(r => r.id === result.id);
        const mergedResults = history.results.map(historyResult => {
          // If this is the same result (by ID), preserve GRAD-CAM from the new result
          if (historyResult.id === result.id && result.gradcamHeatmap) {
            return {
              ...historyResult,
              gradcamHeatmap: result.gradcamHeatmap,
              videoAnalysis: result.videoAnalysis || historyResult.videoAnalysis
            };
          }
          return historyResult;
        });
        
        // If the new result is not in history yet (race condition), add it at the beginning
        if (!resultInHistory) {
          mergedResults.unshift(result);
        }
        
        setDetectionResults(mergedResults);
      } catch (error) {
        console.warn('Failed to refresh history after upload:', error);
        // Keep the local state if API refresh fails
      }
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  useEffect(() => {
    if (detectionResults.length === 0) {
      setSelectedResult(null);
      return;
    }

    setSelectedResult(prev => {
      if (prev) {
        const updated = detectionResults.find(r => r.id === prev.id);
        return updated || detectionResults[0];
      }
      return detectionResults[0];
    });
  }, [detectionResults]);

  const openResult = (result: DetectionResult) => {
    setSelectedResult(result);
    setCurrentPage('results');
  };

  const renderPage = () => {
    if (isLoadingSession) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <p className="text-muted-foreground">Loading your session...</p>
        </div>
      );
    }

    switch (currentPage) {
      case 'landing':
        return (
          <LandingPage
            navigate={navigate}
            isAuthenticated={isAuthenticated}
            errorMessage={errorMessage}
          />
        );
      case 'auth':
        return (
          <AuthPage
            navigate={navigate}
            login={login}
            signup={signup}
            errorMessage={errorMessage}
            clearError={() => setErrorMessage(null)}
          />
        );
      case 'dashboard':
        return (
          <Dashboard 
            navigate={navigate} 
            user={user} 
            logout={logout} 
            recentResults={detectionResults} 
          />
        );
      case 'upload':
        return (
          <UploadPage 
            navigate={navigate} 
            user={user} 
            logout={logout} 
            addDetectionResult={addDetectionResult}
            onViewResult={openResult}
          />
        );
      case 'results': {
        const resultToDisplay = selectedResult || detectionResults[0];
        if (!resultToDisplay) {
          return (
            <div className="flex min-h-screen items-center justify-center bg-background">
              <div className="text-center space-y-4">
                <p className="text-xl font-semibold">No analysis selected</p>
                <p className="text-muted-foreground">
                  Upload a media file or choose a record from your history to view detailed results.
                </p>
              </div>
            </div>
          );
        }
        return (
          <ResultsPage 
            navigate={navigate} 
            user={user} 
            logout={logout} 
            result={resultToDisplay}
          />
        );
      }
      case 'history':
        return (
          <HistoryPage 
            navigate={navigate} 
            user={user} 
            logout={logout} 
            results={detectionResults}
            selectedResultId={selectedResult?.id}
            onSelectResult={openResult}
            refreshHistory={async () => {
              if (!USE_MOCK_API) {
                try {
                  const history = await api.getDetectionHistory();
                  setDetectionResults(history.results);
                } catch (error) {
                  console.warn('Failed to refresh history:', error);
                }
              } else if (mockApi) {
                try {
                  const history = await mockApi.getDetectionHistory();
                  setDetectionResults(history.results);
                } catch (error) {
                  console.warn('Failed to refresh history:', error);
                }
              }
            }}
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
      case 'admin-files':
        return (
          <AdminFileManagement 
            navigate={navigate} 
            user={user} 
            logout={logout}
            users={users}
          />
        );
      case 'admin-logs':
        return (
          <AdminLogsViewer 
            navigate={navigate} 
            user={user} 
            logout={logout}
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
        return (
          <LandingPage
            navigate={navigate}
            isAuthenticated={isAuthenticated}
            errorMessage={errorMessage}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderPage()}
    </div>
  );
}