"use client";
import React, { useEffect, useRef } from "react";
import { useToastStore, Toast } from "../../store/toastStore";

/* ─── Icons ─────────────────────────────────────────────────── */
const CheckIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);
const WarnIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
  </svg>
);
const InfoIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const SpinIcon = () => (
  <svg className="w-5 h-5 shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);
const XIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

/* ─── Variant config ─────────────────────────────────────────── */
const V = {
  success: { bg: "bg-emerald-500", Icon: CheckIcon,  close: "text-emerald-200 hover:text-white" },
  error:   { bg: "bg-red-500",     Icon: WarnIcon,   close: "text-red-200   hover:text-white" },
  info:    { bg: "bg-indigo-500",  Icon: InfoIcon,   close: "text-indigo-200 hover:text-white" },
  loading: { bg: "bg-slate-700",   Icon: SpinIcon,   close: "text-slate-300  hover:text-white" },
} as const;

/* ─── Single toast ───────────────────────────────────────────── */
function ToastItem({ toast }: { toast: Toast }) {
  const remove = useToastStore((s) => s.removeToast);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.animate(
      [{ opacity: 0, transform: "translateX(110%)" }, { opacity: 1, transform: "translateX(0)" }],
      { duration: 260, easing: "cubic-bezier(0.22,1,0.36,1)", fill: "forwards" }
    );
  }, []);

  const v = V[toast.type];

  return (
    <div
      ref={ref}
      role="alert"
      className={`flex items-start gap-3 min-w-[280px] max-w-sm w-full ${v.bg} text-white rounded-xl shadow-2xl px-4 py-3 pointer-events-auto`}
    >
      <span className="mt-0.5 opacity-90"><v.Icon /></span>
      <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
      <button onClick={() => remove(toast.id)} className={`mt-0.5 shrink-0 transition-colors ${v.close}`} aria-label="Dismiss">
        <XIcon />
      </button>
    </div>
  );
}

/* ─── Container (fixed bottom-right) ────────────────────────── */
export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div aria-live="polite" className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => <ToastItem key={t.id} toast={t} />)}
    </div>
  );
}
