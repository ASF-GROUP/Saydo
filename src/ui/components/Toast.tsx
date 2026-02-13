import { useEffect } from "react";

interface ToastProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
  duration?: number;
}

export function Toast({ message, actionLabel, onAction, onDismiss, duration = 5000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [onDismiss, duration]);

  return (
    <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 bg-gray-800 dark:bg-gray-700 text-white rounded-lg shadow-lg text-sm">
      <span>{message}</span>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="font-medium text-blue-300 hover:text-blue-200 underline"
        >
          {actionLabel}
        </button>
      )}
      <button onClick={onDismiss} className="ml-1 text-gray-400 hover:text-gray-200">
        ×
      </button>
    </div>
  );
}
