import { create } from 'zustand';

interface TerminalState {
  logs: string[];
  addLog: (log: string) => void;
  clearLogs: () => void;
}

export const useTerminalStore = create<TerminalState>((set) => ({
  logs: typeof window === 'undefined'
    ? []
    : (() => {
        try {
          const saved = JSON.parse(localStorage.getItem('zex_terminal_logs') || '[]');
          return Array.isArray(saved) ? saved.slice(0, 200) : [];
        } catch {
          return [];
        }
      })(),
  addLog: (log) =>
    set((state) => {
      if (state.logs[0] === log) {
        return state;
      }

      const newLogs = [log, ...state.logs];
      if (newLogs.length > 200) newLogs.pop();
      if (typeof window !== 'undefined') {
        localStorage.setItem('zex_terminal_logs', JSON.stringify(newLogs));
      }
      return { logs: newLogs };
    }),
  clearLogs: () =>
    set(() => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('zex_terminal_logs');
      }

      return { logs: [] };
    }),
}));
