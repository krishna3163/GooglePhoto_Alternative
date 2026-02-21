import { saveOCRText } from '../database/db';

export const extractTextFromImage = async (imageUri: string): Promise<string> => {
    try {
        // Try to dynamically require the native module if available
        let TextRecognition: any = null;
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            TextRecognition = require('react-native-text-recognition');
        } catch (e) {
            TextRecognition = null;
        }

        if (!TextRecognition) {
            console.warn('react-native-text-recognition not available in this environment');
            return '';
        }

        const result = await TextRecognition.recognize(imageUri);
        const text = result ? result.join(' ') : '';
        if (text) {
            await saveOCRText(imageUri, text);
        }
        return text;
    } catch (error) {
        console.warn('OCR Failed or not supported in this environment:', error);
        return '';
    }
};
