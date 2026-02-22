import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "edge";

const sql = neon(process.env.DATABASE_URL || "");

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ shortCode: string }> }
) {
    const { shortCode } = await params;

    try {
        // 1. Fetch the destination URL from Neon
        // Note: We use raw SQL here for maximum performance on the edge
        const links = await sql`
      SELECT "destinationUrl" 
      FROM "Link" 
      WHERE "shortCode" = ${shortCode} 
      LIMIT 1
    `;

        const link = links[0];

        // Fallback if not found
        if (!link) {
            return NextResponse.redirect("https://lumalabs.pk");
        }

        // 2. Prepare the destination URL and preserve incoming UTMs
        const targetUrl = new URL(link.destinationUrl);
        const incomingParams = request.nextUrl.searchParams;

        incomingParams.forEach((value, key) => {
            targetUrl.searchParams.set(key, value);
        });

        // 3. Increment scan_count asynchronously (fire and forget)
        // We use a background promise to avoid blocking the redirect response
        (async () => {
            await sql`
        UPDATE "Link" 
        SET "scanCount" = "scanCount" + 1 
        WHERE "shortCode" = ${shortCode}
      `;
        })().catch(err => console.error("Failed to increment scan count:", err));

        // 4. Return 302 Redirect (Found)
        return NextResponse.redirect(targetUrl.toString(), 302);

    } catch (err) {
        console.error("Critical redirect error:", err);
        return NextResponse.redirect("https://lumalabs.pk");
    }
}
