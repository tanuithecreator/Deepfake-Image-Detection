import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Shield, ArrowLeft, Crown, AlertCircle } from 'lucide-react';

interface AdminAuthPageProps {
  navigate: (page: string) => void;
  login: (email: string, password: string) => void;
  signup: (name: string, email: string, password: string) => void;
}

export function AdminAuthPage({ navigate, login }: AdminAuthPageProps) {
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [showError, setShowError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(loginForm.email, loginForm.password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate('landing')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <Card className="shadow-lg border-2 border-yellow-200">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <Crown className="h-6 w-6 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-semibold">Admin Portal</h1>
            <p className="text-muted-foreground">System Administrator Access</p>
          </CardHeader>

          <CardContent>
            {showError && (
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  Invalid admin credentials. Please check your email and password.
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Admin Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@deepdetect.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="Enter admin password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700">
                <Crown className="h-4 w-4 mr-2" />
                Admin Sign In
              </Button>
            </form>
          </CardContent>

        </Card>
      </div>
    </div>
  );
}