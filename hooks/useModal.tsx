
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface ModalOptions {
    title: string;
    message: string | React.ReactNode;
    confirmText?: string;
    onConfirm?: () => void;
    confirmVariant?: 'primary' | 'danger';
    headerButtons?: React.ReactNode;
    cancelText?: string;
    onCancel?: () => void;
}

interface ModalContextType {
    modal: ModalOptions | null;
    showModal: (options: ModalOptions) => void;
    hideModal: () => void;
    showAlert: (options: Pick<ModalOptions, 'title' | 'message'>) => void;
    showConfirm: (options: ModalOptions) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [modal, setModal] = useState<ModalOptions | null>(null);

    const showModal = useCallback((options: ModalOptions) => {
        setModal(options);
    }, []);

    const hideModal = useCallback(() => {
        setModal(null);
    }, []);
    
    const showAlert = useCallback((options: Pick<ModalOptions, 'title' | 'message'>) => {
        showModal(options);
    }, [showModal]);

    const showConfirm = useCallback((options: ModalOptions) => {
        showModal(options);
    }, [showModal]);

    const value = { modal, showModal, hideModal, showAlert, showConfirm };

    return (
        <ModalContext.Provider value={value}>
            {children}
        </ModalContext.Provider>
    );
};

export const useModal = (): ModalContextType => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};