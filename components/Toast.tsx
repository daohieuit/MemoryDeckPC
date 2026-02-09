
import React, { useEffect, useState, useCallback } from 'react';
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
    const [isPaused, setIsPaused] = useState(false);
    const [remaining, setRemaining] = useState(duration);
    const undoPressedRef = React.useRef(false);
    const startTimeRef = React.useRef(Date.now());
    const timerRef = React.useRef<NodeJS.Timeout | null>(null);

    const handleDismiss = useCallback(() => {
        setIsExiting(true);
        setTimeout(() => onDismiss(id), 300);
    }, [id, onDismiss]);

    const startTimer = useCallback(() => {
        startTimeRef.current = Date.now();
        timerRef.current = setTimeout(() => {
            if (onTimeout && !undoPressedRef.current) {
                onTimeout();
            }
            handleDismiss();
        }, remaining);
    }, [handleDismiss, onTimeout, remaining]);

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (!isPaused && !isExiting) {
            startTimer();
        }
        return clearTimer;
    }, [isPaused, isExiting, startTimer, clearTimer]);

    const handleMouseEnter = () => {
        setIsPaused(true);
        const elapsed = Date.now() - startTimeRef.current;
        setRemaining(prev => Math.max(0, prev - elapsed));
        clearTimer();
    };

    const handleMouseLeave = () => {
        setIsPaused(false);
    };

    const handleUndoClick = () => {
        undoPressedRef.current = true;
        if (onUndo) {
            onUndo();
        }
        handleDismiss();
    };

    const handleCloseClick = () => {
        if (onTimeout && !undoPressedRef.current) {
            onTimeout();
        }
        handleDismiss();
    };

    const [targetWidth, setTargetWidth] = useState('100%');

    useEffect(() => {
        if (!isPaused && !isExiting) {
            // Small delay to ensure the paint has happened
            const timeout = setTimeout(() => {
                setTargetWidth('0%');
            }, 50);
            return () => clearTimeout(timeout);
        } else {
            // When paused, we stay at the current calculated width
            setTargetWidth(`${(remaining / duration) * 100}%`);
        }
    }, [isPaused, isExiting, remaining, duration]);

    return (
        <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`relative w-full max-w-sm bg-white dark:bg-[#344E41] shadow-2xl rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden border border-[#EDE9DE] dark:border-[#3A5A40] animate-fade-in-fast ${isExiting ? 'animate-fade-out-fast' : ''}`}
        >
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
                        style={{
                            width: targetWidth,
                            transition: isPaused ? 'none' : `width ${remaining}ms linear`,
                        }}
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