import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';
import type { TelegramSession } from '../types';
import { requestPhoneCode, verifyOtpAndLogin, logoutModel3 } from '../services/model3Service';
import './Model3LoginSection.css';

interface Model3LoginSectionProps {
    session: TelegramSession | null;
    onSessionChange: (session: TelegramSession | null) => void;
}

const Model3LoginSection: React.FC<Model3LoginSectionProps> = ({ session, onSessionChange }) => {
    const [step, setStep] = useState<'phone' | 'otp' | 'loggedIn'>(!session ? 'phone' : 'loggedIn');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [phoneCodeHash, setPhoneCodeHash] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const formatPhoneNumber = (value: string): string => {
        const digits = value.replace(/\D/g, '');
        if (digits.length <= 2) return digits;
        if (digits.length <= 5) return `+${digits.slice(0, 2)} ${digits.slice(2)}`;
        if (digits.length <= 9) return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
        return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)} ${digits.slice(9)}`;
    };

    const handleRequestOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const result = await requestPhoneCode(phoneNumber);
            setPhoneCodeHash(result.phoneCodeHash);
            setStep('otp');
            setSuccess('OTP sent to your Telegram app. Check "Login Attempts" in Settings.');
        } catch (err: any) {
            setError(err.message || 'Failed to request OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const newSession = await verifyOtpAndLogin(phoneNumber, phoneCodeHash, otp);
            onSessionChange(newSession);
            setStep('loggedIn');
            setSuccess(`Successfully logged in as ${newSession.phoneNumber}`);
            setPhoneNumber('');
            setOtp('');
        } catch (err: any) {
            setError(err.message || 'Failed to verify OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        if (!session) return;
        setLoading(true);
        setError('');

        try {
            await logoutModel3(session);
            onSessionChange(null);
            setStep('phone');
            setSuccess('Logged out successfully');
        } catch (err: any) {
            setError(err.message || 'Failed to logout');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="model3-login-section">
            <div className="model3-header">
                <h3>📱 Telegram Account Cloud (Model 3 - Experimental)</h3>
                <p className="model3-subtitle">Login with your Telegram account to use Saved Messages as cloud storage</p>
            </div>

            {error && (
                <div className="model3-alert error">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="model3-alert success">
                    <CheckCircle size={18} />
                    <span>{success}</span>
                </div>
            )}

            {step === 'phone' && !session && (
                <form onSubmit={handleRequestOTP} className="model3-form">
                    <div className="form-group">
                        <label htmlFor="phone">Phone Number</label>
                        <input
                            type="tel"
                            id="phone"
                            value={formatPhoneNumber(phoneNumber)}
                            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                            placeholder="Enter your phone number"
                            required
                            disabled={loading}
                        />
                        <small>Include country code (e.g., 91 for India)</small>
                    </div>
                    <button type="submit" disabled={loading} className="model3-btn">
                        {loading ? <Loader size={16} className="spinner" /> : <>Send OTP</>}
                    </button>
                </form>
            )}

            {step === 'otp' && !session && (
                <form onSubmit={handleVerifyOTP} className="model3-form">
                    <div className="model3-info-box">
                        <AlertCircle size={18} />
                        <p>Check your Telegram app for the login code under Settings → Security → Login Attempts</p>
                    </div>
                    <div className="form-group">
                        <label htmlFor="otp">Verification Code</label>
                        <input
                            type="text"
                            id="otp"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            maxLength={6}
                            required
                            disabled={loading}
                            autoFocus
                        />
                    </div>
                    <button type="submit" disabled={loading} className="model3-btn">
                        {loading ? <Loader size={16} className="spinner" /> : <>Verify & Login</>}
                    </button>
                </form>
            )}

            {step === 'loggedIn' && session && (
                <div className="model3-logged-in">
                    <div className="session-info">
                        <CheckCircle size={24} className="check-icon" />
                        <div className="session-details">
                            <h4>Connected to Telegram</h4>
                            <p>Phone: {session.phoneNumber}</p>
                            <p className="session-date">
                                Connected: {new Date(session.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <div className="model3-info-box warning">
                        <AlertCircle size={18} />
                        <p>⚠️ This is an experimental feature. Your session is encrypted and stored securely.</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        disabled={loading}
                        className="model3-btn logout"
                    >
                        {loading ? <Loader size={16} className="spinner" /> : <>Logout</>}
                    </button>
                </div>
            )}
        </div>
    );
};

export default Model3LoginSection;
