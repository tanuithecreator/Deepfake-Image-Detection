import { useState, useEffect } from 'react';
import { Navigation } from './Navigation';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar,
  FileText,
  Shield,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import type { DetectionResult, User } from '../App';

interface HistoryPageProps {
  navigate: (page: string) => void;
  user: User | null;
  logout: () => void;
  results: DetectionResult[];
  refreshHistory?: () => Promise<void>;
  selectedResultId?: DetectionResult['id'];
  onSelectResult?: (result: DetectionResult) => void;
}

export function HistoryPage({ 
  navigate, 
  user, 
  logout, 
  results, 
  refreshHistory,
  selectedResultId,
  onSelectResult
}: HistoryPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterResult, setFilterResult] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh history when component mounts
  useEffect(() => {
    if (refreshHistory) {
      refreshHistory();
    }
  }, [refreshHistory]);

  const handleRefresh = async () => {
    if (refreshHistory) {
      setIsRefreshing(true);
      try {
        await refreshHistory();
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const filteredResults = results
    .filter(result => {
      const matchesSearch = result.fileName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterResult === 'all' || result.result === filterResult;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'name':
          return a.fileName.localeCompare(b.fileName);
        case 'confidence':
          return b.confidence - a.confidence;
        default:
          return 0;
      }
    });

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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const exportHistory = () => {
    const csvContent = [
      ['File Name', 'Date', 'Result', 'Confidence'].join(','),
      ...filteredResults.map(result => [
        result.fileName,
        result.date,
        result.result,
        `${result.confidence}%`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'deepdetect-history.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalScans = results.length;
  const authenticCount = results.filter(r => r.result === 'authentic').length;
  const deepfakeCount = results.filter(r => r.result === 'deepfake').length;
  const avgConfidence = results.length > 0 
    ? Math.round(results.reduce((sum, r) => sum + r.confidence, 0) / results.length)
    : 0;

  return (
    <div className="flex h-screen bg-gray-50">
      <Navigation navigate={navigate} currentPage="history" user={user} logout={logout} />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Analysis History</h1>
            <p className="text-muted-foreground">
              View and manage your past deepfake detection analyses
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                    <p className="text-sm text-muted-foreground">Authentic</p>
                    <p className="text-2xl font-bold text-green-600">{authenticCount}</p>
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
                    <p className="text-2xl font-bold text-red-600">{deepfakeCount}</p>
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
                  <div className="h-12 w-12 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-teal-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="border-0 shadow-lg mb-6">
            <CardHeader>
              <CardTitle>Search and Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by file name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={filterResult} onValueChange={setFilterResult}>
                  <SelectTrigger className="w-full md:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by result" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Results</SelectItem>
                    <SelectItem value="authentic">Authentic Only</SelectItem>
                    <SelectItem value="deepfake">Deepfakes Only</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date (Newest)</SelectItem>
                    <SelectItem value="name">File Name</SelectItem>
                    <SelectItem value="confidence">Confidence</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  onClick={handleRefresh} 
                  variant="outline" 
                  disabled={isRefreshing || !refreshHistory}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
                <Button onClick={exportHistory} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Table */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-0">
              {filteredResults.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No results found</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery || filterResult !== 'all' 
                      ? 'Try adjusting your search or filters.'
                      : 'Upload your first media file to get started!'
                    }
                  </p>
                  <Button 
                    onClick={() => navigate('upload')}
                    className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
                  >
                    Upload Media
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResults.map((result) => (
                      <TableRow 
                        key={result.id} 
                        className={`hover:bg-gray-50 ${selectedResultId === result.id ? 'bg-blue-50/70' : ''}`}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              result.result === 'authentic' ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              {result.result === 'authentic' ? (
                                <Shield className="h-4 w-4 text-green-600" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium truncate max-w-64">{result.fileName}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(result.date)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getResultBadge(result.result)}
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${getConfidenceColor(result.confidence)}`}>
                            {result.confidence}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (onSelectResult) {
                                onSelectResult(result);
                              } else {
                                navigate('results');
                              }
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}