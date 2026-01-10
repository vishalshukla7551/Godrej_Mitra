'use client';

import { useState } from 'react';

interface InviteRow {
  secId: string;
  phone: string;
  link?: string;
  status?: 'idle' | 'signed' | 'sending' | 'sent' | 'error';
}

export default function SendTestInvitesPage() {
  const [rows, setRows] = useState<InviteRow[]>([{ secId: '', phone: '' }]);

  const addRow = () => setRows(prev => [...prev, { secId: '', phone: '' }]);
  const removeRow = (idx: number) => setRows(prev => prev.filter((_, i) => i !== idx));
  const updateRow = (idx: number, patch: Partial<InviteRow>) => {
    setRows(prev => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const signLink = (idx: number) => {
    updateRow(idx, { 
      link: `https://test.example.com/test?token=MOCK_${Date.now()}`,
      status: 'signed' 
    });
  };

  const sendInvite = (idx: number) => {
    updateRow(idx, { status: 'sending' });
    setTimeout(() => {
      updateRow(idx, { status: 'sent' });
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => alert('Bulk send functionality (mock)')}
          className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
        >
          Send All
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left font-bold text-gray-800">ASA Canvasser ID</th>
                <th className="px-3 py-3 text-left font-bold text-gray-800">Phone</th>
                <th className="px-3 py-3 text-left font-bold text-gray-800">Link</th>
                <th className="px-3 py-3 text-left font-bold text-gray-800">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-3 py-3">
                    <input
                      className="border border-gray-300 rounded px-2 py-1.5 w-40 font-medium text-gray-900"
                      value={r.secId}
                      onChange={e => updateRow(idx, { secId: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <input
                      className="border border-gray-300 rounded px-2 py-1.5 w-40 font-medium text-gray-900"
                      value={r.phone}
                      onChange={e => updateRow(idx, { phone: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-3 text-blue-600 font-medium text-xs truncate max-w-xs" title={r.link}>
                    {r.link || '-'}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => signLink(idx)}
                        className="px-3 py-1.5 bg-gray-200 rounded text-xs font-semibold text-gray-800 hover:bg-gray-300"
                      >
                        {r.link ? 'Re-sign' : 'Sign Link'}
                      </button>
                      <button
                        onClick={() => sendInvite(idx)}
                        disabled={!r.secId || !r.phone || r.status === 'sending'}
                        className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700 disabled:opacity-50"
                      >
                        {r.status === 'sending' ? 'Sending...' : r.status === 'sent' ? 'Sent ✓' : 'Send'}
                      </button>
                      <button
                        onClick={() => removeRow(idx)}
                        className="px-3 py-1.5 bg-red-100 text-red-700 rounded text-xs font-semibold hover:bg-red-200"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <button
            onClick={addRow}
            className="px-4 py-2 bg-gray-200 rounded font-semibold text-gray-800 hover:bg-gray-300"
          >
            + Add Row
          </button>
        </div>
      </div>

      <div className="text-sm font-medium text-gray-700 bg-yellow-50 border border-yellow-200 p-3 rounded">
        💡 Tip: This is a mock interface. In production, links would be signed and WhatsApp messages sent via configured API.
      </div>
    </div>
  );
}
