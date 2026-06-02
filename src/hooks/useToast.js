import { useCallback, useState } from 'react';

export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((type, message, duration = 2500) => {
    setToast({ type, message });
    window.clearTimeout(showToast._timer);
    showToast._timer = window.setTimeout(() => setToast(null), duration);
  }, []);

  return { toast, showToast, clearToast: () => setToast(null) };
}
