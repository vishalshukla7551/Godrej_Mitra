import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST - Upload a new PDF (replaces all existing PDFs)
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;

    if (!file || !title) {
      return NextResponse.json(
        { error: "File and title are required" },
        { status: 400 }
      );
    }

    // Check if file is PDF
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    // Convert file to buffer and then to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString("base64");

    // Delete ALL existing PDFs before uploading new one
    await prisma.claimProcedurePDF.deleteMany({});

    // Store the new PDF in database
    const pdfRecord = await prisma.claimProcedurePDF.create({
      data: {
        title,
        description: description || "",
        fileName: file.name,
        fileSize: file.size,
        fileData: base64Data,
        category: category || "GENERAL",
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      id: pdfRecord.id,
      message: "PDF uploaded successfully. Previous PDF has been replaced.",
    });
  } catch (error) {
    console.error("Error uploading PDF:", error);
    return NextResponse.json(
      { error: "Failed to upload PDF" },
      { status: 500 }
    );
  }
}
