import React from 'react';

interface ToggleSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, disabled = false }) => {
    return (
        <button
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => !disabled && onChange(!checked)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 ease-in-out focus:outline-none shadow-inner ${
                checked ? 'bg-[#56A652]' : 'bg-[#e8e5da] dark:bg-[#446843]'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md active:scale-95'}`}
        >
            <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-all duration-[250ms] ease-in-out ${
                    checked ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
        </button>
    );
};
