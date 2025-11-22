import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardHeader, CardContent, CardFooter } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Shield, ArrowLeft } from 'lucide-react';

interface AuthPageProps {
  navigate: (page: string) => void;
  login: (email: string, password: string) => void;
  signup: (name: string, email: string, password: string) => void;
  errorMessage?: string | null;
  clearError?: () => void;
}

export function AuthPage({ navigate, login, signup, errorMessage, clearError }: AuthPageProps) {
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '' });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    clearError?.();
    login(loginForm.email, loginForm.password);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    clearError?.();
    signup(signupForm.name, signupForm.email, signupForm.password);
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

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-semibold">DeepDetect</h1>
            </div>
            <p className="text-muted-foreground">Sign in to detect deepfakes</p>
            {errorMessage ? (
              <p className="mt-4 text-sm text-red-600">
                {errorMessage}
              </p>
            ) : null}
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700">
                    Sign In
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Enter your full name"
                      value={signupForm.name}
                      onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700">
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}