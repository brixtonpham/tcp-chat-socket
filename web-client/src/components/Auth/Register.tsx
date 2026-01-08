import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ServerLogsPanel } from '../Logs/ServerLogsPanel';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface RegisterProps {
  onSwitchToLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onSwitchToLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [showLogs, setShowLogs] = useState(true);
  const { register, connected } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (username && password && email) {
      register(username, password, email);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-blue-500 to-purple-600 dark:from-gray-900 dark:to-gray-800">
      {/* Header - Mobile Only */}
      <div className="lg:hidden bg-gray-900/50 backdrop-blur-sm border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-white">TCP Chat - Network Programming</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`}
              />
              <span className="text-xs text-gray-300">
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="lg:hidden px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-md transition-colors"
            >
              {showLogs ? 'Hide' : 'Show'} Logs
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
        <Card className="w-full max-w-md animate-fade-in">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold mb-2">Create Account</CardTitle>
            <CardDescription>
              Join TCP Chat today
              <span className="block text-xs mt-2">
                Network Programming Demo - Watch server protocol messages →
              </span>
            </CardDescription>

            {/* Connection Status - Desktop */}
            <div className="mt-4 hidden lg:block">
              <div className="flex items-center justify-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                  }`}
                />
                <span className="text-sm">
                  {connected ? 'Connected to Server' : 'Disconnected'}
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Choose a strong password"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={!connected}
                className="w-full"
              >
                Create Account
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Button
                variant="link"
                onClick={onSwitchToLogin}
                className="p-0 h-auto font-medium"
              >
                Sign In
              </Button>
            </p>
          </CardFooter>
        </Card>
      </div>

      {/* Server Logs Panel - Desktop: Side Panel, Mobile: Collapsible Drawer */}
      <div
        className={`
          ${showLogs ? 'block' : 'hidden'}
          lg:block lg:w-[400px] lg:flex-shrink-0
          fixed lg:relative bottom-0 left-0 right-0 lg:bottom-auto lg:left-auto lg:right-auto
          h-[50vh] lg:h-screen
          z-50 lg:z-auto
          transition-transform duration-300
          ${showLogs ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}
        `}
      >
        <ServerLogsPanel />
      </div>
    </div>
  );
};
