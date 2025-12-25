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
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Search, 
  Filter, 
  Download, 
  Trash2,
  File,
  HardDrive,
  User,
  Calendar,
  Loader2,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import { api } from '../../services/api';
import { formatDateTimeEAT } from '../../utils/dateUtils';
import type { User as UserType } from '../../App';

interface AdminFileManagementProps {
  navigate: (page: string) => void;
  user: UserType | null;
  logout: () => void;
  users: UserType[];
}

interface FileData {
  id: number;
  user_id: number;
  original_filename: string;
  stored_filename: string;
  storage_path: string;
  file_type: string;
  file_size: number | null;
  uploaded_at: string;
  last_analyzed_at: string | null;
  owner: { id: number; username: string; email: string } | null;
}

interface StorageStats {
  total_files: number;
  total_size_bytes: number;
  total_size_mb: number;
  type_breakdown: Array<{ type: string; count: number; size: number }>;
  user_breakdown: Array<{ username: string; count: number; size: number }>;
}

export function AdminFileManagement({ navigate, user, logout, users }: AdminFileManagementProps) {
  const [files, setFiles] = useState<FileData[]>([]);
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState<string | null>(null);
  
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    fetchFiles();
    fetchStorageStats();
  }, [page, filterUser, filterType]);

  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const filters: { userId?: number; fileType?: string } = {};
      if (filterUser !== 'all') {
        const userId = parseInt(filterUser);
        if (!isNaN(userId)) filters.userId = userId;
      }
      if (filterType !== 'all') {
        filters.fileType = filterType;
      }
      
      const data = await api.getAllFiles(page, perPage, filters);
      setFiles(data.files);
      setTotal(data.total);
      setPages(data.pages);
    } catch (error) {
      console.error('Failed to fetch files:', error);
      setError(error instanceof Error ? error.message : 'Failed to load files');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStorageStats = async () => {
    try {
      setIsLoadingStats(true);
      const stats = await api.getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error('Failed to fetch storage stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleDeleteFile = async (fileId: number, filename: string) => {
    if (!confirm(`Are you sure you want to delete "${filename}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.deleteFile(fileId.toString());
      setShowAlert(`File "${filename}" deleted successfully`);
      setTimeout(() => setShowAlert(null), 3000);
      fetchFiles();
      fetchStorageStats();
    } catch (error) {
      setShowAlert(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setShowAlert(null), 3000);
    }
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateString: string) => {
    return formatDateTimeEAT(dateString, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredFiles = files.filter(file => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      file.original_filename.toLowerCase().includes(query) ||
      file.owner?.username.toLowerCase().includes(query) ||
      file.owner?.email.toLowerCase().includes(query)
    );
  });

  const fileTypes = Array.from(new Set(files.map(f => f.file_type))).sort();

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminNavigation navigate={navigate} currentPage="admin-files" user={user} logout={logout} />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">File Management</h1>
            <p className="text-muted-foreground">
              Manage uploaded files, monitor storage usage, and clean up old files.
            </p>
          </div>

          {/* Alert */}
          {showAlert && (
            <Alert className={`mb-6 ${showAlert.includes('Failed') ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
              {showAlert.includes('Failed') ? (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              <AlertDescription className={showAlert.includes('Failed') ? 'text-red-700' : 'text-green-700'}>
                {showAlert}
              </AlertDescription>
            </Alert>
          )}

          {/* Storage Stats */}
          {isLoadingStats ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
          ) : storageStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Files</p>
                      <p className="text-2xl font-bold">{storageStats.total_files}</p>
                    </div>
                    <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <File className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Storage</p>
                      <p className="text-2xl font-bold">{storageStats.total_size_mb} MB</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatFileSize(storageStats.total_size_bytes)}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-teal-100 rounded-lg flex items-center justify-center">
                      <HardDrive className="h-6 w-6 text-teal-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">File Types</p>
                      <p className="text-2xl font-bold">{storageStats.type_breakdown.length}</p>
                    </div>
                    <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Filter className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Users</p>
                      <p className="text-2xl font-bold">{storageStats.user_breakdown.length}</p>
                    </div>
                    <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <User className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Search and Filters */}
          <Card className="border-0 shadow-sm mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by filename, username, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterUser} onValueChange={setFilterUser}>
                  <SelectTrigger className="w-48">
                    <User className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id.toString()}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {fileTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Files Table */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Uploaded Files</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {total} file{total !== 1 ? 's' : ''}
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
              ) : filteredFiles.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No files found</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Filename</TableHead>
                          <TableHead>Owner</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>Uploaded</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredFiles.map((file) => (
                          <TableRow key={file.id}>
                            <TableCell className="font-medium max-w-xs truncate">
                              {file.original_filename}
                            </TableCell>
                            <TableCell>
                              {file.owner ? (
                                <div>
                                  <p className="text-sm font-medium">{file.owner.username}</p>
                                  <p className="text-xs text-muted-foreground">{file.owner.email}</p>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">Unknown</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{file.file_type.toUpperCase()}</Badge>
                            </TableCell>
                            <TableCell>{formatFileSize(file.file_size)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {formatDate(file.uploaded_at)}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteFile(file.id, file.original_filename)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete File
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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

















