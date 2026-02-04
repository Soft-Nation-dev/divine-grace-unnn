// src/components/Toast.jsx
import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export default function Toast({ children }) {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((type, message, timeout = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), timeout);
  }, []);

  const api = {
    toasts,
    add,
    success: (msg, t) => add("success", msg, t),
    error: (msg, t) => add("error", msg, t),
    info: (msg, t) => add("info", msg, t),
    warning: (msg, t) => add("warning", msg, t),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* optional minimal UI: */}
      <div aria-live="polite" style={{ position: "fixed", right: 12, bottom: 12, zIndex: 9999 }}>
        {toasts.map((t) => (
          <div key={t.id} style={{ marginTop: 8, padding: 8, background: "#222", color: "#fff", borderRadius: 6 }}>
            <strong style={{ textTransform: "uppercase", fontSize: 11 }}>{t.type}</strong>
            <div style={{ fontSize: 13 }}>{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
