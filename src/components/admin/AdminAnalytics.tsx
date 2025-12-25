import { useEffect, useState } from 'react';
import { AdminNavigation } from './AdminNavigation';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
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
  Bar
} from 'recharts';
import { 
  Calendar, 
  FileText,
  Users,
  Shield,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { api } from '../../services/api';
import type { DetectionResult, User } from '../../App';
import { formatDateShort } from '../../utils/dateUtils';

interface AdminAnalyticsProps {
  navigate: (page: string) => void;
  user: User | null;
  logout: () => void;
  users: User[];
  detectionResults: DetectionResult[];
}

interface AnalyticsData {
  daily_scans: Array<{ date: string; scans: number; deepfakes: number }>;
  confidence_distribution: Array<{ range: string; count: number }>;
}

export function AdminAnalytics({ navigate, user, logout, users, detectionResults }: AdminAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [adminStats, setAdminStats] = useState<{
    total_analyses: number;
    deepfakes_detected: number;
    authentic_detected: number;
  } | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingAnalytics(true);
        setAnalyticsError(null);
        
        // Pass timeRange to API calls
        const [analyticsData, statsData] = await Promise.all([
          api.getAnalytics(timeRange),
          api.getAdminStats(timeRange),
        ]);
        
        setAnalytics(analyticsData);
        setAdminStats({
          total_analyses: statsData.total_analyses,
          deepfakes_detected: statsData.deepfakes_detected,
          authentic_detected: statsData.authentic_detected,
        });
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
        setAnalyticsError(error instanceof Error ? error.message : 'Failed to load analytics');
      } finally {
        setIsLoadingAnalytics(false);
      }
    };

    fetchData();
  }, [timeRange]);

  // Format daily scans data for chart
  const dailyScansData = analytics?.daily_scans.map(item => ({
    date: formatDateShort(item.date),
    scans: item.scans,
    deepfakes: item.deepfakes
  })) ?? [];

  // Use real confidence distribution from API
  const confidenceDistribution = analytics?.confidence_distribution ?? [];

  const totalUsers = users.filter(u => u.role === 'user').length;
  const activeUsers = users.filter(u => u.status === 'active' && u.role === 'user').length;
  
  // Use admin stats if available, otherwise fall back to detectionResults prop
  const totalScans = adminStats?.total_analyses ?? detectionResults.length;
  const deepfakesDetected = adminStats?.deepfakes_detected ?? detectionResults.filter(r => r.result === 'deepfake').length;
  const authenticDetected = adminStats?.authentic_detected ?? detectionResults.filter(r => r.result === 'authentic').length;

  // Prepare data for deepfake vs authentic bar chart
  const deepfakeVsAuthenticData = [
    { name: 'Authentic', count: authenticDetected, fill: '#10b981' },
    { name: 'Deepfake', count: deepfakesDetected, fill: '#ef4444' }
  ];
  
  const avgConfidence = totalScans > 0 
    ? (detectionResults.length > 0
        ? Math.round(detectionResults.reduce((sum, r) => sum + r.confidence, 0) / detectionResults.length)
        : 0)
    : 0;

  const detectionRate = totalScans > 0 ? Math.round((deepfakesDetected / totalScans) * 100) : 0;

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
              <Select value={timeRange} onValueChange={setTimeRange}>
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
                    <p className="text-sm text-muted-foreground">Active Users</p>
                    <p className="text-2xl font-bold">{activeUsers}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {totalUsers} total users
                    </p>
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
                {isLoadingAnalytics ? (
                  <div className="h-80 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : analyticsError ? (
                  <div className="h-80 flex items-center justify-center text-red-600">
                    <div className="text-center">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                      <p>{analyticsError}</p>
                    </div>
                  </div>
                ) : dailyScansData.length === 0 ? (
                  <div className="h-80 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No data available for the selected period</p>
                    </div>
                  </div>
                ) : (
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
                )}
              </CardContent>
            </Card>

            {/* Deepfake vs Authentic Bar Chart */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Deepfake vs Authentic</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingAnalytics ? (
                  <div className="h-80 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : analyticsError ? (
                  <div className="h-80 flex items-center justify-center text-red-600">
                    <div className="text-center">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                      <p>{analyticsError}</p>
                    </div>
                  </div>
                ) : totalScans === 0 ? (
                  <div className="h-80 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No detection data available</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={deepfakeVsAuthenticData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => [value, 'Count']}
                          labelFormatter={(label) => `Type: ${label}`}
                        />
                        <Bar 
                          dataKey="count" 
                          radius={[8, 8, 0, 0]}
                          fill="#8884d8"
                        >
                          {deepfakeVsAuthenticData.map((entry, index) => (
                            <Bar.Cell key={index} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Confidence Distribution */}
          <Card className="border-0 shadow-lg mb-8">
            <CardHeader>
              <CardTitle>Confidence Score Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingAnalytics ? (
                <div className="h-80 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : analyticsError ? (
                <div className="h-80 flex items-center justify-center text-red-600">
                  <div className="text-center">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                    <p>{analyticsError}</p>
                  </div>
                </div>
              ) : confidenceDistribution.length === 0 ? (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No confidence data available</p>
                  </div>
                </div>
              ) : (
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
              )}
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
                    {authenticDetected}
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