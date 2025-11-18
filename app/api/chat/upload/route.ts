import { currentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";

export async function POST(request: Request) {
    try {
        const user = await currentUser();
        if (!user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return new NextResponse("No file provided", { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadsDir = path.join(process.cwd(), "public", "uploads", "chat");
        if (!existsSync(uploadsDir)) {
            mkdirSync(uploadsDir, { recursive: true });
        }

        const filename = `chat-${Date.now()}-${file.name}`;
        const filepath = path.join(uploadsDir, filename);
        writeFileSync(filepath, buffer);

        const imageUrl = `/uploads/chat/${filename}`;

        return NextResponse.json({ imageUrl });
    } catch (error) {
        console.error('Upload error:', error);
        return new NextResponse("Internal error", { status: 500 });
    }
}