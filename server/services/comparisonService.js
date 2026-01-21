import Tesseract from 'tesseract.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCREENSHOTS_DIR = path.join(__dirname, '../../screenshots');

/**
 * Extract text from an image using OCR
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<string>} Extracted text
 */
async function extractTextFromImage(imagePath) {
  try {
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`);
    }

    console.log('Starting OCR for:', imagePath);
    const { data: { text } } = await Tesseract.recognize(imagePath, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });

    return text.trim();
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw error;
  }
}

/**
 * Compare two screenshots using OCR
 * @param {string} beforeImagePath - Path to the "before" screenshot
 * @param {string} afterImagePath - Path to the "after" screenshot
 * @returns {Promise<Object>} Comparison results
 */
export async function compareScreenshots(beforeImagePath, afterImagePath) {
  try {
    console.log('Starting screenshot comparison...');
    console.log('Before image:', beforeImagePath);
    console.log('After image:', afterImagePath);

    // Extract text from both images
    const [beforeText, afterText] = await Promise.all([
      extractTextFromImage(beforeImagePath),
      extractTextFromImage(afterImagePath)
    ]);

    // Normalize text for comparison (remove extra whitespace, convert to lowercase)
    const normalizeText = (text) => {
      return text
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
    };

    const normalizedBefore = normalizeText(beforeText);
    const normalizedAfter = normalizeText(afterText);

    // Calculate similarity (simple word-based comparison)
    const beforeWords = normalizedBefore.split(/\s+/).filter(w => w.length > 0);
    const afterWords = normalizedAfter.split(/\s+/).filter(w => w.length > 0);
    
    const beforeWordSet = new Set(beforeWords);
    const afterWordSet = new Set(afterWords);

    // Find words that were added, removed, or unchanged
    const addedWords = [...afterWordSet].filter(w => !beforeWordSet.has(w));
    const removedWords = [...beforeWordSet].filter(w => !afterWordSet.has(w));
    const commonWords = [...beforeWordSet].filter(w => afterWordSet.has(w));

    // Calculate similarity percentage
    const totalUniqueWords = new Set([...beforeWords, ...afterWords]).size;
    const similarityPercentage = totalUniqueWords > 0 
      ? (commonWords.length / totalUniqueWords) * 100 
      : 100;

    // Find differences in text blocks (line by line comparison)
    const beforeLines = beforeText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const afterLines = afterText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    const addedLines = afterLines.filter(line => !beforeLines.some(bLine => 
      normalizeText(bLine) === normalizeText(line)
    ));
    const removedLines = beforeLines.filter(line => !afterLines.some(aLine => 
      normalizeText(aLine) === normalizeText(line)
    ));

    return {
      similarity: Math.round(similarityPercentage * 100) / 100,
      beforeText: beforeText,
      afterText: afterText,
      beforeWordCount: beforeWords.length,
      afterWordCount: afterWords.length,
      commonWordCount: commonWords.length,
      addedWords: addedWords.slice(0, 50), // Limit to first 50
      removedWords: removedWords.slice(0, 50), // Limit to first 50
      addedLines: addedLines.slice(0, 20), // Limit to first 20
      removedLines: removedLines.slice(0, 20), // Limit to first 20
      comparedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error comparing screenshots:', error);
    throw error;
  }
}

/**
 * Compare screenshots for a specific record (before vs after)
 * @param {string} objectApiName - Object API name
 * @param {string} recordId - Record ID
 * @returns {Promise<Object>} Comparison results
 */
export async function compareRecordScreenshots(objectApiName, recordId) {
  const beforeImagePath = path.join(SCREENSHOTS_DIR, `${objectApiName}.${recordId}.before.png`);
  const afterImagePath = path.join(SCREENSHOTS_DIR, `${objectApiName}.${recordId}.after.png`);

  if (!fs.existsSync(beforeImagePath)) {
    throw new Error(`Before screenshot not found: ${beforeImagePath}`);
  }

  if (!fs.existsSync(afterImagePath)) {
    throw new Error(`After screenshot not found: ${afterImagePath}`);
  }

  return await compareScreenshots(beforeImagePath, afterImagePath);
}
