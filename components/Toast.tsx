import { useEffect, useState } from 'react';

interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    show: boolean;
    onClose: () => void;
    duration?: number;
}

export default function Toast({ message, type, show, onClose, duration = 5000 }: ToastProps) {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [show, duration, onClose]);

    if (!show) return null;

    const getToastClass = () => {
        switch (type) {
            case 'success':
                return 'bg-success text-white';
            case 'error':
                return 'bg-danger text-white';
            case 'warning':
                return 'bg-warning text-dark';
            case 'info':
                return 'bg-info text-white';
            default:
                return 'bg-secondary text-white';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'success':
                return '✅';
            case 'error':
                return '❌';
            case 'warning':
                return '⚠️';
            case 'info':
                return 'ℹ️';
            default:
                return '📢';
        }
    };

    return (
        <div
            className="position-fixed top-0 end-0 p-3"
            style={{ zIndex: 1050 }}
        >
            <div className={`toast show ${getToastClass()}`} role="alert">
                <div className="toast-header">
                    <span className="me-2">{getIcon()}</span>
                    <strong className="me-auto">
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                    </strong>
                    <button
                        type="button"
                        className="btn-close"
                        onClick={onClose}
                        aria-label="Close"
                    ></button>
                </div>
                <div className="toast-body">
                    {message}
                </div>
            </div>
        </div>
    );
}