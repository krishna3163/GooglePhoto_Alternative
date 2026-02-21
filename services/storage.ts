import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
    BOT_TOKEN: 'botToken',
    CHAT_ID: 'chatId',
};

export const saveTelegramConfig = async (token: string, chatId: string): Promise<void> => {
    try {
        await AsyncStorage.setItem(STORAGE_KEYS.BOT_TOKEN, token);
        await AsyncStorage.setItem(STORAGE_KEYS.CHAT_ID, chatId);
    } catch (e) {
        console.error('Failed to save configuration', e);
        throw e;
    }
};

export const getTelegramConfig = async (): Promise<{ token: string | null; chatId: string | null }> => {
    try {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.BOT_TOKEN);
        const chatId = await AsyncStorage.getItem(STORAGE_KEYS.CHAT_ID);
        return { token, chatId };
    } catch (e) {
        console.error('Failed to load configuration', e);
        return { token: null, chatId: null };
    }
};
