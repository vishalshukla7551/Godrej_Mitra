import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - List all PDFs (including inactive ones for admin)
export async function GET() {
  try {
    const pdfs = await prisma.claimProcedurePDF.findMany({
      orderBy: { uploadedAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        fileName: true,
        fileSize: true,
        category: true,
        isActive: true,
        uploadedAt: true,
      },
    });

    return NextResponse.json(pdfs);
  } catch (error) {
    console.error("Error fetching PDFs:", error);
    return NextResponse.json(
      { error: "Failed to fetch PDFs" },
      { status: 500 }
    );
  }
}
