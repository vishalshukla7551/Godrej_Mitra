import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// PATCH - Toggle PDF active status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { isActive } = await request.json();

    const pdf = await prisma.claimProcedurePDF.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json({
      success: true,
      isActive: pdf.isActive,
    });
  } catch (error) {
    console.error("Error toggling PDF status:", error);
    return NextResponse.json(
      { error: "Failed to update PDF status" },
      { status: 500 }
    );
  }
}
