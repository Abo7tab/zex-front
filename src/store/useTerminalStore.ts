import { create } from 'zustand';

interface TerminalState {
  logs: string[];
  addLog: (log: string) => void;
}

export const useTerminalStore = create<TerminalState>((set) => ({
  logs: [],
  addLog: (log) =>
    set((state) => {
      const newLogs = [log, ...state.logs];
      if (newLogs.length > 200) newLogs.pop();
      return { logs: newLogs };
    }),
}));
