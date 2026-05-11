
import React, { useEffect, useState, useRef } from 'react';
import { useModal, ModalOptions } from '../hooks/useModal';
import { useLanguage } from '../hooks/useLanguage';

const Modal: React.FC<ModalOptions & { onDismiss: () => void }> = ({
    title,
    message,
    confirmText,
    onConfirm,
    confirmVariant = 'primary',
    onDismiss,
    headerButtons,
    cancelText,
    onCancel,
    size = 'md',
    hideCloseButton = false,
    hideFooter = false
}) => {
    const [isExiting, setIsExiting] = useState(false);
    const { t } = useLanguage();
    const modalContentRef = useRef<HTMLDivElement>(null);

    const dismissModal = () => {
        setIsExiting(true);
        setTimeout(onDismiss, 200);
    };

    const handleCancel = () => {
        onCancel?.();
        dismissModal();
    };

    const handleConfirm = () => {
        onConfirm?.();
        dismissModal();
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalContentRef.current && !modalContentRef.current.contains(event.target as Node)) {
                handleCancel();
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleCancel();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onCancel]);

    const confirmClasses = {
        primary: 'bg-[#56A652] text-white hover:brightness-90',
        danger: 'bg-[#EE4266] text-white hover:brightness-90',
    };

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl',
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-fast p-4 md:p-8">
            <div
                ref={modalContentRef}
                className={`bg-white dark:bg-[#344E41] rounded-2xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col border border-[#EDE9DE] dark:border-[#3A5A40] overflow-hidden ${isExiting ? 'animate-scale-out' : 'animate-scale-in'}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                <div className="px-6 py-4 border-b border-[#EDE9DE] dark:border-[#3A5A40] flex justify-between items-center bg-white dark:bg-[#344E41] shrink-0">
                    <h2 id="modal-title" className="text-xl md:text-2xl font-bold text-[#121e18] dark:text-white truncate pr-4">{title}</h2>
                    <div className="flex items-center gap-3">
                        {headerButtons}
                        {!hideCloseButton && (
                            <button
                                onClick={handleCancel}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-[#446843] text-[#AFBD96] hover:text-[#1A2B22] dark:hover:text-white transition-all"
                                aria-label="Close modal"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="text-[#121e18]/80 dark:text-white/80">
                        {typeof message === 'string' ? <p className="leading-relaxed">{message}</p> : message}
                    </div>
                </div>

                {onConfirm && !hideFooter && (
                    <div className="px-6 py-4 bg-[#F8FAFB] dark:bg-[#2A3F35] border-t border-[#EDE9DE] dark:border-[#3A5A40] flex justify-end gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-5 py-2 rounded-lg text-[#121e18] dark:text-white bg-[#e8e5da] dark:bg-[#344e41] hover:bg-[#CDC6AE] dark:hover:bg-[#467645] transition-colors font-semibold text-sm"
                        >
                            {cancelText || t("Cancel")}
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            className={`px-6 py-2 rounded-lg transition-all font-bold text-sm shadow-sm ${confirmClasses[confirmVariant]}`}
                        >
                            {confirmText || t('Confirm')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export const ModalContainer: React.FC = () => {
    const { modal, hideModal } = useModal();

    if (!modal) return null;

    return <Modal {...modal} onDismiss={hideModal} />;
};