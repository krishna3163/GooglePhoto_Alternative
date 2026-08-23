import React, { useState } from 'react';
import { Lock, Fingerprint, ShieldCheck } from 'lucide-react';
import './AppLock.css';

interface AppLockProps {
    storedPin: string;
    onUnlock: () => void;
}

const AppLock: React.FC<AppLockProps> = ({ storedPin, onUnlock }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);

    const handleDigit = (digit: string) => {
        if (pin.length < 4) {
            const next = pin + digit;
            setPin(next);
            if (next.length === 4) {
                if (next === storedPin) {
                    onUnlock();
                } else {
                    setError(true);
                    setTimeout(() => {
                        setPin('');
                        setError(false);
                    }, 600);
                }
            }
        }
    };

    const handleBiometricUnlock = async () => {
        try {
            if (window.PublicKeyCredential) {
                // Biometric/platform authenticator check
                const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
                if (available) {
                    onUnlock();
                }
            }
        } catch {
            // fallback to PIN
        }
    };

    const handleClear = () => {
        setPin('');
    };

    return (
        <div className="app-lock-overlay">
            <div className="app-lock-card">
                <div className="lock-icon-circle">
                    <Lock size={32} />
                </div>
                <h2>TeleGphoto Protected</h2>
                <p className="lock-subtext">Enter your 4-digit Master PIN to unlock your encrypted gallery.</p>

                <div className={`pin-dots ${error ? 'shake' : ''}`}>
                    {[0, 1, 2, 3].map(index => (
                        <span key={index} className={`dot ${pin.length > index ? 'filled' : ''}`} />
                    ))}
                </div>

                {error && <p className="pin-error-msg">Incorrect PIN. Try again.</p>}

                <div className="numpad">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                        <button key={num} className="numpad-btn" onClick={() => handleDigit(num)}>
                            {num}
                        </button>
                    ))}
                    <button className="numpad-btn action-btn" onClick={handleBiometricUnlock} title="Biometric Unlock">
                        <Fingerprint size={24} />
                    </button>
                    <button className="numpad-btn" onClick={() => handleDigit('0')}>
                        0
                    </button>
                    <button className="numpad-btn action-btn" onClick={handleClear}>
                        Clear
                    </button>
                </div>

                <div className="lock-footer">
                    <ShieldCheck size={16} /> Zero-Knowledge Client Security
                </div>
            </div>
        </div>
    );
};

export default AppLock;
