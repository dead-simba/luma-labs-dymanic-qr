import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { shortCode, destinationUrl } = body;

        const link = await prisma.link.update({
            where: { id },
            data: { shortCode, destinationUrl },
        });

        return NextResponse.json(link);
    } catch (err) {
        return NextResponse.json({ error: "Failed to update link" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.link.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: "Failed to delete link" }, { status: 500 });
    }
}
