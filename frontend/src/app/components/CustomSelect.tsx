"use client";
import React, { useState, useEffect, useRef } from "react";

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: Option[];
  isDark: boolean;
  placeholder?: string;
  className?: string;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  isDark,
  placeholder = "Select an option",
  className = "",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value);
  const hasGroups = options.some((o) => o.group);

  // Group options if needed
  const groups: Record<string, Option[]> = {};
  if (hasGroups) {
    options.forEach((o) => {
      const g = o.group || "Other";
      if (!groups[g]) groups[g] = [];
      groups[g].push(o);
    });
  }

  const handleSelect = (val: string, disabled?: boolean) => {
    if (disabled) return;
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 cursor-pointer ${
          isDark
            ? "bg-zinc-950 border-zinc-800 text-zinc-100 focus:ring-indigo-500/20 focus:border-indigo-500 hover:border-zinc-700"
            : "bg-white border-zinc-200 text-zinc-800 focus:ring-indigo-500/20 focus:border-indigo-500 hover:border-zinc-300 shadow-sm"
        }`}
      >
        <span className={selectedOption ? "font-medium" : "text-zinc-500"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-zinc-500 transition-transform duration-200 shrink-0 ml-2 ${
            isOpen ? "rotate-180 text-indigo-500" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Options Panel */}
      {isOpen && (
        <div
          className={`absolute z-50 left-0 right-0 mt-1.5 rounded-lg border shadow-xl overflow-y-auto max-h-60 transition-all duration-100 ${
            isDark
              ? "bg-zinc-900 border-zinc-800 text-zinc-200 shadow-black/60"
              : "bg-white border-zinc-200 text-zinc-800 shadow-zinc-200/50"
          }`}
        >
          {hasGroups ? (
            Object.entries(groups).map(([groupName, groupOptions]) => (
              <div key={groupName} className="p-1 border-b last:border-b-0 border-zinc-800/40">
                <div
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                    isDark ? "text-zinc-500" : "text-zinc-400"
                  }`}
                >
                  {groupName}
                </div>
                {groupOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={opt.disabled}
                      onClick={() => handleSelect(opt.value, opt.disabled)}
                      className={`w-full text-left px-3 py-2 rounded text-sm transition-colors flex items-center justify-between cursor-pointer my-0.5 ${
                        opt.disabled
                          ? isDark
                            ? "text-zinc-600 cursor-not-allowed opacity-40 bg-zinc-950/20"
                            : "text-zinc-300 cursor-not-allowed opacity-40 bg-zinc-50/50"
                          : isSelected
                          ? isDark
                            ? "bg-indigo-600 text-white font-medium shadow-sm"
                            : "bg-indigo-600 text-white font-medium shadow-sm"
                          : isDark
                          ? "hover:bg-zinc-800 text-zinc-200"
                          : "hover:bg-zinc-100 text-zinc-700"
                      }`}
                    >
                      <span className="truncate pr-2">{opt.label}</span>
                      {isSelected && (
                        <svg
                          className="w-3.5 h-3.5 text-current shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          ) : (
            <div className="p-1">
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => handleSelect(opt.value, opt.disabled)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors flex items-center justify-between cursor-pointer my-0.5 ${
                      opt.disabled
                        ? isDark
                          ? "text-zinc-600 cursor-not-allowed opacity-40 bg-zinc-950/20"
                          : "text-zinc-300 cursor-not-allowed opacity-40 bg-zinc-50/50"
                        : isSelected
                        ? isDark
                          ? "bg-indigo-600 text-white font-medium shadow-sm"
                          : "bg-indigo-600 text-white font-medium shadow-sm"
                        : isDark
                        ? "hover:bg-zinc-800 text-zinc-200"
                        : "hover:bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    <span className="truncate pr-2">{opt.label}</span>
                    {isSelected && (
                      <svg
                        className="w-3.5 h-3.5 text-current shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
