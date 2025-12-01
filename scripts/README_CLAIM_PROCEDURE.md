# Claim Procedure PDF Management Script

This script allows you to import, export, list, and delete PDF files for the SEC Claim Procedure page.

## Prerequisites

1. Make sure your database is set up and Prisma is configured
2. Run Prisma migrations to create the `ClaimProcedurePDF` table:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

## Usage

### 1. Import a PDF

Import a PDF file into the database:

```bash
npx ts-node scripts/importClaimProcedurePDF.ts import <file-path> <title> [description] [category]
```

**Example:**
```bash
npx ts-node scripts/importClaimProcedurePDF.ts import ./documents/claim-guide.pdf "Claim Procedure Guide" "Step by step guide for submitting claims" "GUIDE"
```

**Parameters:**
- `file-path` (required): Path to the PDF file
- `title` (required): Title of the document
- `description` (optional): Description of the document
- `category` (optional): Category (e.g., GUIDE, FORM, POLICY). Default: GENERAL

### 2. List All PDFs

View all PDFs stored in the database:

```bash
npx ts-node scripts/importClaimProcedurePDF.ts list
```

This will display:
- PDF ID
- Title
- File name
- File size
- Category
- Active status
- Upload date

### 3. Export a PDF

Export a PDF from the database to a file:

```bash
npx ts-node scripts/importClaimProcedurePDF.ts export <pdf-id> <output-path>
```

**Example:**
```bash
npx ts-node scripts/importClaimProcedurePDF.ts export 507f1f77bcf86cd799439011 ./exported-claim-guide.pdf
```

**Parameters:**
- `pdf-id` (required): The ID of the PDF (get this from the `list` command)
- `output-path` (required): Where to save the exported PDF file

### 4. Delete a PDF

Remove a PDF from the database:

```bash
npx ts-node scripts/importClaimProcedurePDF.ts delete <pdf-id>
```

**Example:**
```bash
npx ts-node scripts/importClaimProcedurePDF.ts delete 507f1f77bcf86cd799439011
```

## Common Workflows

### Initial Setup - Import Multiple PDFs

```bash
# Import claim submission guide
npx ts-node scripts/importClaimProcedurePDF.ts import ./docs/claim-submission-guide.pdf "Claim Submission Guide" "Complete guide for submitting claims" "GUIDE"

# Import claim form
npx ts-node scripts/importClaimProcedurePDF.ts import ./docs/claim-form.pdf "Claim Form Template" "Fillable claim form template" "FORM"

# Import policy document
npx ts-node scripts/importClaimProcedurePDF.ts import ./docs/claim-policy.pdf "Claim Policy" "Official claim policy document" "POLICY"
```

### View All Documents

```bash
npx ts-node scripts/importClaimProcedurePDF.ts list
```

### Backup a PDF

```bash
# First, list to get the PDF ID
npx ts-node scripts/importClaimProcedurePDF.ts list

# Then export using the ID
npx ts-node scripts/importClaimProcedurePDF.ts export 507f1f77bcf86cd799439011 ./backup/claim-guide-backup.pdf
```

## Categories

Suggested categories for organizing PDFs:
- `GUIDE` - Step-by-step guides and tutorials
- `FORM` - Fillable forms and templates
- `POLICY` - Policy documents and terms
- `FAQ` - Frequently asked questions
- `GENERAL` - General documents (default)

## Notes

- PDFs are stored as base64-encoded strings in the database
- For production, consider using cloud storage (S3, Azure Blob, etc.) instead of database storage
- Large PDFs may impact database performance
- The script automatically checks if files exist before importing
- All timestamps are in UTC

## Troubleshooting

### "File not found" error
Make sure the file path is correct and the file exists.

### "PDF record not found" error
Check the PDF ID using the `list` command.

### Database connection errors
Verify your `DATABASE_URL` in `.env` file is correct.

## API Endpoints

The claim procedure page uses these API endpoints:

- `GET /api/claim-procedure/pdfs` - List all active PDFs
- `GET /api/claim-procedure/pdfs/[id]` - Download a specific PDF

## Page Location

The claim procedure page is available at:
- URL: `http://localhost:3000/SEC/claim-procedure`
- File: `src/app/SEC/claim-procedure/page.tsx`
