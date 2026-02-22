import { createWorker } from 'tesseract.js';

export const extractTextFromImage = async (imageSrc: string): Promise<string> => {
    try {
        console.log('Initiating OCR for:', imageSrc);
        const worker = await createWorker('eng', 1, {
            logger: m => console.log('OCR Progress:', m.status, Math.round(m.progress * 100) + '%'),
        });

        // Use recognize with specific options if needed
        const ret = await worker.recognize(imageSrc);
        await worker.terminate();

        const cleanText = ret.data.text.trim();
        console.log('OCR Completed. Extracted length:', cleanText.length);
        return cleanText;
    } catch (error) {
        console.error('OCR Fatal Error:', error);
        return '';
    }
};
