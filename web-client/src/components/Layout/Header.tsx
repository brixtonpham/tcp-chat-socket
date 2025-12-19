import React, { useState, useEffect } from 'react';
import { Settings, LogOut, User, Wifi, WifiOff, Sun, Moon, FileText } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useUIStore } from '../../store/uiStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useLogsStore } from '../../store/logsStore';
import { useMessagesStore } from '../../store/messagesStore';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useUIStore();
  const { connected } = useWebSocket();
  const { isVisible, toggleVisibility, logs } = useLogsStore();
  const { conversations } = useMessagesStore();
  const [totalMessages, setTotalMessages] = useState(0);

  useEffect(() => {
    const count = Object.values(conversations).reduce((acc, msgs) => acc + msgs.length, 0);
    setTotalMessages(count);
  }, [conversations]);

  return (
    <TooltipProvider>
      <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4">
          {/* Left Section */}
          <div className="flex items-center gap-3 md:gap-6">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                  TCP Chat
                </h1>
                <p className="hidden md:block text-xs text-gray-500 dark:text-slate-400">
                  Network Programming Demo
                </p>
              </div>
            </div>

            {/* Connection Status with Educational Tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 cursor-help">
                  {connected ? (
                    <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-600 dark:text-red-400" />
                  )}
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                      {connected ? 'Connected' : 'Disconnected'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-slate-400">
                      WebSocket
                    </span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>TCP connection status via WebSocket proxy</p>
              </TooltipContent>
            </Tooltip>

            {/* Network Stats */}
            {connected && (
              <div className="hidden lg:flex items-center gap-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 cursor-help">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      <Badge variant="secondary" className="text-sm font-semibold bg-transparent border-0 p-0 text-blue-700 dark:text-blue-300">
                        {totalMessages}
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total messages sent/received</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 cursor-help">
                      <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <Badge variant="secondary" className="text-sm font-semibold bg-transparent border-0 p-0 text-purple-700 dark:text-purple-300">
                        {logs.length}
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Protocol messages logged</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* User Profile with Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="hidden md:flex items-center gap-2 h-auto px-3 py-1.5">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-cyan-500 text-white font-bold text-sm">
                      {user?.username?.charAt(0).toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.username || 'Unknown'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600 dark:text-red-400">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Server Logs Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleVisibility}
                  className="button-press"
                >
                  <FileText className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isVisible ? 'Hide protocol logs' : 'Show protocol logs'}</p>
              </TooltipContent>
            </Tooltip>

            {/* Theme Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="button-press"
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? (
                    <Sun className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <Moon className="h-5 w-5 text-gray-700" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}</p>
              </TooltipContent>
            </Tooltip>

            {/* Logout Button */}
            <Button
              onClick={logout}
              className="button-press bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md hover:shadow-lg"
            >
              <span className="hidden md:inline">Logout</span>
              <LogOut className="h-5 w-5 md:hidden" />
            </Button>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
};
