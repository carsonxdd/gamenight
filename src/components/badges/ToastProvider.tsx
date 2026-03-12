"use client";

import { createContext, useCallback, useContext, useState } from "react";
import BadgeToast from "./BadgeToast";

interface BadgeToastData {
  id: string;
  name: string;
  icon: string;
  tier: string;
}

interface ToastContextValue {
  showBadgeToast: (badge: { name: string; icon: string; tier: string }) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showBadgeToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<BadgeToastData[]>([]);

  const showBadgeToast = useCallback((badge: { name: string; icon: string; tier: string }) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, ...badge }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showBadgeToast }}>
      {children}
      {/* Toast Stack — fixed bottom-right */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
        {toasts.map((toast) => (
          <BadgeToast
            key={toast.id}
            name={toast.name}
            icon={toast.icon}
            tier={toast.tier}
            onDismiss={() => dismiss(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
