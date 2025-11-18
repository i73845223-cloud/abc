import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { deleteUserImage, saveFile } from '@/lib/file-upload';
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

    const { url: filename } = await saveFile(file);

    const existingImage = await db.image.findUnique({
      where: { userId: session.user.id }
    });

    if (existingImage && existingImage.url) {
      await deleteUserImage(existingImage.url);
    }

    const image = await db.image.upsert({
      where: { userId: session.user.id },
      update: { 
        url: filename,
        updatedAt: new Date()
      },
      create: {
        userId: session.user.id,
        url: filename,
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

    if (image && image.url) {
      await deleteUserImage(image.url);
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