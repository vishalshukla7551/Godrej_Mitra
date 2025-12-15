'use client';

import { useState } from 'react';
import { FaUpload, FaDownload, FaInfoCircle } from 'react-icons/fa';

export default function ImportStoreAttachRate() {
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

      const response = await fetch('/api/admin/import-store-attach-rate', {
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

  const downloadTemplate = () => {
    // Create a comprehensive CSV template with examples using dd-mm-yyyy format and correct Store ID format
    const csvContent = `Store ID,Store Name,Start Period,End Period,Attach Percentage
store_00001,Croma - A294 Agra SRK Mall,01-01-2024,31-03-2024,25
store_00002,Croma - Phoenix Mall Mumbai,01-04-2024,30-06-2024,30
store_00003,Reliance Digital - CP Delhi,01-07-2024,30-09-2024,22
store_00029,Samsung Plaza - Bangalore,01-10-2024,31-12-2024,28
store_00030,Vijay Sales - Pune,01-01-2024,31-01-2024,24
store_00031,Poorvika - Chennai,01-02-2024,29-02-2024,32`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'store_attach_rate_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Import Store Attach Rate</h1>
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
              <li>Download the CSV template using the button above</li>
              <li>Fill in the store attach rate data with the following columns:
                <ul className="list-disc ml-4 mt-1 space-y-0.5">
                  <li><strong>Store ID:</strong> Unique identifier for the store (e.g., "store_00029")</li>
                  <li><strong>Store Name:</strong> Display name of the store</li>
                  <li><strong>Start Period:</strong> Start date in dd-mm-yyyy format (e.g., "01-01-2024")</li>
                  <li><strong>End Period:</strong> End date in dd-mm-yyyy format (e.g., "31-03-2024")</li>
                  <li><strong>Attach Percentage:</strong> Attachment rate as percentage (e.g., 25 for 25%, 30 for 30%)</li>
                </ul>
              </li>
              <li>Save the file as CSV format</li>
              <li>Upload the file using the form below</li>
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
              <li>Store ID format should match existing store IDs (e.g., "store_00029")</li>
              <li>Attach percentage should be a number (e.g., 25 for 25%, 30 for 30%)</li>
              <li>Date format must be dd-mm-yyyy (e.g., "01-01-2024", "31-03-2024")</li>
              <li>Each store can have only one attach rate - importing will update existing records</li>
              <li>Invalid store IDs or date formats will be skipped with error messages</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
        <FaUpload className="mx-auto text-4xl text-gray-400 mb-4" />
        <label className="cursor-pointer inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
          Select CSV File
          <input 
            type="file" 
            accept=".csv,.xlsx,.xls" 
            onChange={e => setFile(e.target.files?.[0] || null)} 
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
              <span>Processing Store Attach Rates...</span>
            </div>
          ) : (
            'Import Store Attach Rates'
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
              Successfully processed {processResult.processed} store attach rate records.
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