import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

export const storageService = {
    /**
     * Uploads an image to Firebase Storage in the 'delete_later_images' folder.
     * @param file The image file to upload.
     * @returns A promise that resolves to the download URL of the uploaded image.
     */
    async uploadTestUserImage(file: File): Promise<string> {
        try {
            // Create a unique filename
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(2, 8);
            const extension = file.name.split('.').pop() || 'jpg';
            const fileName = `${timestamp}_${randomString}.${extension}`;

            const storageRef = ref(storage, `delete_later_images/${fileName}`);

            // Upload the file
            const snapshot = await uploadBytes(storageRef, file);

            // Get the download URL
            const downloadURL = await getDownloadURL(snapshot.ref);

            return downloadURL;
        } catch (error) {
            console.error('Error uploading image to Firebase Storage:', error);
            throw error;
        }
    }
};
