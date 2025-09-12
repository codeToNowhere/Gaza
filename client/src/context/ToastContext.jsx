// ToastContext.jsx
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { v4 as uuidv4 } from "uuid";
import Toast from "../components/Toast";
import "../styles/components/Toast.css";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info", duration = 5000) => {
    const id = uuidv4();
    setToasts((prevToasts) => [...prevToasts, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const contextValue = useMemo(() => ({ showToast }), [showToast]);

  const toastElements = useMemo(
    () =>
      toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={removeToast}
        />
      )),
    [toasts, removeToast]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children} <div className="toast-container">{toastElements}</div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider.");
  }
  return context;
};
