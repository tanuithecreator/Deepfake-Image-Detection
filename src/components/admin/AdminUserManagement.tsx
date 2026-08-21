import { useState } from 'react';
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
  UserCheck, 
  UserX,
  Shield,
  AlertTriangle,
  CheckCircle,
  Calendar,
  MoreHorizontal,
  Eye,
  Ban,
  UserPlus
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import type { User } from '../../App';
import { formatDateShort } from '../../utils/dateUtils';

interface AdminUserManagementProps {
  navigate: (page: string) => void;
  user: User | null;
  logout: () => void;
  users: User[];
  setUsers: (users: User[]) => void;
}

export function AdminUserManagement({ navigate, user, logout, users, setUsers }: AdminUserManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('joinDate');
  const [showAlert, setShowAlert] = useState<string | null>(null);

  const regularUsers = users.filter(u => u.role === 'user');

  const filteredUsers = regularUsers
    .filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchQuery.toLowerCase());
      // Ensure status comparison handles null/undefined and is case-insensitive
      const userStatus = (user.status || 'active').toLowerCase();
      const matchesFilter = filterStatus === 'all' || userStatus === filterStatus.toLowerCase();
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'joinDate':
          return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'totalScans':
          return b.totalScans - a.totalScans;
        case 'lastActive':
          return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
        default:
          return 0;
      }
    });

  const toggleUserStatus = async (userId: string) => {
    try {
      const { api } = await import('../../services/api');
      const result = await api.toggleUserStatus(userId);
      const updatedUsers = users.map(u => {
        if (u.id === userId) {
          return { ...u, status: result.status as 'active' | 'suspended' };
        }
        return u;
      });
      setUsers(updatedUsers);
      setShowAlert(`User ${result.status === 'active' ? 'activated' : 'suspended'} successfully`);
      setTimeout(() => setShowAlert(null), 3000);
    } catch (error) {
      setShowAlert(`Failed to update user status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setShowAlert(null), 3000);
    }
  };

  const deleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        const { api } = await import('../../services/api');
        await api.deleteUser(userId);
        const updatedUsers = users.filter(u => u.id !== userId);
        setUsers(updatedUsers);
        setShowAlert('User deleted successfully');
        setTimeout(() => setShowAlert(null), 3000);
      } catch (error) {
        setShowAlert(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setTimeout(() => setShowAlert(null), 3000);
      }
    }
  };

  const getStatusBadge = (status: 'active' | 'suspended') => {
    return status === 'active' ? (
      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
        <UserCheck className="h-3 w-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100">
        <UserX className="h-3 w-3 mr-1" />
        Suspended
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return formatDateShort(dateString);
  };

  const exportUsers = () => {
    const csvContent = [
      ['Name', 'Email', 'Status', 'Join Date', 'Last Active', 'Total Scans'].join(','),
      ...filteredUsers.map(user => [
        user.name,
        user.email,
        user.status,
        user.joinDate,
        user.lastActive,
        user.totalScans.toString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeUsersCount = regularUsers.filter(u => u.status === 'active').length;
  const suspendedUsersCount = regularUsers.filter(u => u.status === 'suspended').length;
  const totalScansCount = regularUsers.reduce((sum, u) => sum + u.totalScans, 0);
  const avgScansPerUser = regularUsers.length > 0 ? Math.round(totalScansCount / regularUsers.length) : 0;

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminNavigation navigate={navigate} currentPage="admin-users" user={user} logout={logout} />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">User Management</h1>
            <p className="text-muted-foreground">
              Manage user accounts, monitor activity, and control access permissions.
            </p>
          </div>

          {/* Alert */}
          {showAlert && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                {showAlert}
              </AlertDescription>
            </Alert>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">{regularUsers.length}</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <UserPlus className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Users</p>
                    <p className="text-2xl font-bold text-green-600">{activeUsersCount}</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <UserCheck className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Suspended</p>
                    <p className="text-2xl font-bold text-red-600">{suspendedUsersCount}</p>
                  </div>
                  <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <UserX className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Scans/User</p>
                    <p className="text-2xl font-bold">{avgScansPerUser}</p>
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
              <CardTitle>Search and Filter Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="suspended">Suspended Only</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="joinDate">Join Date (Newest)</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="totalScans">Total Scans</SelectItem>
                    <SelectItem value="lastActive">Last Active</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={exportUsers} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-0">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No users found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery || filterStatus !== 'all' 
                      ? 'Try adjusting your search or filters.'
                      : 'No users have signed up yet.'
                    }
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Join Date</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead>Total Scans</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((userData) => (
                      <TableRow key={userData.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-700">
                                {userData.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{userData.name}</p>
                              <p className="text-sm text-muted-foreground">{userData.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(userData.status)}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{formatDate(userData.joinDate)}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{formatDate(userData.lastActive)}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{userData.totalScans}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleUserStatus(userData.id)}>
                                {userData.status === 'active' ? (
                                  <>
                                    <Ban className="h-4 w-4 mr-2" />
                                    Suspend User
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Activate User
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => deleteUser(userData.id)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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