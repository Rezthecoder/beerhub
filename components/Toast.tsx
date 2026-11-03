import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  show: boolean;
  onClose: () => void;
  duration?: number;
}

const BACKGROUND: Record<ToastProps['type'], string> = {
  success: 'bg-mint',
  error: 'bg-coral-soft',
  warning: 'bg-peach',
  info: 'bg-sky',
};

export default function Toast({ message, type, show, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [show, duration, onClose]);

  if (!show) return null;

  return (
    <div className={`toast brut-sm ${BACKGROUND[type]}`} role={type === 'error' ? 'alert' : 'status'}>
      <span>{message}</span>
      <button type="button" onClick={onClose} aria-label="Close">
        ×
      </button>
    </div>
  );
}
