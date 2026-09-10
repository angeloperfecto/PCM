import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const storagePath = body.storagePath;
    if (!storagePath || typeof storagePath !== 'string') {
      return NextResponse.json({ success: true, message: 'No file path provided' });
    }

    let relPath = storagePath.replace(/^\//, '');
    if (relPath.startsWith('uploads/')) {
      const fullPath = path.join(process.cwd(), 'public', relPath);
      try {
        await fs.unlink(fullPath);
      } catch {
        // File may have already been removed
      }
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Delete error' }, { status: 500 });
  }
}
