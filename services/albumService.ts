import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
    SELECTED_ALBUMS: 'selectedAlbums',
};

export const getDeviceAlbums = async (): Promise<MediaLibrary.Album[]> => {
    try {
        const permission = await MediaLibrary.requestPermissionsAsync();
        if (!permission.granted) return [];

        const albums = await MediaLibrary.getAlbumsAsync({
            includeSmartAlbums: true,
        });
        return albums;
    } catch (error) {
        console.error('Failed to get albums', error);
        return [];
    }
};

export const saveSelectedAlbums = async (albumIds: string[]): Promise<void> => {
    try {
        await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_ALBUMS, JSON.stringify(albumIds));
    } catch (error) {
        console.error('Failed to save selected albums', error);
    }
};

export const getSelectedAlbums = async (): Promise<string[]> => {
    try {
        const json = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_ALBUMS);
        return json ? JSON.parse(json) : [];
    } catch (error) {
        console.error('Failed to get selected albums', error);
        return [];
    }
};
