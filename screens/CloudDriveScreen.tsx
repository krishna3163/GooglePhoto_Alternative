import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, useColorScheme, ActivityIndicator, TextInput, Modal } from 'react-native';
import { Colors } from '../constants/Colors';
import { getUploadedFiles, createFolder, getFolders, addFileToFolder, getFilesByFolder, saveUploadedFile } from '../database/db';
import { Folder, Video, FileText, Image as ImageIcon, Plus, MoreVertical, Search, Download, Trash2, FolderPlus } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { uploadFileToTelegram } from '../services/telegramService';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { getFileDownloadUrl } from '../services/telegramService';
import { useRouter } from 'expo-router';

export default function CloudDriveScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const router = useRouter();

    const [files, setFiles] = useState<any[]>([]);
    const [folders, setFolders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [currentFolder, setCurrentFolder] = useState<number | null>(null);
    const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'document'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [newFolderModalVisible, setNewFolderModalVisible] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    useEffect(() => {
        loadContent();
    }, [currentFolder, filter]);

    const loadContent = async () => {
        setLoading(true);
        try {
            if (currentFolder) {
                const folderFiles = await getFilesByFolder(currentFolder);
                setFiles(folderFiles);
                setFolders([]); // Don't show nested folders for simplicity in this version
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
            const localUri = FileSystem.documentDirectory + file.fileName;

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
        // Need to stringify params if complex or just pass IDs
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
                style={[styles.fileCard, { backgroundColor: theme.card }]}
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
            style={[styles.folderCard, { backgroundColor: theme.card }]}
            onPress={() => setCurrentFolder(item.id)}
        >
            <Folder color={theme.tint} size={40} />
            <Text style={[styles.folderName, { color: theme.text }]}>{item.name}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={styles.header}>
                {currentFolder ? (
                    <TouchableOpacity onPress={() => setCurrentFolder(null)}>
                        <Text style={[styles.backText, { color: theme.tint }]}>&lt; Back</Text>
                    </TouchableOpacity>
                ) : (
                    <Text style={[styles.title, { color: theme.text }]}>Cloud Drive</Text>
                )}
                <View style={styles.searchContainer}>
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
            <View style={styles.filters}>
                {['all', 'image', 'video', 'document'].map(f => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterChip, filter === f && { backgroundColor: theme.tint }]}
                        onPress={() => setFilter(f as any)}
                    >
                        <Text style={[styles.filterText, filter === f && { color: '#fff' }]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Content */}
            {loading ? (
                <ActivityIndicator style={{ marginTop: 20 }} color={theme.tint} />
            ) : (
                <FlatList
                    data={[...folders, ...files]}
                    keyExtractor={(item, index) => (item.fileUri ? 'file-' : 'folder-') + item.id + index}
                    renderItem={({ item }) => item.fileUri ? renderFileItem({ item }) : renderFolderItem({ item })}
                    numColumns={2}
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
                    <TouchableOpacity style={styles.menuItem} onPress={() => setNewFolderModalVisible(true)}>
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

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    backText: {
        fontSize: 18,
        marginBottom: 12,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
    },
    filters: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 12,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    filterText: {
        fontSize: 14,
        fontWeight: '500',
    },
    grid: {
        padding: 16,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    folderCard: {
        width: '48%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        aspectRatio: 1.2,
        gap: 8,
    },
    folderName: {
        fontWeight: '600',
        textAlign: 'center',
    },
    fileCard: {
        width: '48%',
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
    },
    thumbnail: {
        width: '100%',
        height: 120,
        resizeMode: 'cover',
    },
    iconPlaceholder: {
        width: '100%',
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    fileInfo: {
        padding: 8,
    },
    fileName: {
        fontSize: 14,
        fontWeight: '500',
    },
    fileDate: {
        fontSize: 12,
        marginTop: 2,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    menu: {
        position: 'absolute',
        right: 20,
        bottom: 90,
        borderRadius: 12,
        padding: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        minWidth: 180,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 12,
    },
    menuText: {
        fontSize: 16,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalContent: {
        width: '80%',
        padding: 24,
        borderRadius: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    folderInput: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginBottom: 24,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 24,
    },
    modalButton: {
        fontSize: 16,
        fontWeight: '600',
    },
});
