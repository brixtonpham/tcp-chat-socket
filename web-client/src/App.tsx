import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Login } from './components/Auth/Login';
import { Register } from './components/Auth/Register';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { ChatWindow } from './components/Chat/ChatWindow';
import { GroupChat } from './components/Groups/GroupChat';
import { useAuth } from './hooks/useAuth';
import { useWebSocket } from './hooks/useWebSocket';
import { useUIStore } from './store/uiStore';
import { useMessagesStore } from './store/messagesStore';
import { useGroupsStore } from './store/groupsStore';

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
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col">
          {/* Chat Type Selector */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
            <div className="flex gap-2">
              <button
                onClick={() => setChatView('friends')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  chatView === 'friends'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Friend Chat
              </button>
              <button
                onClick={() => setChatView('groups')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  chatView === 'groups'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Group Chat
              </button>
            </div>
          </div>

          {/* Chat Area */}
          {chatView === 'friends' ? <ChatWindow /> : <GroupChat />}
        </div>
      </div>

      <Toaster position="top-right" />
    </div>
  );
}

export default App;
