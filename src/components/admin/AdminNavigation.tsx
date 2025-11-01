import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Settings, 
  Shield, 
  LogOut,
  User,
  Crown
} from 'lucide-react';
import type { User as UserType } from '../../App';

interface AdminNavigationProps {
  navigate: (page: string) => void;
  currentPage: string;
  user: UserType | null;
  logout: () => void;
}

export function AdminNavigation({ navigate, currentPage, user, logout }: AdminNavigationProps) {
  const navItems = [
    { id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'admin-users', label: 'User Management', icon: Users },
    { id: 'admin-analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'admin-settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <div className="w-64 h-screen bg-white border-r flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-xl font-semibold">DeepDetect</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Crown className="h-3 w-3 text-yellow-600" />
              Admin Panel
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full justify-start ${
                  isActive ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : ''
                }`}
                onClick={() => navigate(item.id)}
              >
                <Icon className="h-4 w-4 mr-3" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </nav>

      {/* User Menu */}
      <div className="p-4 border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start p-2 h-auto hover:bg-gray-100">
              <div className="flex items-center gap-3 w-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-yellow-100 text-yellow-700">
                    <Crown className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">Administrator</p>
                </div>
                <div className="text-muted-foreground">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => navigate('admin-settings')}>
              <User className="h-4 w-4 mr-2" />
              Admin Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600 focus:bg-red-50">
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}