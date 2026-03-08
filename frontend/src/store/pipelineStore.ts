import { create } from 'zustand';

export type CleanOperation = {
  id: string;
  type: "drop_duplicates" | "drop_columns" | "impute";
  columns?: string[];
  strategy?: "mean" | "median" | "mode" | "constant" | "drop";
  fill_value?: any;
};

interface PipelineState {
  operations: CleanOperation[];
  addOperation: (op: Omit<CleanOperation, "id">) => void;
  removeOperation: (id: string) => void;
  clearOperations: () => void;
}

export const usePipelineStore = create<PipelineState>((set) => ({
  operations: [],
  addOperation: (op) => set((state) => ({ 
    operations: [...state.operations, { ...op, id: Math.random().toString(36).substr(2, 9) }] 
  })),
  removeOperation: (id) => set((state) => ({ 
    operations: state.operations.filter(op => op.id !== id) 
  })),
  clearOperations: () => set({ operations: [] })
}));
