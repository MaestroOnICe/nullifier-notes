import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, onSelect }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-gray-800 p-6 rounded-lg w-80">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl text-white">Select Connection</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                <div className="space-y-3">
                    <button
                        onClick={() => onSelect('localhost')}
                        className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700"
                    >
                        Localhost
                    </button>
                    <button
                        onClick={() => onSelect('metamask')}
                        className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700"
                    >
                        Metamask
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;