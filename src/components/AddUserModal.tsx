import React, { useState, useRef } from 'react';
import { storageService } from '../services/storageService';

interface AddUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (imageUrls: string[]) => Promise<void>;
    isLoading: boolean;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onConfirm, isLoading }) => {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            const updatedFiles = [...selectedFiles, ...newFiles].slice(0, 6);
            setSelectedFiles(updatedFiles);

            // Generate previews
            const newPreviews = updatedFiles.map(file => URL.createObjectURL(file));
            setPreviews(newPreviews);
        }
    };

    const removeFile = (index: number) => {
        const updatedFiles = selectedFiles.filter((_, i) => i !== index);
        setSelectedFiles(updatedFiles);

        // Cleanup old preview URL to prevent memory leaks
        URL.revokeObjectURL(previews[index]);
        const updatedPreviews = previews.filter((_, i) => i !== index);
        setPreviews(updatedPreviews);
    };

    const handleCreate = async () => {
        if (selectedFiles.length !== 6) {
            alert('Please select exactly 6 images.');
            return;
        }

        setIsUploading(true);
        try {
            // Upload all images
            const uploadPromises = selectedFiles.map(file => storageService.uploadTestUserImage(file));
            const imageUrls = await Promise.all(uploadPromises);

            // Pass URLs to the confirmation function (createTestUser)
            await onConfirm(imageUrls);

            // Clear state and close
            setSelectedFiles([]);
            setPreviews([]);
            onClose();
        } catch (error) {
            console.error('Error in upload/create flow:', error);
            alert('Failed to upload images or create user. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal} className="glass-card animate-zoom-in">
                <div style={styles.header}>
                    <h2 style={styles.title}>Add New Test User</h2>
                    <button onClick={onClose} style={styles.closeBtn}>&times;</button>
                </div>

                <div style={styles.content}>
                    <div style={styles.infoRow}>
                        <p style={styles.description}>
                            Select exactly 6 images for the new profile.
                        </p>
                        <span style={{
                            ...styles.counter,
                            color: selectedFiles.length === 6 ? '#10b981' : '#ef4444'
                        }}>
                            {selectedFiles.length} / 6
                        </span>
                    </div>

                    <div style={styles.grid}>
                        {previews.map((url, index) => (
                            <div key={index} style={styles.previewContainer}>
                                <img src={url} alt={`Preview ${index + 1}`} style={styles.previewImage} />
                                <button onClick={() => removeFile(index)} style={styles.removeBtn}>&times;</button>
                            </div>
                        ))}

                        {selectedFiles.length < 6 && (
                            <div
                                style={styles.uploadPlaceholder}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div style={styles.plusIcon}>+</div>
                                <div style={styles.uploadText}>Upload Image</div>
                            </div>
                        )}
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        multiple
                        accept="image/*"
                        style={{ display: 'none' }}
                    />
                </div>

                <div style={styles.footer}>
                    <button
                        style={styles.cancelBtn}
                        onClick={onClose}
                        disabled={isUploading || isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        style={{ ...styles.createBtn, opacity: (isUploading || isLoading || selectedFiles.length !== 6) ? 0.6 : 1 }}
                        onClick={handleCreate}
                        disabled={isUploading || isLoading || selectedFiles.length !== 6}
                    >
                        {(isUploading || isLoading) ? 'Processing...' : 'Create User'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    modal: {
        width: '90%',
        maxWidth: '600px',
        backgroundColor: 'white',
        borderRadius: '24px',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        margin: 0,
        fontSize: '1.5rem',
        fontWeight: 700,
        color: '#1a1d29',
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        fontSize: '2rem',
        color: '#6b7280',
        cursor: 'pointer',
        padding: 0,
        lineHeight: 1,
    },
    content: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
    },
    infoRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    counter: {
        fontSize: '0.85rem',
        fontWeight: 700,
        padding: '4px 12px',
        borderRadius: '20px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #e5e7eb',
    },
    description: {
        margin: 0,
        color: '#6b7280',
        fontSize: '0.95rem',
        lineHeight: '1.5',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem',
    },
    previewContainer: {
        aspectRatio: '1',
        borderRadius: '16px',
        overflow: 'hidden',
        position: 'relative',
        border: '1px solid #e5e7eb',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    removeBtn: {
        position: 'absolute',
        top: '8px',
        right: '8px',
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        color: 'white',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: '14px',
    },
    uploadPlaceholder: {
        aspectRatio: '1',
        borderRadius: '16px',
        border: '2px dashed #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: '#94a3b8',
        transition: 'all 0.2s',
    },
    plusIcon: {
        fontSize: '24px',
        marginBottom: '4px',
    },
    uploadText: {
        fontSize: '0.75rem',
        fontWeight: 600,
    },
    footer: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '1rem',
        marginTop: '1rem',
    },
    cancelBtn: {
        padding: '0.75rem 1.5rem',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        backgroundColor: 'white',
        color: '#1a1d29',
        fontWeight: 600,
        cursor: 'pointer',
    },
    createBtn: {
        padding: '0.75rem 2rem',
        borderRadius: '12px',
        border: 'none',
        background: 'linear-gradient(135deg, #FF6DD9, #8336C7)',
        color: 'white',
        fontWeight: 700,
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(131, 54, 199, 0.2)',
    },
};

export default AddUserModal;
