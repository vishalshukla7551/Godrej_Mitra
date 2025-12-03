"use client";

import { useState, useEffect } from "react";

interface PDFDocument {
  id: string;
  title: string;
  description: string;
  fileName: string;
  fileSize: number;
  category: string;
  uploadedAt: string;
}

export default function ClaimProcedurePage() {
  const [pdf, setPdf] = useState<PDFDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPDF();
  }, []);

  const fetchPDF = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/claim-procedure/pdfs");
      const data = await response.json();
      // Get the first (and only) PDF
      if (data && data.length > 0) {
        setPdf(data[0]);
      }
    } catch (error) {
      console.error("Error fetching PDF:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-neutral-400">Loading claim procedure document...</p>
        </div>
      </div>
    );
  }

  if (!pdf) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <svg
            className="mx-auto h-20 w-20 text-neutral-600 mb-6"
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
          <h2 className="text-2xl font-bold text-white mb-3">
            No Document Available
          </h2>
          <p className="text-neutral-400 mb-6">
            The claim procedure document is not currently available. Please check back later or contact your administrator.
          </p>
          <button
            onClick={fetchPDF}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950">
      {/* Back Button */}
      <div className="absolute top-4 left-4 z-50">
        <button
          onClick={() => window.location.href = '/SEC/home'}
          className="flex items-center gap-2 bg-black/70 hover:bg-black/90 text-white px-4 py-2 rounded-lg transition-colors backdrop-blur-sm"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="text-sm font-medium">Back to Home</span>
        </button>
      </div>

      {/* PDF Viewer - Full Screen */}
      <iframe
        src={`/api/claim-procedure/pdfs/${pdf.id}/view#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
        className="w-full h-full border-0"
        title="Claim Procedure"
      />
    </div>
  );
}
