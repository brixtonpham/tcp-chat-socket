import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Login } from './components/Auth/Login';
import { Register } from './components/Auth/Register';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { ChatWindow } from './components/Chat/ChatWindow';
import { GroupChat } from './components/Groups/GroupChat';
import { ServerLogsPanel } from './components/Logs/ServerLogsPanel';
import { useAuth } from './hooks/useAuth';
import { useWebSocket } from './hooks/useWebSocket';
import { useUIStore } from './store/uiStore';
import { useMessagesStore } from './store/messagesStore';
import { useGroupsStore } from './store/groupsStore';
import { useLogsStore } from './store/logsStore';
import { setLogsStore } from './api/websocket';

type AuthView = 'login' | 'register';
type ChatView = 'friends' | 'groups';

function App() {
  const [authView, setAuthView] = useState<AuthView>('login');
  const [chatView, setChatView] = useState<ChatView>('friends');
  const { isAuthenticated } = useAuth();
  const { connect } = useWebSocket();
  const { theme } = useUIStore();
  const { activeConversation } = useMessagesStore();
  const { activeGroup } = useGroupsStore();
  const logsStore = useLogsStore();

  // Initialize logs store reference for WebSocket client (once on mount)
  useEffect(() => {
    setLogsStore(logsStore);
  }, []); // Empty dependency - only run once on mount

  // Apply theme class to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Connect to WebSocket on mount
  useEffect(() => {
    connect();
  }, [connect]);

  // Auto-switch chat view based on active conversation/group
  useEffect(() => {
    if (activeConversation) {
      setChatView('friends');
    } else if (activeGroup) {
      setChatView('groups');
    }
  }, [activeConversation, activeGroup]);

  if (!isAuthenticated) {
    return (
      <>
        {authView === 'login' ? (
          <Login onSwitchToRegister={() => setAuthView('register')} />
        ) : (
          <Register onSwitchToLogin={() => setAuthView('login')} />
        )}
        <Toaster position="top-right" />
      </>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-slate-900">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col">
          {/* Chat Type Selector */}
          <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-3 shadow-sm">
            <div className="flex gap-2">
              <button
                onClick={() => setChatView('friends')}
                className={`button-press px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm ${
                  chatView === 'friends'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Friend Chat</span>
                </div>
              </button>
              <button
                onClick={() => setChatView('groups')}
                className={`button-press px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm ${
                  chatView === 'groups'
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Group Chat</span>
                </div>
              </button>
            </div>
          </div>

          {/* Chat Area */}
          {chatView === 'friends' ? <ChatWindow /> : <GroupChat />}
        </div>

        {/* Server Logs Panel */}
        <ServerLogsPanel />
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
            borderRadius: '0.75rem',
            boxShadow: 'var(--shadow-lg)',
          },
          success: {
            iconTheme: {
              primary: 'var(--color-success)',
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--color-error)',
              secondary: 'white',
            },
          },
        }}
      />
    </div>
  );
}

export default App;
