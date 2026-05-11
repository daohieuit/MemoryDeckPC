import React, { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStudySession } from '../hooks/useStudySessionContext';
import { useModal } from '../hooks/useModal';
import { useLanguage } from '../hooks/useLanguage';
import { ExclamationTriangleIcon } from './icons/Icons';

export const NavigationGuard: React.FC = () => {
    const { isSessionActive, endSession } = useStudySession();
    const { showModal, hideModal } = useModal();
    const { t } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();
    const isShowingModal = useRef(false);
    const isConfirmingExit = useRef(false);

    const shouldBlockNavigation = useCallback((targetPath: string) => {
        if (!isSessionActive) {
            return false;
        }

        if (isConfirmingExit.current) {
            return false;
        }

        if (!targetPath || targetPath === location.pathname) {
            return false;
        }

        if (targetPath.includes('/summary')) {
            return false;
        }

        return true;
    }, [isSessionActive, location.pathname]);

    const confirmNavigation = useCallback((targetPath: string) => {
        if (!shouldBlockNavigation(targetPath)) {
            navigate(targetPath);
            return;
        }

        if (isShowingModal.current) {
            return;
        }

        isShowingModal.current = true;
        showModal({
            title: t('Exit Session?'),
            message: (
                <div className="flex items-start gap-3">
                    <ExclamationTriangleIcon className="w-6 h-6 text-[#EE4266] flex-shrink-0 mt-0.5" />
                    <p className="text-[#121e18]/80 dark:text-white/80">
                        {t('Your current progress in this session may not be saved. Are you sure you want to leave?')}
                    </p>
                </div>
            ),
            confirmText: t('Leave'),
            cancelText: t('Stay'),
            confirmVariant: 'danger',
            onConfirm: () => {
                isConfirmingExit.current = true;
                isShowingModal.current = false;
                hideModal();
                endSession();
                navigate(targetPath);
                queueMicrotask(() => {
                    isConfirmingExit.current = false;
                });
            },
            onCancel: () => {
                isShowingModal.current = false;
                hideModal();
            },
        });
    }, [endSession, hideModal, navigate, shouldBlockNavigation, showModal, t]);

    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (!isSessionActive) {
                return;
            }

            event.preventDefault();
            event.returnValue = '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isSessionActive]);

    useEffect(() => {
        const handlePopState = () => {
            if (!isSessionActive || isShowingModal.current || isConfirmingExit.current) {
                return;
            }

            window.history.pushState(null, '', window.location.href);
            confirmNavigation('/');
        };

        if (isSessionActive) {
            window.history.pushState(null, '', window.location.href);
        }

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [confirmNavigation, isSessionActive]);

    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            if (!isSessionActive || isShowingModal.current || isConfirmingExit.current) {
                return;
            }

            const target = event.target as HTMLElement;
            const clickable = target.closest<HTMLElement>('[data-nav-target], a[href]');

            if (!clickable) {
                return;
            }

            const targetPath = clickable.dataset.navTarget
                ?? (() => {
                    const href = clickable.getAttribute('href');
                    if (!href) {
                        return null;
                    }

                    if (href.startsWith('#/')) {
                        return href.slice(1);
                    }

                    if (href.startsWith('/')) {
                        return href;
                    }

                    return null;
                })();

            if (!targetPath || !shouldBlockNavigation(targetPath)) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            confirmNavigation(targetPath);
        };

        document.addEventListener('click', handleClick, true);

        return () => {
            document.removeEventListener('click', handleClick, true);
        };
    }, [confirmNavigation, isSessionActive, shouldBlockNavigation]);

    return null;
};
