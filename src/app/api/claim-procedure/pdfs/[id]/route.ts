import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - Download a specific PDF
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

    // Return the PDF file
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodedFilename}`,
        "Content-Length": pdf.fileSize.toString(),
      },
    });
  } catch (error) {
    console.error("Error downloading PDF:", error);
    return NextResponse.json(
      { error: "Failed to download PDF" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a PDF
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.claimProcedurePDF.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "PDF deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting PDF:", error);
    return NextResponse.json(
      { error: "Failed to delete PDF" },
      { status: 500 }
    );
  }
}
