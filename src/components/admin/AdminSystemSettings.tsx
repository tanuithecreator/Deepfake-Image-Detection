import { useState } from 'react';
import { AdminNavigation } from './AdminNavigation';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Settings, 
  Shield, 
  Server, 
  Bell, 
  Key,
  CheckCircle,
  AlertCircle,
  Database,
  Zap,
  Globe,
  Lock,
  Upload,
  Download
} from 'lucide-react';
import type { User } from '../../App';

interface AdminSystemSettingsProps {
  navigate: (page: string) => void;
  user: User | null;
  logout: () => void;
}

export function AdminSystemSettings({ navigate, user, logout }: AdminSystemSettingsProps) {
  const [systemSettings, setSystemSettings] = useState({
    allowRegistration: true,
    requireEmailVerification: true,
    enableApiAccess: false,
    maintenanceMode: false,
    autoDeleteFiles: true,
    maxFileSize: 50,
    maxUploadsPerDay: 100,
    confidenceThreshold: 70
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30,
    ipWhitelisting: false,
    bruteForceProtection: true,
    loginAttempts: 5
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailAlerts: true,
    slackIntegration: false,
    webhookUrl: '',
    alertThreshold: 10
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleSaveSettings = () => {
    // Mock save
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleSystemTest = () => {
    // Mock system test
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const exportSettings = () => {
    const settings = {
      system: systemSettings,
      security: securitySettings,
      notifications: notificationSettings,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'system-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminNavigation navigate={navigate} currentPage="admin-settings" user={user} logout={logout} />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">System Settings</h1>
            <p className="text-muted-foreground">
              Configure system-wide settings, security policies, and operational parameters.
            </p>
          </div>

          {/* Success/Error Alerts */}
          {showSuccess && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Settings saved successfully!
              </AlertDescription>
            </Alert>
          )}

          {showError && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                Error saving settings. Please try again.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* System Configuration */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-blue-600" />
                  System Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Allow User Registration</p>
                    <p className="text-sm text-muted-foreground">
                      Enable new users to create accounts
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.allowRegistration}
                    onCheckedChange={(checked) => 
                      setSystemSettings({ ...systemSettings, allowRegistration: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Verification</p>
                    <p className="text-sm text-muted-foreground">
                      Require email verification for new accounts
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.requireEmailVerification}
                    onCheckedChange={(checked) => 
                      setSystemSettings({ ...systemSettings, requireEmailVerification: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Maintenance Mode</p>
                    <p className="text-sm text-muted-foreground">
                      Temporarily disable user access
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.maintenanceMode}
                    onCheckedChange={(checked) => 
                      setSystemSettings({ ...systemSettings, maintenanceMode: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    value={systemSettings.maxFileSize}
                    onChange={(e) => 
                      setSystemSettings({ ...systemSettings, maxFileSize: parseInt(e.target.value) })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxUploads">Max Uploads Per Day (Per User)</Label>
                  <Input
                    id="maxUploads"
                    type="number"
                    value={systemSettings.maxUploadsPerDay}
                    onChange={(e) => 
                      setSystemSettings({ ...systemSettings, maxUploadsPerDay: parseInt(e.target.value) })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confidenceThreshold">Detection Confidence Threshold (%)</Label>
                  <Input
                    id="confidenceThreshold"
                    type="number"
                    min="0"
                    max="100"
                    value={systemSettings.confidenceThreshold}
                    onChange={(e) => 
                      setSystemSettings({ ...systemSettings, confidenceThreshold: parseInt(e.target.value) })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Brute Force Protection</p>
                    <p className="text-sm text-muted-foreground">
                      Automatically block suspicious login attempts
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.bruteForceProtection}
                    onCheckedChange={(checked) => 
                      setSecuritySettings({ ...securitySettings, bruteForceProtection: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">IP Whitelisting</p>
                    <p className="text-sm text-muted-foreground">
                      Restrict access to specific IP addresses
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.ipWhitelisting}
                    onCheckedChange={(checked) => 
                      setSecuritySettings({ ...securitySettings, ipWhitelisting: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Select 
                    value={securitySettings.sessionTimeout.toString()}
                    onValueChange={(value) => 
                      setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="480">8 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loginAttempts">Max Failed Login Attempts</Label>
                  <Input
                    id="loginAttempts"
                    type="number"
                    min="3"
                    max="10"
                    value={securitySettings.loginAttempts}
                    onChange={(e) => 
                      setSecuritySettings({ ...securitySettings, loginAttempts: parseInt(e.target.value) })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* AI Model Information */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  AI Model Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Active Model</Label>
                  <p className="text-sm text-muted-foreground">
                    Combined ResNet18 v1.0.0
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Combined ResNet18 binary classifier trained on multiple datasets with advanced augmentation techniques
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto-delete Processed Files</p>
                    <p className="text-sm text-muted-foreground">
                      Remove files after analysis completion
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.autoDeleteFiles}
                    onCheckedChange={(checked) => 
                      setSystemSettings({ ...systemSettings, autoDeleteFiles: checked })
                    }
                  />
                </div>

                <Button onClick={handleSystemTest} variant="outline" className="w-full">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Test AI Model Performance
                </Button>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-600" />
                  Notifications & Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Alerts</p>
                    <p className="text-sm text-muted-foreground">
                      Send admin notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailAlerts}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({ ...notificationSettings, emailAlerts: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="alertThreshold">Alert Threshold (deepfakes/hour)</Label>
                  <Input
                    id="alertThreshold"
                    type="number"
                    value={notificationSettings.alertThreshold}
                    onChange={(e) => 
                      setNotificationSettings({ ...notificationSettings, alertThreshold: parseInt(e.target.value) })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">Webhook URL (Optional)</Label>
                  <Input
                    id="webhookUrl"
                    type="url"
                    placeholder="https://your-webhook-url.com"
                    value={notificationSettings.webhookUrl}
                    onChange={(e) => 
                      setNotificationSettings({ ...notificationSettings, webhookUrl: e.target.value })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Button onClick={handleSaveSettings} className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Save All Settings
            </Button>
            
            <Button onClick={exportSettings} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Settings
            </Button>

            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import Settings
            </Button>
          </div>

          {/* System Info */}
          <Card className="mt-8 border-0 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Database className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-1">System Information</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-blue-700">
                    <div>Version: DeepDetect v2.1.0</div>
                    <div>Database: PostgreSQL 14.2</div>
                    <div>Server: Ubuntu 22.04 LTS</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}