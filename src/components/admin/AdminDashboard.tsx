import { useEffect, useState } from 'react';
import { AdminNavigation } from './AdminNavigation';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  Users, 
  FileText, 
  Shield, 
  AlertTriangle, 
  TrendingUp,
  Activity,
  Server,
  Clock,
  Eye,
  Loader2
} from 'lucide-react';
import { api } from '../../services/api';
import type { DetectionResult, User } from '../../App';
import { generateComprehensiveReport } from '../../utils/reportGenerator';
import { formatDateTimeEAT } from '../../utils/dateUtils';

interface AdminDashboardProps {
  navigate: (page: string) => void;
  user: User | null;
  logout: () => void;
  users: User[];
  detectionResults: DetectionResult[];
}

interface AdminStats {
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
}

export function AdminDashboard({ navigate, user, logout, users, detectionResults }: AdminDashboardProps) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoadingStats(true);
        setStatsError(null);
        const statsData = await api.getAdminStats();
        setStats(statsData);
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
        setStatsError(error instanceof Error ? error.message : 'Failed to load statistics');
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  // Use real stats if available, otherwise fall back to computed values
  const totalUsers = stats?.regular_users ?? users.filter(u => u.role === 'user').length;
  const activeUsers = stats?.active_users ?? users.filter(u => u.status === 'active' && u.role === 'user').length;
  const totalScans = stats?.total_analyses ?? detectionResults.length;
  const deepfakesDetected = stats?.deepfakes_detected ?? detectionResults.filter(r => r.result === 'deepfake').length;
  const avgConfidence = stats?.avg_confidence ?? (totalScans > 0 
    ? Math.round(detectionResults.reduce((sum, r) => sum + r.confidence, 0) / totalScans)
    : 0);

  const recentActivity = detectionResults.slice(0, 10).map(result => ({
    ...result,
    user: users.find(u => u.id === result.userId)
  }));

  const getResultBadge = (result: 'authentic' | 'deepfake') => {
    return result === 'authentic' ? (
      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
        <Shield className="h-3 w-3 mr-1" />
        Authentic
      </Badge>
    ) : (
      <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Deepfake
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return formatDateTimeEAT(dateString, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleGenerateReport = async () => {
    try {
      // Fetch all required data for the report
      const [statsData, allUsers, allDetectionResults] = await Promise.all([
        stats ? Promise.resolve(stats) : api.getAdminStats(),
        users.length > 0 ? Promise.resolve(users) : api.getAllUsers(),
        detectionResults.length > 0 ? Promise.resolve(detectionResults) : (async () => {
          // Fetch all detection results for admin (may need multiple pages)
          let allResults: DetectionResult[] = [];
          let page = 1;
          let hasMore = true;
          
          while (hasMore && page <= 10) { // Limit to 10 pages (1000 results max)
            const history = await api.getAdminHistory(page, 100);
            allResults = [...allResults, ...history.results];
            hasMore = history.results.length === 100 && page * 100 < history.total;
            page++;
          }
          
          return allResults;
        })()
      ]);
      
      await generateComprehensiveReport(statsData, allUsers, allDetectionResults);
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report. Please try again.');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminNavigation navigate={navigate} currentPage="admin-dashboard" user={user} logout={logout} />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">System Administration</h1>
            <p className="text-muted-foreground">
              Monitor system performance, manage users, and oversee deepfake detection activities.
            </p>
          </div>

          {/* System Stats */}
          {isLoadingStats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center h-24">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : statsError ? (
            <Card className="border-0 shadow-sm mb-8 border-red-200 bg-red-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                  <p>Error loading statistics: {statsError}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Users</p>
                      <p className="text-2xl font-bold">{totalUsers}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stats?.admin_users ?? 0} admin{stats?.admin_users !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Users</p>
                      <p className="text-2xl font-bold text-green-600">{activeUsers}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Last 30 days
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Activity className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Scans</p>
                      <p className="text-2xl font-bold">{totalScans}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stats?.total_media_files ?? 0} files uploaded
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-teal-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-6 w-6 text-teal-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Deepfakes Found</p>
                      <p className="text-2xl font-bold text-red-600">{deepfakesDetected}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stats?.detection_rate ? `${stats.detection_rate}% detection rate` : ''}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* System Health */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-blue-600" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Detection Accuracy</span>
                    <span className="text-sm font-medium">{avgConfidence}%</span>
                  </div>
                  <Progress value={avgConfidence} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Detection Rate</span>
                    <span className="text-sm font-medium">
                      {stats?.detection_rate ? `${stats.detection_rate}%` : 'N/A'}
                    </span>
                  </div>
                  <Progress 
                    value={stats?.detection_rate ?? 0} 
                    className="h-2 [&>div]:bg-yellow-500" 
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Authentic Content</span>
                    <span className="text-sm font-medium">
                      {stats?.authentic_detected ?? 0}
                    </span>
                  </div>
                  <Progress 
                    value={stats?.total_analyses ? 
                      ((stats.authentic_detected / stats.total_analyses) * 100) : 0
                    } 
                    className="h-2 [&>div]:bg-green-500" 
                  />
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Total Analyses:</span>
                    <span className="font-medium">{totalScans}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="lg:col-span-2 border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Detection Activity</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('admin-analytics')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No recent activity</p>
                    </div>
                  ) : (
                    recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm truncate max-w-48">{activity.fileName}</p>
                            {getResultBadge(activity.result)}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>User: {activity.user?.name || 'Unknown'}</span>
                            <span>Confidence: {activity.confidence}%</span>
                            <span>{formatDate(activity.date)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Button
                    onClick={() => navigate('admin-users')}
                    className="h-auto p-4 flex flex-col gap-2"
                    variant="outline"
                  >
                    <Users className="h-8 w-8 text-blue-600" />
                    <span>Manage Users</span>
                  </Button>

                  <Button
                    onClick={() => navigate('admin-analytics')}
                    className="h-auto p-4 flex flex-col gap-2"
                    variant="outline"
                  >
                    <TrendingUp className="h-8 w-8 text-green-600" />
                    <span>View Analytics</span>
                  </Button>

                  <Button
                    onClick={() => navigate('admin-settings')}
                    className="h-auto p-4 flex flex-col gap-2"
                    variant="outline"
                  >
                    <Shield className="h-8 w-8 text-teal-600" />
                    <span>System Settings</span>
                  </Button>

                  <Button
                    onClick={handleGenerateReport}
                    className="h-auto p-4 flex flex-col gap-2"
                    variant="outline"
                  >
                    <FileText className="h-8 w-8 text-purple-600" />
                    <span>Generate Report</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}