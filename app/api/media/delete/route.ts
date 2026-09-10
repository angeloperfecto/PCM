import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { storagePath, url } = await req.json();
    
    // Target could be storagePath or local URL
    let relativePath = storagePath || url || '';
    if (relativePath.startsWith('/uploads/')) {
      relativePath = relativePath.replace('/uploads/', '');
    }
    if (relativePath.startsWith('uploads/')) {
      relativePath = relativePath.replace('uploads/', '');
    }

    if (relativePath && !relativePath.includes('..')) {
      const fullPath = path.join(process.cwd(), 'public', 'uploads', relativePath);
      try {
        await fs.unlink(fullPath);
      } catch (err: any) {
        if (err.code !== 'ENOENT') {
          console.warn('Error deleting local file:', err.message);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in /api/media/delete:', error);
    return NextResponse.json(
      { error: error.message || 'Delete error' },
      { status: 500 }
    );
  }
}
