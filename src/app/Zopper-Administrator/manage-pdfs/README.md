# Manage Claim Procedure PDFs

This page allows Zopper Administrators to upload, manage, and organize PDF documents for ASA Canvasser claim procedures.

## Features

### 1. Upload PDFs
- Click the "Upload PDF" button in the top right
- Fill in the required information:
  - **Title**: Name of the document (required)
  - **Category**: Choose from GENERAL, GUIDE, FORM, POLICY, or FAQ (required)
  - **Description**: Optional description of the document
  - **PDF File**: Select a PDF file from your computer (required)
- Click "Upload PDF" to save

### 2. View PDFs
- All uploaded PDFs are displayed in a list
- Filter by category using the category buttons
- View PDF details including:
  - Title and description
  - Category and status (Active/Inactive)
  - File name and size
  - Upload date

### 3. Manage PDFs

#### Toggle Active/Inactive
- Click the toggle button (eye icon) to activate or deactivate a PDF
- Inactive PDFs will not be visible to SECs on the claim procedure page
- Useful for temporarily hiding outdated documents

#### Delete PDFs
- Click the delete button (trash icon) to permanently remove a PDF
- Confirmation dialog will appear before deletion
- This action cannot be undone

## Categories

- **GENERAL**: General documents and information
- **GUIDE**: Step-by-step guides and tutorials
- **FORM**: Fillable forms and templates
- **POLICY**: Policy documents and terms
- **FAQ**: Frequently asked questions

## Access

- **Admin URL**: http://localhost:3000/Zopper-Administrator/manage-pdfs
- **ASA Canvasser View**: http://localhost:3000/canvasser/claim-procedure (shows only active PDFs)

## Notes

- Only PDF files are accepted
- File size is displayed in KB
- PDFs are stored securely in the database
- Only active PDFs are visible to SECs
- Administrators can see all PDFs (active and inactive)

## Tips

1. Use clear, descriptive titles for easy identification
2. Add descriptions to provide context about the document
3. Organize PDFs using appropriate categories
4. Deactivate outdated PDFs instead of deleting them (for record keeping)
5. Regularly review and update documents to ensure accuracy
