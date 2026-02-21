import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, useColorScheme, ActivityIndicator, TextInput, Modal, useWindowDimensions } from 'react-native';
import { Colors } from '../constants/Colors';
import { getUploadedFiles, createFolder, getFolders, addFileToFolder, getFilesByFolder, saveUploadedFile } from '../database/db';
import { Folder, Video, FileText, Plus, Search, FolderPlus } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { uploadFileToTelegram } from '../services/telegramService';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { getFileDownloadUrl } from '../services/telegramService';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CloudDriveScreen() {
    const { width } = useWindowDimensions();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const router = useRouter();

    const [files, setFiles] = useState<any[]>([]);
    const [folders, setFolders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentFolder, setCurrentFolder] = useState<number | null>(null);
    const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'document'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [newFolderModalVisible, setNewFolderModalVisible] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    // Dynamic grid layout
    const numColumns = width > 1000 ? 6 : width > 700 ? 4 : 2;

    useEffect(() => {
        loadContent();
    }, [currentFolder, filter]);

    const loadContent = async () => {
        setLoading(true);
        try {
            if (currentFolder) {
                const folderFiles = await getFilesByFolder(currentFolder);
                setFiles(folderFiles);
                setFolders([]);
            } else {
                const allFiles = await getUploadedFiles(filter);
                setFiles(allFiles);
                const allFolders = await getFolders();
                setFolders(allFolders);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });

            if (result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                const fileId = await uploadFileToTelegram(asset.uri, 'document');
                await saveUploadedFile(asset.uri, fileId, 'document', asset.name);
                loadContent();
            }
        } catch (e) {
            console.error("Upload failed", e);
        }
    };

    const handleCreateFolder = async () => {
        if (newFolderName.trim()) {
            await createFolder(newFolderName);
            setNewFolderModalVisible(false);
            setNewFolderName('');
            loadContent();
        }
    };

    const handleDownload = async (file: any) => {
        try {
            const downloadUrl = await getFileDownloadUrl(file.telegramFileId);
            const fileName = file.fileName || `file_${file.telegramFileId.substring(0, 8)}`;
            const localUri = FileSystem.documentDirectory + fileName;

            const downloadRes = await FileSystem.downloadAsync(downloadUrl, localUri);

            if (downloadRes.status === 200) {
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(downloadRes.uri);
                } else {
                    alert("File downloaded to: " + downloadRes.uri);
                }
            }
        } catch (e) {
            console.error("Download failed", e);
            alert("Failed to download file.");
        }
    };

    const handleOpenFile = (item: any) => {
        router.push({
            pathname: '/file-viewer',
            params: {
                fileUri: item.fileUri,
                telegramFileId: item.telegramFileId,
                mediaType: item.mediaType,
                fileName: item.fileName
            }
        });
    };

    const renderFileItem = ({ item }: { item: any }) => {
        const isImage = item.mediaType === 'image';
        return (
            <TouchableOpacity
                style={[styles.fileCard, { backgroundColor: theme.card, maxWidth: `${100 / numColumns - 2}%` }]}
                onPress={() => handleOpenFile(item)}
                onLongPress={() => handleDownload(item)}
            >
                {isImage ? (
                    <Image source={{ uri: item.fileUri }} style={styles.thumbnail} />
                ) : (
                    <View style={styles.iconPlaceholder}>
                        {item.mediaType === 'video' ? <Video color={theme.text} /> : <FileText color={theme.text} />}
                    </View>
                )}
                <View style={styles.fileInfo}>
                    <Text style={[styles.fileName, { color: theme.text }]} numberOfLines={1}>{item.fileName || 'Unnamed'}</Text>
                    <Text style={[styles.fileDate, { color: theme.textSecondary }]}>{new Date(item.uploadedAt).toLocaleDateString()}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    const renderFolderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.folderCard, { backgroundColor: theme.card, maxWidth: `${100 / numColumns - 2}%` }]}
            onPress={() => setCurrentFolder(item.id)}
        >
            <Folder color={theme.tint} size={width > 700 ? 48 : 40} />
            <Text style={[styles.folderName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    {currentFolder ? (
                        <TouchableOpacity onPress={() => setCurrentFolder(null)} style={styles.backButton}>
                            <Text style={[styles.backText, { color: theme.tint }]}>&lt; Home</Text>
                        </TouchableOpacity>
                    ) : (
                        <Text style={[styles.title, { color: theme.text }]}>Cloud Drive</Text>
                    )}
                </View>
                <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
                    <Search color={theme.textSecondary} size={20} />
                    <TextInput
                        placeholder="Search files"
                        style={[styles.searchInput, { color: theme.text }]}
                        placeholderTextColor={theme.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {/* Filters */}
            <View style={styles.filtersWrapper}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={['all', 'image', 'video', 'document']}
                    renderItem={({ item: f }) => (
                        <TouchableOpacity
                            key={f}
                            style={[styles.filterChip, filter === f && { backgroundColor: theme.tint }, { backgroundColor: filter === f ? theme.tint : theme.card }]}
                            onPress={() => setFilter(f as any)}
                        >
                            <Text style={[styles.filterText, { color: filter === f ? '#fff' : theme.textSecondary }]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.filters}
                />
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.tint} />
                </View>
            ) : (
                <FlatList
                    key={numColumns}
                    data={[...folders, ...files]}
                    keyExtractor={(item, index) => (item.fileUri ? 'file-' : 'folder-') + item.id + index}
                    renderItem={({ item }) => item.fileUri ? renderFileItem({ item }) : renderFolderItem({ item })}
                    numColumns={numColumns}
                    contentContainerStyle={styles.grid}
                    columnWrapperStyle={styles.columnWrapper}
                />
            )}

            {/* FAB */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.tint }]}
                onPress={() => setIsMenuVisible(!isMenuVisible)}
            >
                <Plus color="#fff" size={24} />
            </TouchableOpacity>

            {/* Menu Overlay */}
            {isMenuVisible && (
                <View style={[styles.menu, { backgroundColor: theme.card }]}>
                    <TouchableOpacity style={styles.menuItem} onPress={handleUploadDocument}>
                        <FileText color={theme.text} size={20} />
                        <Text style={[styles.menuText, { color: theme.text }]}>Upload Document</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem} onPress={() => {
                        setNewFolderModalVisible(true);
                        setIsMenuVisible(false);
                    }}>
                        <FolderPlus color={theme.text} size={20} />
                        <Text style={[styles.menuText, { color: theme.text }]}>New Folder</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Create Folder Modal */}
            <Modal visible={newFolderModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>New Folder</Text>
                        <TextInput
                            style={[styles.folderInput, { borderColor: theme.border, color: theme.text }]}
                            placeholder="Folder Name"
                            value={newFolderName}
                            onChangeText={setNewFolderName}
                            placeholderTextColor={theme.textSecondary}
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setNewFolderModalVisible(false)}>
                                <Text style={[styles.modalButton, { color: theme.textSecondary }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleCreateFolder}>
                                <Text style={[styles.modalButton, { color: theme.tint }]}>Create</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 16,
    },
    titleRow: {
        height: 40,
        justifyContent: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backText: {
        fontSize: 18,
        fontWeight: '600',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
    },
    filtersWrapper: {
        marginBottom: 8,
    },
    filters: {
        paddingHorizontal: 16,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    grid: {
        padding: 16,
        paddingBottom: 100,
    },
    columnWrapper: {
        justifyContent: 'flex-start',
        gap: 16,
    },
    folderCard: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        aspectRatio: 1,
        gap: 8,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    folderName: {
        fontWeight: '700',
        textAlign: 'center',
        fontSize: 14,
    },
    fileCard: {
        flex: 1,
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    thumbnail: {
        width: '100%',
        height: 140,
        resizeMode: 'cover',
    },
    iconPlaceholder: {
        width: '100%',
        height: 140,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
    fileInfo: {
        padding: 12,
    },
    fileName: {
        fontSize: 14,
        fontWeight: '600',
    },
    fileDate: {
        fontSize: 12,
        marginTop: 4,
    },
    fab: {
        position: 'absolute',
        right: 24,
        bottom: 24,
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 10,
    },
    menu: {
        position: 'absolute',
        right: 24,
        bottom: 100,
        borderRadius: 20,
        padding: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 12,
        minWidth: 200,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    menuText: {
        fontSize: 16,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalContent: {
        width: '85%',
        padding: 24,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    folderInput: {
        borderWidth: 1.5,
        borderRadius: 12,
        padding: 14,
        marginBottom: 24,
        fontSize: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 32,
    },
    modalButton: {
        fontSize: 16,
        fontWeight: '700',
    },
});
