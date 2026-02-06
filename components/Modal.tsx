
import React, { useEffect, useState } from 'react';
import { useModal, ModalOptions } from '../hooks/useModal';

const Modal: React.FC<ModalOptions & { onDismiss: () => void }> = ({
    title,
    message,
    confirmText,
    onConfirm,
    confirmVariant = 'primary',
    onDismiss
}) => {
    const [isExiting, setIsExiting] = useState(false);

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

    const confirmClasses = {
        primary: 'bg-[#56A652] text-white hover:brightness-90',
        danger: 'bg-[#EE4266] text-white hover:brightness-90',
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-fast p-4">
            <div
                className={`bg-white dark:bg-[#344E41] rounded-lg shadow-xl w-full max-w-md border border-[#EDE9DE] dark:border-[#3A5A40] ${isExiting ? 'animate-scale-out' : 'animate-scale-in'}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                <div className="p-6">
                    <h2 id="modal-title" className="text-2xl font-bold text-[#121e18] dark:text-white">{title}</h2>
                    <p className="mt-2 text-[#121e18]/80 dark:text-white/80">{message}</p>
                </div>
                <div className="bg-[#EFF1F2] dark:bg-[#4D6A53]/50 px-6 py-4 flex justify-end gap-4 rounded-b-lg">
                    {onConfirm ? (
                        <>
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-4 py-2 rounded-md text-[#121e18] dark:text-white bg-[#e8e5da] dark:bg-[#344e41] hover:bg-[#CDC6AE] dark:hover:bg-[#467645] transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                className={`px-4 py-2 rounded-md transition-colors font-semibold ${confirmClasses[confirmVariant]}`}
                            >
                                {confirmText || 'Confirm'}
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 rounded-md text-white bg-[#56A652] hover:brightness-90 transition-colors font-semibold"
                        >
                            OK
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};


export const ModalContainer: React.FC = () => {
    const { modal, hideModal } = useModal();

    if (!modal) return null;

    return <Modal {...modal} onDismiss={hideModal} />;
};