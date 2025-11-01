import { AdminNavigation } from './AdminNavigation';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  FileText,
  Users,
  Shield,
  AlertTriangle
} from 'lucide-react';
import type { DetectionResult, User } from '../../App';

interface AdminAnalyticsProps {
  navigate: (page: string) => void;
  user: User | null;
  logout: () => void;
  users: User[];
  detectionResults: DetectionResult[];
}

export function AdminAnalytics({ navigate, user, logout, users, detectionResults }: AdminAnalyticsProps) {
  // Mock data for charts
  const dailyScansData = [
    { date: 'Jan 10', scans: 12, deepfakes: 2 },
    { date: 'Jan 11', scans: 19, deepfakes: 4 },
    { date: 'Jan 12', scans: 8, deepfakes: 1 },
    { date: 'Jan 13', scans: 15, deepfakes: 3 },
    { date: 'Jan 14', scans: 22, deepfakes: 5 },
    { date: 'Jan 15', scans: 18, deepfakes: 2 },
  ];

  const userActivityData = [
    { name: 'Active Daily', value: 65, color: '#22c55e' },
    { name: 'Active Weekly', value: 25, color: '#3b82f6' },
    { name: 'Inactive', value: 10, color: '#94a3b8' },
  ];

  const confidenceDistribution = [
    { range: '90-100%', count: 45 },
    { range: '80-89%', count: 32 },
    { range: '70-79%', count: 18 },
    { range: '60-69%', count: 8 },
    { range: '<60%', count: 3 },
  ];

  const totalUsers = users.filter(u => u.role === 'user').length;
  const activeUsers = users.filter(u => u.status === 'active' && u.role === 'user').length;
  const totalScans = detectionResults.length;
  const deepfakesDetected = detectionResults.filter(r => r.result === 'deepfake').length;
  const avgConfidence = totalScans > 0 
    ? Math.round(detectionResults.reduce((sum, r) => sum + r.confidence, 0) / totalScans)
    : 0;

  const detectionRate = totalScans > 0 ? Math.round((deepfakesDetected / totalScans) * 100) : 0;
  const userGrowthRate = 12; // Mock growth rate

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminNavigation navigate={navigate} currentPage="admin-analytics" user={user} logout={logout} />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Analytics & Reports</h1>
                <p className="text-muted-foreground">
                  Comprehensive insights into system usage and detection performance.
                </p>
              </div>
              <Select defaultValue="7d">
                <SelectTrigger className="w-48">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Scans</p>
                    <p className="text-2xl font-bold">{totalScans}</p>
                    <div className="flex items-center gap-1 text-xs mt-1">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="text-green-600">+28% from last period</span>
                    </div>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Detection Rate</p>
                    <p className="text-2xl font-bold">{detectionRate}%</p>
                    <div className="flex items-center gap-1 text-xs mt-1">
                      <TrendingDown className="h-3 w-3 text-red-600" />
                      <span className="text-red-600">-2% from last period</span>
                    </div>
                  </div>
                  <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Confidence</p>
                    <p className="text-2xl font-bold">{avgConfidence}%</p>
                    <div className="flex items-center gap-1 text-xs mt-1">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="text-green-600">+3% from last period</span>
                    </div>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">User Growth</p>
                    <p className="text-2xl font-bold">+{userGrowthRate}%</p>
                    <div className="flex items-center gap-1 text-xs mt-1">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="text-green-600">This month</span>
                    </div>
                  </div>
                  <div className="h-12 w-12 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-teal-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Daily Scans Chart */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Daily Scan Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyScansData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="scans" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="Total Scans"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="deepfakes" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        name="Deepfakes Detected"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* User Activity Pie Chart */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>User Activity Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={userActivityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {userActivityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  {userActivityData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-sm">{entry.name}: {entry.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Confidence Distribution */}
          <Card className="border-0 shadow-lg mb-8">
            <CardHeader>
              <CardTitle>Confidence Score Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={confidenceDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Detection Summary */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Recent Detection Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">
                    {detectionResults.filter(r => r.result === 'authentic').length}
                  </p>
                  <p className="text-sm text-green-700">Authentic Content</p>
                </div>

                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-600">{deepfakesDetected}</p>
                  <p className="text-sm text-red-700">Deepfakes Detected</p>
                </div>

                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{totalScans}</p>
                  <p className="text-sm text-blue-700">Total Analyzed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}