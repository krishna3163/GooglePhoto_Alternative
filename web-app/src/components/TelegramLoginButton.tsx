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
    const onAuthRef = useRef(onAuth);
    onAuthRef.current = onAuth;

    useEffect(() => {
        window.onTelegramAuth = (user: TelegramUser) => {
            try {
                onAuthRef.current(user);
            } catch (e) {
                console.error('Telegram auth callback error:', e);
            }
        };

        if (!botUsername || !containerRef.current) return;

        const container = containerRef.current;
        container.innerHTML = '';

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

        container.appendChild(script);

        return () => {
            container.innerHTML = '';
        };
    }, [botUsername, buttonSize, cornerRadius, requestAccess, showUserPhoto]);

    return <div ref={containerRef} className="telegram-login-button-container" />;
};

export default TelegramLoginButton;
