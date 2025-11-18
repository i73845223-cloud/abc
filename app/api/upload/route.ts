import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { saveFile } from '@/lib/file-upload';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const { url } = await saveFile(file);

    const existingImage = await db.image.findUnique({
      where: { userId: session.user.id }
    });

    const image = await db.image.upsert({
      where: { userId: session.user.id },
      update: { 
        url: url,
        updatedAt: new Date()
      },
      create: {
        userId: session.user.id,
        url: url,
      }
    });

    await db.user.update({
      where: { id: session.user.id },
      data: { isImageApproved: 'pending' }
    });

    return NextResponse.json({ 
      success: true, 
      image: {
        id: image.id,
        url: image.url,
        createdAt: image.createdAt,
        updatedAt: image.updatedAt
      }
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const image = await db.image.findUnique({
      where: { userId: session.user.id }
    });

    if (image) {
      await db.image.delete({
        where: { userId: session.user.id }
      });

      await db.user.update({
        where: { id: session.user.id },
        data: { isImageApproved: 'none' }
      });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Delete failed' },
      { status: 500 }
    );
  }
}