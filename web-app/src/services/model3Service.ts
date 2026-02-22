import axios from 'axios';
import type { TelegramSession } from '../types';

const API_BASE = 'http://localhost:3001/api'; // Backend API for Model 3

interface PhoneCodeResponse {
    phoneCodeHash: string;
    phoneNumber: string;
}

interface SessionData {
    sessionId: string;
    userId: number;
    phoneNumber: string;
    accessHash?: string;
}

/**
 * Model 3: Telegram Account-based Cloud Storage
 * Uses MTProto API to login to Telegram account and access Saved Messages
 */

// Step 1: Request OTP with phone number
export const requestPhoneCode = async (phoneNumber: string): Promise<PhoneCodeResponse> => {
    try {
        const response = await axios.post(`${API_BASE}/model3/request-otp`, {
            phoneNumber: phoneNumber.replace(/\D/g, '') // Remove non-digits
        });

        if (response.data?.success) {
            return {
                phoneCodeHash: response.data.phoneCodeHash,
                phoneNumber: response.data.phoneNumber
            };
        }
        throw new Error(response.data?.error || 'Failed to request OTP');
    } catch (error: any) {
        console.error('Request OTP error:', error.message);
        throw new Error('Failed to request OTP. Please check your phone number.');
    }
};

// Step 2: Verify OTP and complete login
export const verifyOtpAndLogin = async (
    phoneNumber: string,
    phoneCodeHash: string,
    code: string
): Promise<TelegramSession> => {
    try {
        const response = await axios.post(`${API_BASE}/model3/verify-otp`, {
            phoneNumber,
            phoneCodeHash,
            code
        });

        if (response.data?.success) {
            const session: TelegramSession = {
                sessionId: response.data.sessionId,
                userId: response.data.userId,
                phoneNumber: response.data.phoneNumber,
                accessHash: response.data.accessHash,
                encryptedSession: response.data.encryptedSession,
                createdAt: Date.now(),
                isActive: true
            };
            return session;
        }
        throw new Error(response.data?.error || 'Failed to verify OTP');
    } catch (error: any) {
        console.error('Verify OTP error:', error.message);
        throw new Error('Invalid OTP. Please try again.');
    }
};

// Step 3: Fetch Saved Messages (media only)
export const fetchSavedMessages = async (
    session: TelegramSession,
    limit: number = 50,
    offset: number = 0
) => {
    try {
        const response = await axios.post(`${API_BASE}/model3/saved-messages`, {
            sessionId: session.sessionId,
            userId: session.userId,
            limit,
            offset
        });

        if (response.data?.success) {
            return {
                messages: response.data.messages, // Array of media messages
                hasMore: response.data.hasMore,
                totalCount: response.data.totalCount
            };
        }
        throw new Error(response.data?.error || 'Failed to fetch Saved Messages');
    } catch (error: any) {
        console.error('Fetch Saved Messages error:', error.message);
        throw error;
    }
};

// Step 4: Upload file to Telegram (Model 3)
export const uploadFileToModel3 = async (
    session: TelegramSession,
    file: File,
    onProgress?: (progress: number) => void
): Promise<{ messageId: number; fileId: string }> => {
    try {
        const formData = new FormData();
        formData.append('sessionId', session.sessionId);
        formData.append('userId', session.userId.toString());
        formData.append('file', file);
        formData.append('fileName', file.name);

        const response = await axios.post(`${API_BASE}/model3/upload-file`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(percentCompleted);
                }
            }
        });

        if (response.data?.success) {
            return {
                messageId: response.data.messageId,
                fileId: response.data.fileId
            };
        }
        throw new Error(response.data?.error || 'Upload failed');
    } catch (error: any) {
        console.error('Model 3 upload error:', error.message);
        throw error;
    }
};

// Step 5: Download file from Model 3
export const getModel3FileUrl = async (session: TelegramSession, fileId: string): Promise<string> => {
    try {
        const response = await axios.post(`${API_BASE}/model3/get-file-url`, {
            sessionId: session.sessionId,
            userId: session.userId,
            fileId
        });

        if (response.data?.success) {
            return response.data.fileUrl;
        }
        throw new Error(response.data?.error || 'Failed to get file URL');
    } catch (error: any) {
        console.error('Get file URL error:', error.message);
        throw error;
    }
};

// Step 6: Delete message from Saved Messages (Model 3)
export const deleteModel3Message = async (session: TelegramSession, messageId: number): Promise<void> => {
    try {
        const response = await axios.post(`${API_BASE}/model3/delete-message`, {
            sessionId: session.sessionId,
            userId: session.userId,
            messageId
        });

        if (!response.data?.success) {
            throw new Error(response.data?.error || 'Failed to delete message');
        }
    } catch (error: any) {
        console.error('Delete message error:', error.message);
        throw error;
    }
};

// Step 7: Logout from Model 3
export const logoutModel3 = async (session: TelegramSession): Promise<void> => {
    try {
        await axios.post(`${API_BASE}/model3/logout`, {
            sessionId: session.sessionId,
            userId: session.userId
        });
    } catch (error: any) {
        console.error('Logout error:', error.message);
        // Don't throw, we still want to clear local session
    }
};

// Helper: Check if session is still valid
export const validateModel3Session = async (session: TelegramSession): Promise<boolean> => {
    try {
        const response = await axios.post(`${API_BASE}/model3/validate-session`, {
            sessionId: session.sessionId,
            userId: session.userId
        });
        return response.data?.valid === true;
    } catch {
        return false;
    }
};

// Store session (encrypted in localStorage)
export const storeModel3Session = (session: TelegramSession): void => {
    localStorage.setItem('model3_session', JSON.stringify(session));
};

// Retrieve stored session
export const getStoredModel3Session = (): TelegramSession | null => {
    try {
        const stored = localStorage.getItem('model3_session');
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
};

// Clear stored session
export const clearModel3Session = (): void => {
    localStorage.removeItem('model3_session');
};
