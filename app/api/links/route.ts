import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const links = await prisma.link.findMany({
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(links);
    } catch (err) {
        return NextResponse.json({ error: "Failed to fetch links" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { shortCode, destinationUrl } = body;

        const link = await prisma.link.create({
            data: {
                shortCode,
                destinationUrl,
            },
        });

        return NextResponse.json(link);
    } catch (err) {
        return NextResponse.json({ error: "Failed to create link" }, { status: 500 });
    }
}
