import React, { useState, useEffect } from 'react';
import { MessageSquare, Trash2, Plus, CheckCircle2, Circle, Edit3, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './MessageBoard.css';

interface Message {
    id: string;
    title?: string;
    text: string;
    timestamp: string;
    isTodo: boolean;
    isCompleted: boolean;
}

const MessageBoard: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputTitle, setInputTitle] = useState('');
    const [inputText, setInputText] = useState('');
    const [isTodo, setIsTodo] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('user_messages');
        if (saved) setMessages(JSON.parse(saved));
    }, []);

    const saveMessages = (newMessages: Message[]) => {
        setMessages(newMessages);
        localStorage.setItem('user_messages', JSON.stringify(newMessages));
    };

    const handleSubmit = () => {
        if (!inputText.trim()) return;

        if (editingId) {
            const updated = messages.map(m =>
                m.id === editingId ? { ...m, title: inputTitle, text: inputText, isTodo } : m
            );
            saveMessages(updated);
            setEditingId(null);
        } else {
            const newMessage: Message = {
                id: Date.now().toString(),
                title: inputTitle,
                text: inputText,
                timestamp: new Date().toISOString(),
                isTodo,
                isCompleted: false
            };
            saveMessages([newMessage, ...messages]);
        }

        setInputTitle('');
        setInputText('');
        setIsTodo(false);
    };

    const startEdit = (msg: Message) => {
        setEditingId(msg.id);
        setInputTitle(msg.title || '');
        setInputText(msg.text);
        setIsTodo(msg.isTodo);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setInputTitle('');
        setInputText('');
        setIsTodo(false);
    };

    const toggleComplete = (id: string) => {
        const updated = messages.map(m =>
            m.id === id ? { ...m, isCompleted: !m.isCompleted } : m
        );
        saveMessages(updated);
    };

    const deleteMessage = (id: string) => {
        saveMessages(messages.filter(m => m.id !== id));
    };

    return (
        <div className="message-board">
            <div className="message-header">
                <div className="header-title-row">
                    <MessageSquare size={28} className="accent-icon" />
                    <h2>Personal Notes & To-Dos</h2>
                </div>
                <p>Organize your thoughts and tasks with a Google Keep style interface</p>
            </div>

            <div className={`message-input-area ${editingId ? 'editing-mode' : ''}`}>
                <input
                    type="text"
                    placeholder="Title (Optional)"
                    className="title-input"
                    value={inputTitle}
                    onChange={(e) => setInputTitle(e.target.value)}
                />
                <textarea
                    placeholder="Take a note..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                />
                <div className="input-options">
                    <label className="checkbox-toggle">
                        <input
                            type="checkbox"
                            checked={isTodo}
                            onChange={(e) => setIsTodo(e.target.checked)}
                        />
                        <span>Treat as Checklist</span>
                    </label>
                    <div className="input-actions">
                        {editingId && (
                            <button className="cancel-edit-btn" onClick={cancelEdit}>
                                <X size={18} /> Cancel
                            </button>
                        )}
                        <button className="save-btn" onClick={handleSubmit}>
                            {editingId ? <Check size={18} /> : <Plus size={18} />}
                            {editingId ? ' Update Note' : ' Add Note'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="messages-list">
                <AnimatePresence>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            className={`message-card ${msg.isCompleted ? 'completed' : ''}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            layout
                        >
                            <div className="message-body">
                                {msg.isTodo && (
                                    <button
                                        className="checkbox-btn"
                                        onClick={() => toggleComplete(msg.id)}
                                    >
                                        {msg.isCompleted ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                                    </button>
                                )}
                                <div className="text-content">
                                    {msg.title && <h3 className="msg-title">{msg.title}</h3>}
                                    <div className="msg-text">{msg.text}</div>
                                </div>
                            </div>

                            <div className="message-footer">
                                <span className="message-date">
                                    {new Date(msg.timestamp).toLocaleDateString()}
                                </span>
                                <div className="message-actions">
                                    <button onClick={() => startEdit(msg)} title="Edit Note">
                                        <Edit3 size={16} />
                                    </button>
                                    <button onClick={() => deleteMessage(msg.id)} className="delete-btn" title="Delete">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {messages.length === 0 && (
                    <div className="empty-messages">
                        <p>Your notes will appear here. Start typing above!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageBoard;
