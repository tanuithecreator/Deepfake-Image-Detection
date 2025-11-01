import { Navigation } from './Navigation';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Upload, FileText, Shield, TrendingUp } from 'lucide-react';
import type { DetectionResult, User } from '../App';

interface DashboardProps {
  navigate: (page: string) => void;
  user: User | null;
  logout: () => void;
  recentResults: DetectionResult[];
}

export function Dashboard({ navigate, user, logout, recentResults }: DashboardProps) {
  const getResultBadge = (result: 'authentic' | 'deepfake') => {
    return result === 'authentic' ? (
      <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
        Authentic
      </Badge>
    ) : (
      <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100">
        Deepfake
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Navigation navigate={navigate} currentPage="dashboard" user={user} logout={logout} />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name?.split(' ')[0]}!</h1>
            <p className="text-muted-foreground">Monitor your deepfake detection activity and upload new media for analysis.</p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Scans</p>
                    <p className="text-2xl font-bold">{recentResults.length}</p>
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
                    <p className="text-sm text-muted-foreground">Authentic</p>
                    <p className="text-2xl font-bold text-green-600">
                      {recentResults.filter(r => r.result === 'authentic').length}
                    </p>
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
                    <p className="text-sm text-muted-foreground">Deepfakes</p>
                    <p className="text-2xl font-bold text-red-600">
                      {recentResults.filter(r => r.result === 'deepfake').length}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Upload New Media</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Upload className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Upload Image or Video</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Drag and drop your media files or click to browse
                  </p>
                  <Button 
                    onClick={() => navigate('upload')}
                    className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
                  >
                    Upload Media
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Recent Detection Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentResults.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No detection activity yet.</p>
                      <p className="text-sm">Upload your first media file to get started!</p>
                    </div>
                  ) : (
                    recentResults.map((result) => (
                      <div key={result.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm truncate">{result.fileName}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(result.date)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">{result.confidence}%</span>
                          {getResultBadge(result.result)}
                        </div>
                      </div>
                    ))
                  )}
                  
                  {recentResults.length > 0 && (
                    <Button 
                      variant="outline" 
                      className="w-full mt-4"
                      onClick={() => navigate('history')}
                    >
                      View All History
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}