import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const ErrorPopup = ({ message, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 10000);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center">
                <span>{message}</span>
                <button onClick={onClose} className="ml-2 focus:outline-none">
                    <X size={18} />
                </button>
            </div>
        </div>
    );
};

export default ErrorPopup;