import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useWebSocket } from './useWebSocket';
import { MessageTypes } from '../types';
import type { LoginPayload, RegisterPayload, LoginAckPayload, RegisterAckPayload } from '../types';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const { user, isAuthenticated, login, logout: logoutStore } = useAuthStore();
  const { send, onMessage, connected } = useWebSocket();

  useEffect(() => {
    const unsubscribe = onMessage((message) => {
      switch (message.type) {
        case MessageTypes.MSG_LOGIN_ACK: {
          const data = message.data as LoginAckPayload;
          if (data.success && data.userId && data.username && data.token) {
            login({
              userId: data.userId,
              username: data.username,
              token: data.token,
              status: 'online',
            });
            toast.success('Login successful!');
          } else {
            toast.error(data.message || 'Login failed');
          }
          break;
        }

        case MessageTypes.MSG_REGISTER_ACK: {
          const data = message.data as RegisterAckPayload;
          if (data.success) {
            toast.success('Registration successful! Please login.');
          } else {
            toast.error(data.message || 'Registration failed');
          }
          break;
        }

        case MessageTypes.MSG_LOGOUT_ACK: {
          logoutStore();
          toast.success('Logged out successfully');
          break;
        }

        case MessageTypes.MSG_ERROR: {
          toast.error(message.data.message || 'An error occurred');
          break;
        }
      }
    });

    return unsubscribe;
  }, [login, logoutStore]); // Removed onMessage - it's now memoized and stable

  const handleLogin = (username: string, password: string) => {
    if (!connected) {
      toast.error('Not connected to server');
      return;
    }

    const payload: LoginPayload = { username, password };
    send(MessageTypes.MSG_LOGIN, payload);
  };

  const handleRegister = (username: string, password: string, email: string) => {
    if (!connected) {
      toast.error('Not connected to server');
      return;
    }

    const payload: RegisterPayload = { username, password, email };
    send(MessageTypes.MSG_REGISTER, payload);
  };

  const handleLogout = () => {
    if (!connected) {
      logoutStore();
      return;
    }

    send(MessageTypes.MSG_LOGOUT, {});
  };

  return {
    user,
    isAuthenticated,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    connected,
  };
};
