import { createContext, useContext, useState, useCallback, useRef } from "react";

const MessageContext = createContext(null);

export function MessageProvider({ children }) {
  const [message, setMessage] = useState(null);
  const timerRef = useRef(null);

  const showMessage = useCallback((text, type = "success") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessage({ text, type });
    timerRef.current = setTimeout(() => {
      setMessage(null);
      timerRef.current = null;
    }, 5000);
  }, []);

  const clearMessage = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessage(null);
  }, []);

  return (
    <MessageContext.Provider value={{ message, showMessage, clearMessage }}>
      {children}
    </MessageContext.Provider>
  );
}

export function useMessage() {
  const ctx = useContext(MessageContext);
  if (!ctx) throw new Error("useMessage must be used within MessageProvider");
  return ctx;
}
