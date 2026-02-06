
import React, { useEffect, useState } from 'react';
import { useToast } from '../hooks/useToast';

interface ToastProps {
    id: number;
    message: string;
    duration?: number;
    onDismiss: (id: number) => void;
    onUndo?: () => void;
    onTimeout?: () => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, duration = 5000, onDismiss, onUndo, onTimeout }) => {
    const [isExiting, setIsExiting] = useState(false);

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(() => onDismiss(id), 300);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (onTimeout) {
                onTimeout();
            }
            handleDismiss();
        }, duration);

        return () => {
            clearTimeout(timer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [duration, id, onDismiss, onTimeout]);

    const handleUndoClick = () => {
        if (onUndo) {
            onUndo();
        }
        handleDismiss();
    };

    const handleCloseClick = () => {
        if (onTimeout) { // Closing manually should also trigger the permanent action
            onTimeout();
        }
        handleDismiss();
    };

    return (
        <div className={`relative w-full max-w-sm bg-white dark:bg-[#344E41] shadow-2xl rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden border border-[#EDE9DE] dark:border-[#3A5A40] animate-fade-in-fast ${isExiting ? 'animate-fade-out-fast' : ''}`}>
            <div className="p-4">
                <div className="flex items-start">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-[#121e18] dark:text-white">{message}</p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex items-center">
                        {onUndo && (
                            <button onClick={handleUndoClick} className="mr-4 text-sm font-semibold text-[#56A652] hover:underline focus:outline-none">
                                Undo
                            </button>
                        )}
                        <button onClick={handleCloseClick} className="text-[#AFBD96] hover:text-[#121e18] dark:hover:text-white focus:outline-none">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            </div>
            {onUndo && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-[#56A652]/20 dark:bg-[#AFBD96]/20">
                    <div
                        className="h-full bg-[#56A652] dark:bg-[#AFBD96]"
                        style={{ animation: `progress-bar ${duration}ms linear forwards` }}
                    />
                </div>
            )}
        </div>
    );
};


export const ToastContainer: React.FC = () => {
    const { toasts, dismissToast } = useToast();

    return (
        <div aria-live="assertive" className="fixed inset-0 flex items-end justify-end px-4 py-6 pointer-events-none sm:p-6 z-50">
            <div className="w-full max-w-sm space-y-4">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        id={toast.id}
                        message={toast.message}
                        duration={toast.duration}
                        onDismiss={dismissToast}
                        onUndo={toast.onUndo}
                        onTimeout={toast.onTimeout}
                    />
                ))}
            </div>
        </div>
    );
};