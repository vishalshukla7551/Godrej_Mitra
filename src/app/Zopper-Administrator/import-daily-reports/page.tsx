'use client';

import { useState } from 'react';
import { FaUpload, FaDownload, FaInfoCircle } from 'react-icons/fa';

export default function ImportDailyReports() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<{
    success: boolean;
    message: string;
    processed?: number;
    errors?: string[];
  } | null>(null);

  const resetForm = () => {
    setFile(null);
    setProcessResult(null);
  };

  const handleFileUpload = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProcessResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/import-daily-reports', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setProcessResult(result);
    } catch (error) {
      setProcessResult({
        success: false,
        message: 'Failed to process file. Please try again.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/admin/download-daily-reports-template', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'daily_reports_template_with_plans.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading template:', error);
      alert('Failed to download template. Please try again.');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Import Daily Reports</h1>
        <button
          onClick={downloadTemplate}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <FaDownload />
          <span>Download Template</span>
        </button>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <FaInfoCircle className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">📝 Instructions:</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal ml-4">
              <li>Download the Excel template using the button above</li>
              <li>The template contains two sheets:
                <ul className="list-disc ml-4 mt-1 space-y-0.5">
                  <li><strong>Sheet 1 - Daily Reports Template:</strong> Use this format for your import data</li>
                  <li><strong>Sheet 2 - Plan Collection Data:</strong> Reference sheet with all available plans and their details</li>
                </ul>
              </li>
              <li>Fill in the daily report data in Sheet 1 with the following columns:
                <ul className="list-disc ml-4 mt-1 space-y-0.5">
                  <li><strong>Store ID:</strong> Store identifier (e.g., "store_00001")</li>
                  <li><strong>Samsung SKU ID:</strong> Samsung SKU ObjectId</li>
                  <li><strong>Plan ID:</strong> Plan ObjectId (refer to Sheet 2 for valid Plan IDs)</li>
                  <li><strong>IMEI:</strong> Device IMEI number (must be unique)</li>
                  <li><strong>Date of Sale:</strong> Sale date in dd-mm-yyyy format</li>
                </ul>
              </li>
              <li>Save the Excel file with your data in Sheet 1</li>
              <li>Upload the Excel file using the form below</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <FaInfoCircle className="text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Important Notes:</h3>
            <ul className="text-sm text-yellow-800 space-y-1 list-disc ml-4">
              <li>IMEI numbers must be unique - duplicates will be skipped</li>
              <li>Store ID, Samsung SKU ID, and Plan ID must exist in the database</li>
              <li>Use Sheet 2 in the template to find valid Plan IDs and their details</li>
              <li>Date format must be dd-mm-yyyy (e.g., "01-01-2024")</li>
              <li>Only Excel files (.xlsx, .xls) are supported</li>
              <li>Data must be in Sheet 1 of the Excel file</li>
              <li>Invalid records will be skipped with error messages</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
        <FaUpload className="mx-auto text-4xl text-gray-400 mb-4" />
        <label className="cursor-pointer inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
          Select Excel File
          <input 
            type="file" 
            accept=".xlsx,.xls" 
            onChange={e => {
              const selectedFile = e.target.files?.[0];
              if (selectedFile) {
                const fileName = selectedFile.name.toLowerCase();
                if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
                  alert('Please select an Excel file (.xlsx or .xls). CSV files are not supported.');
                  e.target.value = '';
                  return;
                }
                setFile(selectedFile);
              } else {
                setFile(null);
              }
            }} 
            className="hidden" 
          />
        </label>
        {file && (
          <div className="mt-4 space-y-2">
            <div className="text-sm text-gray-600">
              Selected: <span className="font-medium">{file.name}</span>
            </div>
            <div className="text-xs text-gray-500">
              Size: {(file.size / 1024).toFixed(1)} KB | Type: {file.type || 'Unknown'}
            </div>
            <button
              onClick={resetForm}
              className="text-xs text-red-600 hover:text-red-800 underline"
            >
              Remove file
            </button>
          </div>
        )}
      </div>

      {file && (
        <button 
          onClick={handleFileUpload}
          disabled={isProcessing}
          className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Processing Daily Reports...</span>
            </div>
          ) : (
            'Import Daily Reports'
          )}
        </button>
      )}

      {processResult && (
        <div className={`rounded-lg p-4 ${
          processResult.success 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className={`font-semibold ${
            processResult.success ? 'text-green-900' : 'text-red-900'
          }`}>
            {processResult.success ? '✅ Success!' : '❌ Error!'}
          </div>
          <p className={`mt-1 text-sm ${
            processResult.success ? 'text-green-800' : 'text-red-800'
          }`}>
            {processResult.message}
          </p>
          
          {processResult.processed && (
            <p className="mt-2 text-sm text-green-800">
              Successfully processed {processResult.processed} daily report records.
            </p>
          )}
          
          {processResult.errors && processResult.errors.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-red-800">Errors encountered:</p>
              <ul className="mt-1 text-xs text-red-700 list-disc ml-4 space-y-0.5">
                {processResult.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}