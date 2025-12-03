import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface PDFImportOptions {
  filePath: string;
  title: string;
  description?: string;
  category?: string;
}

/**
 * Script to import PDF files for SEC Claim Procedure
 * Usage: npx ts-node scripts/importClaimProcedurePDF.ts
 */
async function importPDF(options: PDFImportOptions) {
  try {
    const { filePath, title, description, category } = options;

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Read the PDF file
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    const fileSize = fs.statSync(filePath).size;

    // Convert to base64 for storage (or you can use a file storage service)
    const base64Data = fileBuffer.toString('base64');

    // Store in database
    const pdfRecord = await prisma.claimProcedurePDF.create({
      data: {
        title,
        description: description || '',
        fileName,
        fileSize,
        fileData: base64Data,
        category: category || 'GENERAL',
        uploadedAt: new Date(),
        isActive: true,
      },
    });

    console.log('✅ PDF imported successfully!');
    console.log('Record ID:', pdfRecord.id);
    console.log('Title:', pdfRecord.title);
    console.log('File Name:', pdfRecord.fileName);
    console.log('File Size:', `${(fileSize / 1024).toFixed(2)} KB`);

    return pdfRecord;
  } catch (error) {
    console.error('❌ Error importing PDF:', error);
    throw error;
  }
}

/**
 * Export PDF from database to file system
 */
async function exportPDF(pdfId: string, outputPath: string) {
  try {
    const pdfRecord = await prisma.claimProcedurePDF.findUnique({
      where: { id: pdfId },
    });

    if (!pdfRecord) {
      throw new Error(`PDF record not found with ID: ${pdfId}`);
    }

    // Convert base64 back to buffer
    const fileBuffer = Buffer.from(pdfRecord.fileData, 'base64');

    // Write to file
    fs.writeFileSync(outputPath, fileBuffer);

    console.log('✅ PDF exported successfully!');
    console.log('Output Path:', outputPath);
    console.log('File Size:', `${(pdfRecord.fileSize / 1024).toFixed(2)} KB`);

    return outputPath;
  } catch (error) {
    console.error('❌ Error exporting PDF:', error);
    throw error;
  }
}

/**
 * List all PDFs in the database
 */
async function listPDFs() {
  try {
    const pdfs = await prisma.claimProcedurePDF.findMany({
      orderBy: { uploadedAt: 'desc' },
    });

    console.log(`\n📄 Found ${pdfs.length} PDF(s):\n`);
    pdfs.forEach((pdf, index) => {
      console.log(`${index + 1}. ${pdf.title}`);
      console.log(`   ID: ${pdf.id}`);
      console.log(`   File: ${pdf.fileName}`);
      console.log(`   Size: ${(pdf.fileSize / 1024).toFixed(2)} KB`);
      console.log(`   Category: ${pdf.category}`);
      console.log(`   Active: ${pdf.isActive ? '✓' : '✗'}`);
      console.log(`   Uploaded: ${pdf.uploadedAt.toLocaleDateString()}\n`);
    });

    return pdfs;
  } catch (error) {
    console.error('❌ Error listing PDFs:', error);
    throw error;
  }
}

/**
 * Delete a PDF from the database
 */
async function deletePDF(pdfId: string) {
  try {
    await prisma.claimProcedurePDF.delete({
      where: { id: pdfId },
    });

    console.log('✅ PDF deleted successfully!');
    console.log('Deleted ID:', pdfId);
  } catch (error) {
    console.error('❌ Error deleting PDF:', error);
    throw error;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'import':
        if (args.length < 3) {
          console.log('Usage: npx ts-node scripts/importClaimProcedurePDF.ts import <file-path> <title> [description] [category]');
          process.exit(1);
        }
        await importPDF({
          filePath: args[1],
          title: args[2],
          description: args[3],
          category: args[4],
        });
        break;

      case 'export':
        if (args.length < 3) {
          console.log('Usage: npx ts-node scripts/importClaimProcedurePDF.ts export <pdf-id> <output-path>');
          process.exit(1);
        }
        await exportPDF(args[1], args[2]);
        break;

      case 'list':
        await listPDFs();
        break;

      case 'delete':
        if (args.length < 2) {
          console.log('Usage: npx ts-node scripts/importClaimProcedurePDF.ts delete <pdf-id>');
          process.exit(1);
        }
        await deletePDF(args[1]);
        break;

      default:
        console.log('Available commands:');
        console.log('  import <file-path> <title> [description] [category] - Import a PDF file');
        console.log('  export <pdf-id> <output-path>                       - Export a PDF file');
        console.log('  list                                                 - List all PDFs');
        console.log('  delete <pdf-id>                                      - Delete a PDF');
        console.log('\nExample:');
        console.log('  npx ts-node scripts/importClaimProcedurePDF.ts import ./claim-guide.pdf "Claim Procedure Guide" "Step by step guide" "GUIDE"');
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
