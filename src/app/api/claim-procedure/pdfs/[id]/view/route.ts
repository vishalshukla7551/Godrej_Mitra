import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - View a PDF inline (not download)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pdf = await prisma.claimProcedurePDF.findUnique({
      where: { id },
    });

    if (!pdf) {
      return NextResponse.json({ error: "PDF not found" }, { status: 404 });
    }

    // Convert base64 back to buffer
    const fileBuffer = Buffer.from(pdf.fileData, "base64");

    // Encode filename to handle special characters
    const encodedFilename = encodeURIComponent(pdf.fileName);

    // Return the PDF file for inline viewing
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename*=UTF-8''${encodedFilename}`,
        "Content-Length": pdf.fileSize.toString(),
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (error) {
    console.error("Error viewing PDF:", error);
    return NextResponse.json(
      { error: "Failed to view PDF" },
      { status: 500 }
    );
  }
}
