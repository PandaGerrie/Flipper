import { NextRequest, NextResponse } from "next/server";
import { isAllowedPdfUrl } from "@/lib/pdf-url";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url || !isAllowedPdfUrl(url)) {
    return NextResponse.json(
      { error: "Provide a valid http(s) PDF URL." },
      { status: 400, headers: corsHeaders },
    );
  }

  try {
    const upstream = await fetch(url, {
      headers: { Accept: "application/pdf,*/*" },
      redirect: "follow",
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { error: `Could not fetch PDF (${upstream.status}).` },
        { status: 502, headers: corsHeaders },
      );
    }

    const contentType = upstream.headers.get("content-type") ?? "";
    if (
      contentType &&
      !contentType.includes("pdf") &&
      !contentType.includes("octet-stream") &&
      !contentType.includes("application/octet-stream")
    ) {
      // Some hosts send text/plain or empty type for PDFs; only reject obvious HTML.
      if (contentType.includes("text/html")) {
        return NextResponse.json(
          { error: "That URL did not return a PDF." },
          { status: 415, headers: corsHeaders },
        );
      }
    }

    const headers = new Headers(corsHeaders);
    headers.set("Content-Type", "application/pdf");
    headers.set("Cache-Control", "public, max-age=300");
    headers.set("Content-Disposition", "inline");

    return new NextResponse(upstream.body, {
      status: 200,
      headers,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to reach the PDF URL." },
      { status: 502, headers: corsHeaders },
    );
  }
}
