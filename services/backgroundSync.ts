import { syncNewImages } from './syncService';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKGROUND_SYNC_TASK = 'BACKGROUND_SYNC';

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
    try {
        // Check Settings
        const autoBackup = await AsyncStorage.getItem('settings.autoBackup');
        const backgroundSync = await AsyncStorage.getItem('settings.backgroundSync');

        // "Only run if Auto Backup is ON."
        // "Only run if Background Sync is ON."
        if (autoBackup !== 'true' || backgroundSync !== 'true') { // Default are false/undefined so safe
            console.log("Background sync skipped due to settings.");
            return BackgroundFetch.BackgroundFetchResult.NoData;
        }

        console.log('Starting background sync...');
        const result = await syncNewImages(true); // Pass true for isBackground
        console.log(`Background sync finished. New items: ${result}`);
        return result > 0 ? BackgroundFetch.BackgroundFetchResult.NewData : BackgroundFetch.BackgroundFetchResult.NoData;
    } catch (error) {
        console.error('Background sync failed:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
    }
});

export const registerBackgroundSync = async () => {
    try {
        // We register the task, but it will exit early if settings are off.
        // Ideally we unregister if off, but checking inside is easier for now.
        await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
            minimumInterval: 15 * 60, // 15 minutes
            stopOnTerminate: false,
            startOnBoot: true,
        });
        console.log('Background sync registered');
    } catch (err) {
        console.error('Task Register failed:', err);
    }
};
