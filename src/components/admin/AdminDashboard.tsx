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
  Eye
} from 'lucide-react';
import type { DetectionResult, User } from '../../App';

interface AdminDashboardProps {
  navigate: (page: string) => void;
  user: User | null;
  logout: () => void;
  users: User[];
  detectionResults: DetectionResult[];
}

export function AdminDashboard({ navigate, user, logout, users, detectionResults }: AdminDashboardProps) {
  const totalUsers = users.filter(u => u.role === 'user').length;
  const activeUsers = users.filter(u => u.status === 'active' && u.role === 'user').length;
  const totalScans = detectionResults.length;
  const deepfakesDetected = detectionResults.filter(r => r.result === 'deepfake').length;
  const avgConfidence = totalScans > 0 
    ? Math.round(detectionResults.reduce((sum, r) => sum + r.confidence, 0) / totalScans)
    : 0;

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
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">{totalUsers}</p>
                    <p className="text-xs text-green-600 mt-1">↑ +12% this month</p>
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
                    <p className="text-xs text-green-600 mt-1">↑ +5% this week</p>
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
                    <p className="text-xs text-blue-600 mt-1">↑ +28% this week</p>
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
                    <p className="text-xs text-yellow-600 mt-1">↑ +3 this week</p>
                  </div>
                  <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

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
                    <span className="text-sm">CPU Usage</span>
                    <span className="text-sm font-medium">42%</span>
                  </div>
                  <Progress value={42} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Memory Usage</span>
                    <span className="text-sm font-medium">67%</span>
                  </div>
                  <Progress value={67} className="h-2 [&>div]:bg-yellow-500" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Storage</span>
                    <span className="text-sm font-medium">23%</span>
                  </div>
                  <Progress value={23} className="h-2 [&>div]:bg-green-500" />
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Uptime:</span>
                    <span className="font-medium">23d 14h 32m</span>
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