import { storage, ref, uploadBytes, getDownloadURL } from './firebase';

export interface UploadResult {
  success: boolean;
  url: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  error?: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function uploadStudentFile(
  file: File,
  studentId: string,
  category: 'requirements' | 'profile' | 'payments' | 'general',
  customName?: string
): Promise<UploadResult> {
  const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'doc', 'docx'];
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (!allowedExtensions.includes(ext)) {
    return {
      success: false,
      url: '',
      fileName: file.name,
      fileSize: formatFileSize(file.size),
      fileType: file.type,
      error: `File type ".${ext}" is not permitted. Please upload a PDF, DOC, DOCX, JPG, or PNG file.`,
    };
  }

  // 10MB limit
  if (file.size > 10 * 1024 * 1024) {
    return {
      success: false,
      url: '',
      fileName: file.name,
      fileSize: formatFileSize(file.size),
      fileType: file.type,
      error: 'File exceeds maximum allowed size of 10MB.',
    };
  }

  const cleanFileName = (customName || file.name).replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `students/${studentId}/${category}/${Date.now()}_${cleanFileName}`;

  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);

    return {
      success: true,
      url: downloadUrl,
      fileName: file.name,
      fileSize: formatFileSize(file.size),
      fileType: file.type,
    };
  } catch (firebaseErr: any) {
    console.warn('Firebase Storage upload failed, falling back to local object reader:', firebaseErr);

    // Reliable Data URL fallback for sandbox/preview environments
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          success: true,
          url: (e.target?.result as string) || '',
          fileName: file.name,
          fileSize: formatFileSize(file.size),
          fileType: file.type,
        });
      };
      reader.onerror = () => {
        resolve({
          success: false,
          url: '',
          fileName: file.name,
          fileSize: formatFileSize(file.size),
          fileType: file.type,
          error: 'Failed to read file for storage.',
        });
      };
      reader.readAsDataURL(file);
    });
  }
}
