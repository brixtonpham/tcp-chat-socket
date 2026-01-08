import { create } from 'zustand';
import type { MessageType } from '../types';

export type LogCategory =
  | 'authentication'
  | 'friends'
  | 'messaging'
  | 'groups'
  | 'status'
  | 'errors'
  | 'system';

export interface ServerLog {
  id: string;
  timestamp: number;
  type: MessageType;
  category: LogCategory;
  direction: 'request' | 'response';
  payload: any;
  latency?: number;
  source?: string;
  destination?: string;
}

export interface LogFilters {
  authentication: boolean;
  friends: boolean;
  messaging: boolean;
  groups: boolean;
  status: boolean;
  errors: boolean;
  system: boolean;
  searchQuery: string;
}

interface LogsState {
  logs: ServerLog[];
  filters: LogFilters;
  isPaused: boolean;
  isVisible: boolean;
  maxLogs: number;

  addLog: (log: Omit<ServerLog, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  toggleFilter: (category: keyof LogFilters) => void;
  setSearchQuery: (query: string) => void;
  togglePause: () => void;
  toggleVisibility: () => void;
  setVisible: (visible: boolean) => void;
  exportLogs: (format: 'json' | 'txt') => void;
  getFilteredLogs: () => ServerLog[];
}

// Determine log category based on message type
const getCategoryFromType = (type: MessageType): LogCategory => {
  if (type.includes('REGISTER') || type.includes('LOGIN') || type.includes('LOGOUT')) {
    return 'authentication';
  }
  if (type.includes('FRIEND')) {
    return 'friends';
  }
  if (type.includes('CHAT') && !type.includes('GROUP')) {
    return 'messaging';
  }
  if (type.includes('GROUP')) {
    return 'groups';
  }
  if (type.includes('STATUS') || type.includes('ONLINE')) {
    return 'status';
  }
  if (type.includes('ERROR')) {
    return 'errors';
  }
  return 'system';
};

export const useLogsStore = create<LogsState>((set, get) => ({
  logs: [],
  filters: {
    authentication: true,
    friends: true,
    messaging: true,
    groups: true,
    status: true,
    errors: true,
    system: true,
    searchQuery: '',
  },
  isPaused: false,
  isVisible: true,
  maxLogs: 500,

  addLog: (logData) => {
    const state = get();

    // Don't add logs if paused
    if (state.isPaused) return;

    const log: ServerLog = {
      ...logData,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      category: logData.category || getCategoryFromType(logData.type),
    };

    set((state) => {
      const newLogs = [...state.logs, log];

      // Keep only the last maxLogs entries
      if (newLogs.length > state.maxLogs) {
        return { logs: newLogs.slice(-state.maxLogs) };
      }

      return { logs: newLogs };
    });
  },

  clearLogs: () => set({ logs: [] }),

  toggleFilter: (category) => {
    if (category === 'searchQuery') return;

    set((state) => ({
      filters: {
        ...state.filters,
        [category]: !state.filters[category],
      },
    }));
  },

  setSearchQuery: (query) =>
    set((state) => ({
      filters: {
        ...state.filters,
        searchQuery: query,
      },
    })),

  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),

  toggleVisibility: () => set((state) => ({ isVisible: !state.isVisible })),

  setVisible: (visible) => set({ isVisible: visible }),

  exportLogs: (format) => {
    const state = get();
    const filteredLogs = state.getFilteredLogs();

    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'json') {
      content = JSON.stringify(filteredLogs, null, 2);
      filename = `tcp-chat-logs-${new Date().toISOString()}.json`;
      mimeType = 'application/json';
    } else {
      content = filteredLogs
        .map((log) => {
          const time = new Date(log.timestamp).toISOString();
          const direction = log.direction === 'request' ? '←' : '→';
          const latency = log.latency ? ` (${log.latency}ms)` : '';
          return `[${time}] ${direction} ${log.type}${latency}\n${JSON.stringify(log.payload, null, 2)}\n`;
        })
        .join('\n---\n\n');
      filename = `tcp-chat-logs-${new Date().toISOString()}.txt`;
      mimeType = 'text/plain';
    }

    // Create download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  getFilteredLogs: () => {
    const state = get();
    return state.logs.filter((log) => {
      // Filter by category
      if (!state.filters[log.category]) {
        return false;
      }

      // Filter by search query
      if (state.filters.searchQuery) {
        const query = state.filters.searchQuery.toLowerCase();
        const searchableText = `
          ${log.type}
          ${log.direction}
          ${JSON.stringify(log.payload)}
          ${log.source || ''}
          ${log.destination || ''}
        `.toLowerCase();

        if (!searchableText.includes(query)) {
          return false;
        }
      }

      return true;
    });
  },
}));
