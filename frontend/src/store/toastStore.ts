import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'loading';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number; // ms; 0 = persistent
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    return id;
  },
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Call inside a component or handler — returns helpers bound to the store */
export function createToastHelpers() {
  const show = (type: ToastType, message: string, duration = 4500) => {
    const id = useToastStore.getState().addToast({ type, message, duration });
    if (duration > 0) setTimeout(() => useToastStore.getState().removeToast(id), duration);
    return id;
  };
  return {
    success: (msg: string, duration?: number) => show('success', msg, duration),
    error:   (msg: string, duration?: number) => show('error',   msg, duration ?? 6000),
    info:    (msg: string, duration?: number) => show('info',    msg, duration),
    loading: (msg: string) => show('loading', msg, 0),
    dismiss: (id: string)  => useToastStore.getState().removeToast(id),
  };
}
