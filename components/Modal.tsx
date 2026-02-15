
import React, { useEffect, useState, useRef } from 'react'; // Import useRef
import { useModal, ModalOptions } from '../hooks/useModal';
import { useLanguage } from '../hooks/useLanguage';

const Modal: React.FC<ModalOptions & { onDismiss: () => void }> = ({
    title,
    message,
    confirmText,
    onConfirm,
    confirmVariant = 'primary',
    onDismiss,
    headerButtons // Added headerButtons to destructuring
}) => {
    const [isExiting, setIsExiting] = useState(false);
    const { t } = useLanguage();
    const modalContentRef = useRef<HTMLDivElement>(null); // Ref for modal content

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(onDismiss, 200);
    };

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm();
        }
        handleClose();
    };

    // Effect for outside click and Escape key
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalContentRef.current && !modalContentRef.current.contains(event.target as Node)) {
                handleClose();
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onDismiss]); // Depend on onDismiss to ensure handleClose is up-to-date

    const confirmClasses = {
        primary: 'bg-[#56A652] text-white hover:brightness-90',
        danger: 'bg-[#EE4266] text-white hover:brightness-90',
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-fast p-4">
            <div
                ref={modalContentRef} // Attach ref here
                className={`bg-white dark:bg-[#344E41] rounded-lg shadow-xl w-full max-w-md border border-[#EDE9DE] dark:border-[#3A5A40] ${isExiting ? 'animate-scale-out' : 'animate-scale-in'}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                <div className="p-6">
                    <div className="flex justify-between items-center mb-2"> {/* Flex container for title and close button */}
                        <h2 id="modal-title" className="text-2xl font-bold text-[#121e18] dark:text-white">{title}</h2>
                        <div className="flex items-center gap-2"> {/* Group for header buttons and close button */}
                            {headerButtons}
                            <button
                                onClick={handleClose}
                                className="text-[#AFBD96] hover:text-[#1A2B22] dark:hover:text-white transition-colors"
                                aria-label="Close modal"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    <div className="mt-2 text-[#121e18]/80 dark:text-white/80">
                        {typeof message === 'string' ? <p>{message}</p> : message}
                    </div>
                </div>
                {onConfirm && (
                    <div className="bg-[#EFF1F2] dark:bg-[#4D6A53]/50 px-6 py-4 flex justify-end gap-4 rounded-b-lg">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 rounded-md text-[#121e18] dark:text-white bg-[#e8e5da] dark:bg-[#344e41] hover:bg-[#CDC6AE] dark:hover:bg-[#467645] transition-colors font-medium"
                        >
                            {t("Cancel")}
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            className={`px-4 py-2 rounded-md transition-colors font-semibold ${confirmClasses[confirmVariant]}`}
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