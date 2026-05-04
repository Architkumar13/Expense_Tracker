import { create } from "zustand";

interface UIState {
  commandOpen: boolean;
  expenseDialogOpen: boolean;
  setCommandOpen: (v: boolean) => void;
  setExpenseDialogOpen: (v: boolean) => void;
  toggleCommand: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  commandOpen: false,
  expenseDialogOpen: false,
  setCommandOpen: (v) => set({ commandOpen: v }),
  setExpenseDialogOpen: (v) => set({ expenseDialogOpen: v }),
  toggleCommand: () => set((s) => ({ commandOpen: !s.commandOpen })),
}));
