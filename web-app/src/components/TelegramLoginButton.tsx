import React, { useEffect, useRef } from 'react';
import type { TelegramUser } from '../types';

interface TelegramLoginButtonProps {
    botUsername: string;
    onAuth: (user: TelegramUser) => void;
    buttonSize?: 'large' | 'medium' | 'small';
    cornerRadius?: number;
    requestAccess?: boolean;
    showUserPhoto?: boolean;
}

declare global {
    interface Window {
        onTelegramAuth: (user: TelegramUser) => void;
    }
}

const TelegramLoginButton: React.FC<TelegramLoginButtonProps> = ({
    botUsername,
    onAuth,
    buttonSize = 'large',
    cornerRadius,
    requestAccess = true,
    showUserPhoto = true,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        window.onTelegramAuth = (user: TelegramUser) => onAuth(user);

        const script = document.createElement('script');
        script.src = 'https://telegram.org/js/telegram-widget.js?22';
        script.setAttribute('data-telegram-login', botUsername);
        script.setAttribute('data-size', buttonSize);
        if (cornerRadius !== undefined) {
            script.setAttribute('data-radius', cornerRadius.toString());
        }
        script.setAttribute('data-onauth', 'onTelegramAuth(user)');
        script.setAttribute('data-request-access', requestAccess ? 'write' : '');
        if (!showUserPhoto) {
            script.setAttribute('data-userpic', 'false');
        }
        script.async = true;

        if (containerRef.current) {
            containerRef.current.innerHTML = '';
            containerRef.current.appendChild(script);
        }

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [botUsername, onAuth, buttonSize, cornerRadius, requestAccess, showUserPhoto]);

    return <div ref={containerRef} className="telegram-login-button-container" />;
};

export default TelegramLoginButton;
