
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ToastAction {
    label: string;
    onClick: () => void;
}

interface ToastOptions {
    message: string;
    duration?: number;
    onUndo?: () => void;
    onTimeout?: () => void;
}

interface Toast extends ToastOptions {
    id: number;
}

interface ToastContextType {
    toasts: Toast[];
    showToast: (options: ToastOptions) => void;
    dismissToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastId = 0;

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((options: ToastOptions) => {
        const newToast: Toast = { ...options, id: toastId++ };
        setToasts(currentToasts => [newToast, ...currentToasts]);
    }, []);

    const dismissToast = useCallback((id: number) => {
        setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
    }, []);

    const value = { toasts, showToast, dismissToast };

    return (
        <ToastContext.Provider value={value}>
            {children}
        </ToastContext.Provider>
    );
};

export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
