import { put, head } from '@vercel/blob';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function saveFile(file: File): Promise<{ url: string; filename: string }> {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Invalid file type');
  }

  const arrayBuffer = await file.arrayBuffer();
  
  if (arrayBuffer.byteLength > MAX_FILE_SIZE) {
    throw new Error('File size too large');
  }

  let fileExists = false;
  try {
    await head(file.name);
    fileExists = true;
  } catch (error) {
    fileExists = false;
  }

  const blob = await put(file.name, arrayBuffer, {
    access: 'public',
    addRandomSuffix: true
  });

  return { url: blob.url, filename: blob.url };
}

export async function deleteUserImage(url: string): Promise<void> {
  try {
  } catch (error) {
    console.error('Error in deleteUserImage:', error);
  }
}

export function validateFile(file: File): { isValid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { isValid: false, error: 'Invalid file type' };
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return { isValid: false, error: 'File too large' };
  }

  return { isValid: true };
}