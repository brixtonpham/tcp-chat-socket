import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme } from '../types';

interface UIState {
  theme: Theme;
  sidebarOpen: boolean;
  infoPanelOpen: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  toggleInfoPanel: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'dark',
      sidebarOpen: true,
      infoPanelOpen: true,

      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        })),

      setTheme: (theme) =>
        set({
          theme,
        }),

      toggleSidebar: () =>
        set((state) => ({
          sidebarOpen: !state.sidebarOpen,
        })),

      toggleInfoPanel: () =>
        set((state) => ({
          infoPanelOpen: !state.infoPanelOpen,
        })),
    }),
    {
      name: 'ui-storage',
    }
  )
);
