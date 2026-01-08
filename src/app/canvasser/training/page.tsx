'use client';

import { useState } from 'react';
import CanvasserHeader from '@/app/canvasser/CanvasserHeader';
import CanvasserFooter from '@/app/canvasser/CanvasserFooter';

export default function TrainingPage() {
  const [userName] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <CanvasserHeader userName={userName} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-32">
        {/* Header Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 mt-4 sm:mt-6 mb-6">
          <div className="bg-gradient-to-br from-[#A86638] to-[#D89038] rounded-2xl p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center text-2xl">
                ⭐
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Godrej Care+ Pricesheet</h1>
                <p className="text-white/90 text-sm sm:text-base">Pricing Effective 1st January 2026</p>
              </div>
            </div>
          </div>
        </div>

        {/* Download Options Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PDF Download Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-red-100 w-12 h-12 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">PDF Document</h3>
                    <p className="text-sm text-gray-600">Complete pricing guide</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-4">
                  Comprehensive Godrej Care+ pricing document with all plan details and coverage information.
                </p>
                <div className="space-y-3">
                  <a
                    href="/Godrej Care+ Pricing Effective 1st January 2026.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View PDF
                  </a>
                  <a
                    href="/Godrej Care+ Pricing Effective 1st January 2026.pdf"
                    download="Godrej Care+ Pricing Effective 1st January 2026.pdf"
                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#A86638] to-[#D89038] text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:shadow-lg transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF
                  </a>
                </div>
              </div>
            </div>

            {/* Excel Download Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Excel Spreadsheet</h3>
                    <p className="text-sm text-gray-600">Editable pricing data</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-4">
                  Excel format for easy calculations and reference. Perfect for quick lookups and custom analysis.
                </p>
                <a
                  href="/Godrej Care+ Price_1 January 2026.xlsx"
                  download="Godrej Care+ Price_1 January 2026.xlsx"
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:shadow-lg transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Excel
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* PDF Viewer Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 mb-8">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Godrej Care+ Pricing Document Preview</h2>
              <p className="text-sm text-gray-600 mt-1">View the complete pricing details below</p>
            </div>
            
            {/* PDF Embed */}
            <div className="relative">
              <iframe
                src="/Godrej Care+ Pricing Effective 1st January 2026.pdf"
                className="w-full h-[600px] md:h-[700px] lg:h-[800px]"
                title="Godrej Care+ Pricing Document"
                style={{ border: 'none' }}
              />
            </div>
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Important Information</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• This pricing is effective from 1st January 2026</li>
                  <li>• Please refer to this document for accurate pricing information</li>
                  <li>• For any queries, contact your supervisor or support team</li>
                  <li>• Keep this document handy during customer interactions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <CanvasserFooter />
    </div>
  );
}