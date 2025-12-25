import { useEffect, useState } from 'react';
import { AdminNavigation } from './AdminNavigation';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { 
  Search, 
  Filter, 
  FileText,
  User,
  Calendar,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { api } from '../../services/api';
import { formatDateTimeEAT } from '../../utils/dateUtils';
import type { User as UserType } from '../../App';

interface AdminLogsViewerProps {
  navigate: (page: string) => void;
  user: UserType | null;
  logout: () => void;
}

interface LogData {
  id: number;
  user_id: number | null;
  action_type: string;
  status_code: number | null;
  ip_address: string | null;
  user_agent: string | null;
  details: Record<string, unknown>;
  created_at: string;
  user?: { id: number; username: string; email: string } | null;
}

export function AdminLogsViewer({ navigate, user, logout }: AdminLogsViewerProps) {
  const [logs, setLogs] = useState<LogData[]>([]);
  const [availableActionTypes, setAvailableActionTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [page, setPage] = useState(1);
  const [perPage] = useState(50);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActionType, setFilterActionType] = useState<string>('all');
  const [filterStatusCode, setFilterStatusCode] = useState<string>('all');

  useEffect(() => {
    fetchLogs();
  }, [page, filterActionType, filterStatusCode, searchQuery]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const filters: { actionType?: string; statusCode?: number; search?: string } = {};
      if (filterActionType !== 'all') {
        filters.actionType = filterActionType;
      }
      if (filterStatusCode !== 'all') {
        const code = parseInt(filterStatusCode);
        if (!isNaN(code)) filters.statusCode = code;
      }
      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }
      
      const data = await api.getSystemLogs(page, perPage, filters);
      setLogs(data.logs);
      setTotal(data.total);
      setPages(data.pages);
      setAvailableActionTypes(data.available_action_types);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      setError(error instanceof Error ? error.message : 'Failed to load logs');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return formatDateTimeEAT(dateString, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusBadge = (statusCode: number | null) => {
    if (!statusCode) return null;
    
    if (statusCode >= 200 && statusCode < 300) {
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          <CheckCircle className="h-3 w-3 mr-1" />
          {statusCode}
        </Badge>
      );
    } else if (statusCode >= 400 && statusCode < 500) {
      return (
        <Badge variant="destructive" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {statusCode}
        </Badge>
      );
    } else if (statusCode >= 500) {
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100">
          <XCircle className="h-3 w-3 mr-1" />
          {statusCode}
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        <Info className="h-3 w-3 mr-1" />
        {statusCode}
      </Badge>
    );
  };

  const formatActionType = (actionType: string) => {
    return actionType.split('.').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' → ');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminNavigation navigate={navigate} currentPage="admin-logs" user={user} logout={logout} />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">System Logs</h1>
            <p className="text-muted-foreground">
              View and filter system activity logs for security monitoring and debugging.
            </p>
          </div>

          {/* Search and Filters */}
          <Card className="border-0 shadow-sm mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs by action, IP, or user agent..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterActionType} onValueChange={setFilterActionType}>
                  <SelectTrigger className="w-64">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {availableActionTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {formatActionType(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatusCode} onValueChange={setFilterStatusCode}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Status Code" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="200">200 OK</SelectItem>
                    <SelectItem value="400">400 Bad Request</SelectItem>
                    <SelectItem value="401">401 Unauthorized</SelectItem>
                    <SelectItem value="403">403 Forbidden</SelectItem>
                    <SelectItem value="404">404 Not Found</SelectItem>
                    <SelectItem value="422">422 Unprocessable</SelectItem>
                    <SelectItem value="500">500 Server Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Logs Table */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Activity Logs</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {total} log{total !== 1 ? 's' : ''}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <div className="text-center py-12 text-red-600">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                  <p>{error}</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No logs found</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>IP Address</TableHead>
                          <TableHead>Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                {formatDate(log.created_at)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-sm">
                                {formatActionType(log.action_type)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {log.user ? (
                                <div>
                                  <p className="text-sm font-medium">{log.user.username}</p>
                                  <p className="text-xs text-muted-foreground">{log.user.email}</p>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">System</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(log.status_code)}
                            </TableCell>
                            <TableCell>
                              <span className="text-sm font-mono text-muted-foreground">
                                {log.ip_address || 'N/A'}
                              </span>
                            </TableCell>
                            <TableCell>
                              {log.details && Object.keys(log.details).length > 0 ? (
                                <details className="text-xs">
                                  <summary className="cursor-pointer text-blue-600 hover:text-blue-700">
                                    View Details
                                  </summary>
                                  <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto max-w-xs">
                                    {JSON.stringify(log.details, null, 2)}
                                  </pre>
                                </details>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Pagination */}
                  {pages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        Page {page} of {pages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(p => Math.min(pages, p + 1))}
                          disabled={page === pages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

















