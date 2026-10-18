import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ message: "This test utility is available in development only." }, { status: 404 });
  }
  const backendUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!backendUrl) {
    return NextResponse.json({ message: "Configure NEXT_PUBLIC_BASE_URL in the frontend environment and restart the frontend." }, { status: 503 });
  }
  return NextResponse.json({ backendUrl }, { headers: { "Cache-Control": "no-store" } });
}
