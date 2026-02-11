
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useToast } from '../hooks/useToast';
import { useLanguage } from '../hooks/useLanguage';

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
    const { t } = useLanguage();
    const [remaining, setRemaining] = useState(duration);
    const undoPressedRef = React.useRef(false);
    const startTimeRef = React.useRef(Date.now());
    // FIX: Namespace 'global.NodeJS' has no exported member 'Timeout'. Using ReturnType<typeof setTimeout> for portability.
    const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

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
            setRemaining(0); // Ensure remaining is 0 before dismissal
            handleDismiss();
        }, remaining);
    }, [handleDismiss, onTimeout, remaining, setRemaining]);

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

    const barRef = useRef<HTMLDivElement>(null); // Reference to the actual bar element

    useEffect(() => {
        if (!barRef.current) return;

        if (!isPaused && !isExiting) {
            // When animating:
            // 1. Set transition to none temporarily to allow width change without immediate animation
            barRef.current.style.transition = 'none';
            // 2. Set the starting width based on the current remaining time
            barRef.current.style.width = `${(remaining / duration) * 100}%`;
            // 3. Force reflow to apply the width change before starting the transition
            //    (Accessing offsetHeight triggers a synchronous layout calculation)
            barRef.current.offsetHeight;

            // 4. Set the transition property to animate over the current 'remaining' time.
            barRef.current.style.transition = `width ${remaining}ms linear`;
            // 5. Then, immediately set the target width to 0% to trigger the animation.
            barRef.current.style.width = '0%';
        } else {
            // When paused or exiting:
            // Stop animation and set width to current percentage
            barRef.current.style.transition = 'none';
            barRef.current.style.width = `${(remaining / duration) * 100}%`;
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
                                {t("Undo")}
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
                        ref={barRef} // Assign ref here
                        className="h-full bg-[#56A652] dark:bg-[#AFBD96]"
                    // No inline style for width/transition here, managed by useEffect directly
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
