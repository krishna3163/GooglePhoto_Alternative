import * as SQLite from 'expo-sqlite/legacy';
import { Platform } from 'react-native';

const db: any = Platform.OS !== 'web' ? SQLite.openDatabase('telephoto.db') : {
    transaction: () => { console.warn('SQLite is only available on native platforms.'); }
};

export const initDatabase = () => {
    return new Promise<void>((resolve, reject) => {
        db.transaction((tx: any) => {
            tx.executeSql(
                'CREATE TABLE IF NOT EXISTS uploaded_images (id INTEGER PRIMARY KEY AUTOINCREMENT, fileUri TEXT UNIQUE, uploadedAt TEXT);',
                [],
                null, // Success callback for first table, not needed to resolve yet
                (_: any, error: any) => {
                    console.error('Failed to create uploaded_images table', error);
                    reject(error);
                    return true; // rollback
                }
            );
            tx.executeSql(
                'CREATE TABLE IF NOT EXISTS uploaded_files (id INTEGER PRIMARY KEY AUTOINCREMENT, fileUri TEXT UNIQUE, telegramFileId TEXT, mediaType TEXT, fileName TEXT, uploadedAt TEXT);',
            );
            tx.executeSql(
                'CREATE TABLE IF NOT EXISTS folders (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, createdAt TEXT);',
            );
            tx.executeSql(
                'CREATE TABLE IF NOT EXISTS file_folders (fileId INTEGER, folderId INTEGER, PRIMARY KEY (fileId, folderId));',
                [],
                () => {
                    console.log('Database initialized');
                    resolve();
                },
                (_: any, error: any) => {
                    console.error('Failed to create tables', error);
                    reject(error);
                    return true;
                }
            );
            // OCR table
            tx.executeSql(
                'CREATE TABLE IF NOT EXISTS image_ocr (fileUri TEXT PRIMARY KEY, extractedText TEXT);',
            );
        });
    });
};

export const isImageUploaded = (fileUri: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        db.transaction((tx: any) => {
            tx.executeSql(
                'SELECT * FROM uploaded_images WHERE fileUri = ?;',
                [fileUri],
                (_: any, result: any) => {
                    const _array = result.rows ? result.rows._array : [];
                    resolve(_array.length > 0);
                },
                (_: any, error: any) => {
                    console.error('Error checking image status', error);
                    resolve(false); // default to false on error to retry
                    return false;
                }
            );
        });
    });
};

export const markImageUploaded = (fileUri: string): Promise<void> => {
    const timestamp = new Date().toISOString();
    return new Promise((resolve, reject) => {
        db.transaction((tx: any) => {
            tx.executeSql(
                'INSERT OR IGNORE INTO uploaded_images (fileUri, uploadedAt) VALUES (?, ?);',
                [fileUri, timestamp],
                () => resolve(),
                (_: any, error: any) => {
                    console.error('Error marking image as uploaded', error);
                    reject(error);
                    return false;
                }
            );
        });
    });
};

export const getUploadedCount = (): Promise<number> => {
    return new Promise((resolve) => {
        db.transaction((tx: any) => {
            tx.executeSql(
                'SELECT COUNT(*) as count FROM uploaded_images;',
                [],
                (_: any, result: any) => {
                    const _array = result.rows ? result.rows._array : [];
                    resolve(_array.length > 0 ? _array[0].count : 0);
                },
                (_: any, error: any) => {
                    console.error(error);
                    resolve(0);
                    return false;
                }
            )
        })
    })
}

export const saveOCRText = (fileUri: string, text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        db.transaction((tx: any) => {
            tx.executeSql(
                'INSERT OR REPLACE INTO image_ocr (fileUri, extractedText) VALUES (?, ?);',
                [fileUri, text],
                () => resolve(),
                (_: any, error: any) => {
                    console.error('Error saving OCR text', error);
                    reject(error);
                    return false;
                }
            );
        });
    });
};

export const getOCRText = (fileUri: string): Promise<string | null> => {
    return new Promise((resolve) => {
        db.transaction((tx: any) => {
            tx.executeSql(
                'SELECT extractedText FROM image_ocr WHERE fileUri = ?;',
                [fileUri],
                (_: any, result: any) => {
                    const _array = result.rows ? result.rows._array : [];
                    resolve(_array.length > 0 ? _array[0].extractedText : null);
                },
                (_: any, error: any) => {
                    console.error('Error getting OCR text', error);
                    resolve(null);
                    return false;
                }
            );
        });
    });
};

export const searchImagesByText = (query: string): Promise<any[]> => {
    return new Promise((resolve) => {
        db.transaction((tx: any) => {
            tx.executeSql(
                'SELECT f.* FROM uploaded_files f JOIN image_ocr o ON f.fileUri = o.fileUri WHERE o.extractedText LIKE ?;',
                [`%${query}%`],
                (_: any, result: any) => {
                    const _array = result.rows ? result.rows._array : [];
                    resolve(_array);
                },
                (_: any, error: any) => {
                    console.error('Error searching images', error);
                    resolve([]);
                    return false;
                }
            );
        });
    });
};

// Cloud Drive helpers
export const saveUploadedFile = (fileUri: string, telegramFileId: string, mediaType: 'image' | 'video' | 'document' = 'image', fileName?: string): Promise<void> => {
    const ts = new Date().toISOString();
    return new Promise((resolve, reject) => {
        db.transaction((tx: any) => {
            tx.executeSql(
                'INSERT OR REPLACE INTO uploaded_files (fileUri, telegramFileId, mediaType, fileName, uploadedAt) VALUES (?, ?, ?, ?, ?);',
                [fileUri, telegramFileId, mediaType, fileName || null, ts],
                () => resolve(),
                (_: any, error: any) => {
                    console.error('Error saving uploaded file', error);
                    reject(error);
                    return false;
                }
            );
        });
    });
};

export const getUploadedFiles = (filter: 'all' | 'image' | 'video' | 'document' = 'all'): Promise<any[]> => {
    return new Promise((resolve) => {
        const q = filter === 'all' ? 'SELECT * FROM uploaded_files ORDER BY uploadedAt DESC;' : 'SELECT * FROM uploaded_files WHERE mediaType = ? ORDER BY uploadedAt DESC;';
        const params = filter === 'all' ? [] : [filter];
        db.transaction((tx: any) => {
            tx.executeSql(
                q,
                params,
                (_: any, result: any) => {
                    const _array = result.rows ? result.rows._array : [];
                    resolve(_array);
                },
                (_: any, error: any) => {
                    console.error('Error fetching uploaded files', error);
                    resolve([]);
                    return false;
                }
            );
        });
    });
};

export const createFolder = (name: string): Promise<void> => {
    const ts = new Date().toISOString();
    return new Promise((resolve, reject) => {
        db.transaction((tx: any) => {
            tx.executeSql(
                'INSERT OR IGNORE INTO folders (name, createdAt) VALUES (?, ?);',
                [name, ts],
                () => resolve(),
                (_: any, error: any) => {
                    console.error('Error creating folder', error);
                    reject(error);
                    return false;
                }
            );
        });
    });
};

export const getFolders = (): Promise<any[]> => {
    return new Promise((resolve) => {
        db.transaction((tx: any) => {
            tx.executeSql(
                'SELECT * FROM folders ORDER BY createdAt DESC;',
                [],
                (_: any, result: any) => {
                    const _array = result.rows ? result.rows._array : [];
                    resolve(_array);
                },
                (_: any, error: any) => {
                    console.error('Error fetching folders', error);
                    resolve([]);
                    return false;
                }
            )
        })
    })
};

export const addFileToFolder = (fileId: number, folderId: number): Promise<void> => {
    return new Promise((resolve, reject) => {
        db.transaction((tx: any) => {
            tx.executeSql(
                'INSERT OR IGNORE INTO file_folders (fileId, folderId) VALUES (?, ?);',
                [fileId, folderId],
                () => resolve(),
                (_: any, error: any) => {
                    console.error('Error associating file to folder', error);
                    reject(error);
                    return false;
                }
            )
        })
    })
};

export const getFilesByFolder = (folderId: number): Promise<any[]> => {
    return new Promise((resolve) => {
        db.transaction((tx: any) => {
            tx.executeSql(
                'SELECT f.* FROM uploaded_files f JOIN file_folders ff ON ff.fileId = f.id WHERE ff.folderId = ? ORDER BY f.uploadedAt DESC;',
                [folderId],
                (_: any, result: any) => {
                    const _array = result.rows ? result.rows._array : [];
                    resolve(_array);
                },
                (_: any, error: any) => {
                    console.error('Error fetching files by folder', error);
                    resolve([]);
                    return false;
                }
            )
        })
    })
};

export const getStorageStats = async (): Promise<{ totalFiles: number; photos: number; videos: number; docs: number }> => {
    const all = await getUploadedFiles('all');
    const photos = all.filter((f: any) => f.mediaType === 'image').length;
    const videos = all.filter((f: any) => f.mediaType === 'video').length;
    const docs = all.filter((f: any) => f.mediaType === 'document').length;
    return { totalFiles: all.length, photos, videos, docs };
};
