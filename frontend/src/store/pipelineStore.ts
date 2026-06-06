import { create } from 'zustand';

export type CleanOperation = {
  id: string;
  type: "drop_duplicates" | "drop_columns" | "impute" | "encode" | "scale";
  columns?: string[];
  strategy?: "mean" | "median" | "mode" | "constant" | "drop" | "label" | "onehot" | "standard" | "minmax";
  fill_value?: any;
};

interface PipelineState {
  operations: CleanOperation[];
  hasSeenSuggestions: boolean;
  currentFileId: string | null;
  uploadedFileIds: string[];
  addOperation: (op: Omit<CleanOperation, "id">) => void;
  removeOperation: (id: string) => void;
  clearOperations: () => void;
  markSuggestionsSeen: () => void;
  resetSuggestions: () => void;
  setCurrentFileId: (id: string | null) => void;
  addUploadedFileId: (id: string) => void;
  clearUploadedFileIds: () => void;
}

export const usePipelineStore = create<PipelineState>((set) => ({
  operations: [],
  hasSeenSuggestions: false,
  currentFileId: null,
  uploadedFileIds: [],
  addOperation: (op) => set((state) => ({ 
    operations: [...state.operations, { ...op, id: Math.random().toString(36).substr(2, 9) }] 
  })),
  removeOperation: (id) => set((state) => ({ 
    operations: state.operations.filter(op => op.id !== id) 
  })),
  clearOperations: () => set({ operations: [] }),
  markSuggestionsSeen: () => set({ hasSeenSuggestions: true }),
  resetSuggestions: () => set({ hasSeenSuggestions: false }),
  setCurrentFileId: (id) => set({ currentFileId: id }),
  addUploadedFileId: (id) => set((state) => ({
    uploadedFileIds: [...state.uploadedFileIds, id]
  })),
  clearUploadedFileIds: () => set({ uploadedFileIds: [] }),
}));
