'use client';

import { useState } from 'react';
import { FaUpload, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaSpinner, FaFileExcel, FaArrowRight } from 'react-icons/fa';
import Link from 'next/link';

type ProcessResult = {
  success: boolean;
  message: string;
  summary: {
    total: number;
    updated: number;
    notFound: number;
    failed: number;
  };
  details: {
    success: Array<{ imei: string; voucherCode: string; canvasserName?: string }>;
    notFound: Array<{ imei: string; voucherCode: string; reason: string }>;
    failed: Array<{ imei: string; voucherCode: string; reason: string }>;
  };
};

export default function ProcessVoucherExcel() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setResult(null);
    setError(null);
  };

  const handleProcessFile = async () => {
    if (!file) return;

    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/zopper-administrator/process-voucher-excel', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to process file');
        return;
      }

      setResult(data);
    } catch (err) {
      console.error('Error processing file:', err);
      setError('Failed to upload and process file. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Process Voucher Excel</h1>
          <p className="text-gray-600">Upload Excel file with voucher codes to update sales records</p>
        </div>

        {/* Instructions */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2 text-lg">
            <span className="text-2xl">�</span> How to Upload Vouchers
          </h3>

          {/* Step-by-step workflow */}
          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 mb-1">Export Excel from Spot Incentive Report</h4>
                <p className="text-sm text-blue-800 mb-2">
                  Go to the <strong>Spot Incentive Report</strong> page and click the <strong>"Export"</strong> button to download the current reports as an Excel file.
                </p>
                <Link
                  href="/Zopper-Administrator/spot-incentive-report"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition shadow-sm"
                >
                  <FaFileExcel /> Go to Spot Incentive Report
                  <FaArrowRight className="text-xs" />
                </Link>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 mb-1">Fill in Voucher Codes</h4>
                <p className="text-sm text-blue-800">
                  Open the downloaded Excel file and fill in the <strong>"Voucher Code"</strong> column for the records you want to mark as paid.
                </p>
                <div className="mt-2 bg-white rounded-lg p-3 border border-blue-200">
                  <p className="text-xs text-blue-700 font-mono">
                    Example: GC2026ABC123, GC2026XYZ456, etc.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 mb-1">Upload the Excel File</h4>
                <p className="text-sm text-blue-800">
                  Upload the same Excel file (with voucher codes filled) using the form below. The system will match records by <strong>Serial Number</strong> and update the database.
                </p>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-xs text-blue-700">
              <strong>📌 Important:</strong> The Excel file must be exported from the Spot Incentive Report page. Only the <strong>"Voucher Code"</strong> column needs to be filled. All other columns will be used for matching and validation.
            </p>
          </div>
        </div>

        {/* File Upload */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Upload Excel File</h3>

          <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition">
            <FaUpload className="mx-auto text-5xl text-gray-400 mb-4" />
            <label className="cursor-pointer inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-md">
              Select Excel File
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                disabled={processing}
              />
            </label>
            {file && (
              <div className="mt-4 text-sm text-gray-700 bg-gray-100 inline-block px-4 py-2 rounded-lg">
                📄 Selected: <strong>{file.name}</strong>
              </div>
            )}
          </div>

          {file && !processing && !result && (
            <button
              onClick={handleProcessFile}
              className="w-full mt-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition shadow-md font-semibold"
            >
              Process Voucher File
            </button>
          )}

          {processing && (
            <div className="mt-6 text-center">
              <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-3" />
              <p className="text-gray-600">Processing vouchers... Please wait.</p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center gap-3 text-red-800">
              <FaTimesCircle className="text-2xl" />
              <div>
                <h3 className="font-semibold">Error</h3>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
                <p className="text-sm text-gray-600 mb-1">Total Rows</p>
                <p className="text-3xl font-bold text-gray-900">{result.summary.total}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
                <p className="text-sm text-gray-600 mb-1">Successfully Updated</p>
                <p className="text-3xl font-bold text-green-600">{result.summary.updated}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500">
                <p className="text-sm text-gray-600 mb-1">Not Found</p>
                <p className="text-3xl font-bold text-orange-600">{result.summary.notFound}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
                <p className="text-sm text-gray-600 mb-1">Failed</p>
                <p className="text-3xl font-bold text-red-600">{result.summary.failed}</p>
              </div>
            </div>

            {/* Success Details */}
            {result.details.success.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-green-700 mb-4 flex items-center gap-2">
                  <FaCheckCircle /> Successfully Updated ({result.details.success.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Serial Number</th>
                        <th className="px-4 py-2 text-left">Voucher Code</th>
                        <th className="px-4 py-2 text-left">Canvasser</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {result.details.success.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-mono text-xs">{item.imei}</td>
                          <td className="px-4 py-2 font-mono text-blue-600">{item.voucherCode}</td>
                          <td className="px-4 py-2">{item.canvasserName || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Not Found Details */}
            {result.details.notFound.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-orange-700 mb-4 flex items-center gap-2">
                  <FaExclamationTriangle /> Not Found ({result.details.notFound.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Serial Number</th>
                        <th className="px-4 py-2 text-left">Voucher Code</th>
                        <th className="px-4 py-2 text-left">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {result.details.notFound.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-mono text-xs">{item.imei}</td>
                          <td className="px-4 py-2 font-mono">{item.voucherCode}</td>
                          <td className="px-4 py-2 text-orange-600">{item.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Failed Details */}
            {result.details.failed.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-red-700 mb-4 flex items-center gap-2">
                  <FaTimesCircle /> Failed ({result.details.failed.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Serial Number</th>
                        <th className="px-4 py-2 text-left">Voucher Code</th>
                        <th className="px-4 py-2 text-left">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {result.details.failed.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-mono text-xs">{item.imei}</td>
                          <td className="px-4 py-2 font-mono">{item.voucherCode}</td>
                          <td className="px-4 py-2 text-red-600">{item.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Reset Button */}
            <button
              onClick={() => {
                setFile(null);
                setResult(null);
                setError(null);
              }}
              className="w-full py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Process Another File
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
