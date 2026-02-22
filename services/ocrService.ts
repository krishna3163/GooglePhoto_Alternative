
import { saveOCRText } from '../database/db';
import TextRecognition from '@react-native-ml-kit/text-recognition';

export const extractTextFromImage = async (imageUri: string): Promise<string> => {
    try {
        const result = await TextRecognition.recognize(imageUri);
        const text = result.text;
        if (text) {
            await saveOCRText(imageUri, text);
        }
        return text;
    } catch (error) {
        console.warn('OCR Failed or not supported in this environment:', error);
        return '';
    }
};
