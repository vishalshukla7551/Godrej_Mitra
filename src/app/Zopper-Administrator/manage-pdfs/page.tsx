"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface PDFDocument {
  id: string;
  title: string;
  description: string;
  fileName: string;
  fileSize: number;
  category: string;
  isActive: boolean;
  uploadedAt: string;
}

export default function ManagePDFsPage() {
  const [pdfs, setPdfs] = useState<PDFDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  
  // Upload form state
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: "",
    description: "",
    category: "GENERAL",
    file: null as File | null,
  });

  useEffect(() => {
    fetchPDFs();
  }, []);

  const fetchPDFs = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/claim-procedure/pdfs/all");
      const data = await response.json();
      setPdfs(data);
    } catch (error) {
      console.error("Error fetching PDFs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "application/pdf") {
        setUploadData({ ...uploadData, file });
      } else {
        alert("Please select a PDF file");
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadData.file || !uploadData.title) {
      alert("Please fill in all required fields");
      return;
    }

    // Confirm replacement if a PDF already exists
    if (pdfs.length > 0) {
      const confirmed = confirm(
        "⚠️ WARNING: Uploading a new PDF will REPLACE the existing PDF.\n\n" +
        `Current PDF: "${pdfs[0].title}"\n\n` +
        "This action cannot be undone. Do you want to continue?"
      );
      if (!confirmed) {
        return;
      }
    }

    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append("file", uploadData.file);
      formData.append("title", uploadData.title);
      formData.append("description", uploadData.description);
      formData.append("category", uploadData.category);

      const response = await fetch("/api/claim-procedure/pdfs/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message || "PDF uploaded successfully!");
        setShowUploadForm(false);
        setUploadData({
          title: "",
          description: "",
          category: "GENERAL",
          file: null,
        });
        fetchPDFs();
      } else {
        const error = await response.json();
        alert(`Upload failed: ${error.error}`);
      }
    } catch (error) {
      console.error("Error uploading PDF:", error);
      alert("Failed to upload PDF");
    } finally {
      setUploading(false);
    }
  };

  const handleToggleActive = async (pdfId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/claim-procedure/pdfs/${pdfId}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        fetchPDFs();
      }
    } catch (error) {
      console.error("Error toggling PDF status:", error);
    }
  };

  const handleDelete = async (pdfId: string) => {
    if (!confirm("Are you sure you want to delete this PDF?")) return;

    try {
      const response = await fetch(`/api/claim-procedure/pdfs/${pdfId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("PDF deleted successfully!");
        fetchPDFs();
      }
    } catch (error) {
      console.error("Error deleting PDF:", error);
      alert("Failed to delete PDF");
    }
  };

  const filteredPdfs =
    selectedCategory === "ALL"
      ? pdfs
      : pdfs.filter((pdf) => pdf.category === selectedCategory);

  const categories = ["ALL", ...Array.from(new Set(pdfs.map((pdf) => pdf.category)))];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link
                  href="/Zopper-Administrator"
                  className="text-neutral-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  Manage Claim Procedure PDF
                </h1>
              </div>
              <p className="text-neutral-400 text-sm md:text-base">
                Upload and manage the claim procedure document for canvassers
              </p>
            </div>

            <button
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {pdfs.length > 0 ? "Replace PDF" : "Upload PDF"}
            </button>
          </div>

          {/* Warning Banner */}
          <div className="bg-amber-900/30 border border-amber-600/50 rounded-lg p-4 flex items-start gap-3">
            <svg className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="text-amber-400 font-semibold mb-1">Single PDF Policy</h3>
              <p className="text-amber-200/80 text-sm">
                Only ONE PDF can exist at a time. Uploading a new PDF will automatically replace the existing one. This ensures canvassers always see the most current claim procedure document.
              </p>
            </div>
          </div>
        </div>

        {/* Upload Form */}
        {showUploadForm && (
          <div className="bg-neutral-800 rounded-2xl p-6 mb-8 border border-neutral-700">
            <h2 className="text-xl font-semibold text-white mb-4">Upload New PDF</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={uploadData.title}
                    onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter PDF title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Category *
                  </label>
                  <select
                    value={uploadData.category}
                    onChange={(e) => setUploadData({ ...uploadData, category: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="GENERAL">General</option>
                    <option value="GUIDE">Guide</option>
                    <option value="FORM">Form</option>
                    <option value="POLICY">Policy</option>
                    <option value="FAQ">FAQ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Description
                </label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter PDF description"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  PDF File *
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="w-full bg-neutral-900 border border-neutral-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  required
                />
                {uploadData.file && (
                  <p className="text-sm text-neutral-400 mt-2">
                    Selected: {uploadData.file.name} ({(uploadData.file.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? "Uploading..." : "Upload PDF"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="bg-neutral-700 hover:bg-neutral-600 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* PDF List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredPdfs.length === 0 ? (
          <div className="bg-neutral-800/50 rounded-2xl p-12 text-center">
            <svg
              className="mx-auto h-16 w-16 text-neutral-600 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-white mb-2">
              No PDFs found
            </h3>
            <p className="text-neutral-400">
              Upload your first PDF to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredPdfs.map((pdf) => (
              <div
                key={pdf.id}
                className={`bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-2xl p-6 border transition-all ${
                  pdf.isActive
                    ? "border-neutral-700 hover:border-blue-500"
                    : "border-red-900/50 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <svg
                        className="h-10 w-10 text-red-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div>
                        <h3 className="text-xl font-semibold text-white">
                          {pdf.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-medium text-blue-400 bg-blue-500/20 px-2 py-1 rounded">
                            {pdf.category}
                          </span>
                          <span className={`text-xs font-medium px-2 py-1 rounded ${
                            pdf.isActive
                              ? "text-green-400 bg-green-500/20"
                              : "text-red-400 bg-red-500/20"
                          }`}>
                            {pdf.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </div>
                    {pdf.description && (
                      <p className="text-sm text-neutral-400 mb-3">
                        {pdf.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-neutral-500">
                      <span>{pdf.fileName}</span>
                      <span>{(pdf.fileSize / 1024).toFixed(2)} KB</span>
                      <span>
                        {new Date(pdf.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleActive(pdf.id, pdf.isActive)}
                      className={`p-2 rounded-lg transition-colors ${
                        pdf.isActive
                          ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                          : "bg-green-600 hover:bg-green-700 text-white"
                      }`}
                      title={pdf.isActive ? "Deactivate" : "Activate"}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={pdf.isActive ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(pdf.id)}
                      className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      title="Delete"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
