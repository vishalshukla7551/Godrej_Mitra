'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Award, Download, ArrowLeft } from 'lucide-react';
import FestiveHeader from '@/components/FestiveHeader';
import FestiveFooter from '@/components/FestiveFooter';

interface Certificate {
  id: string;
  certificateNo: string;
  testName: string;
  score: number;
  issuedAt: string;
  passed: boolean;
}

const MOCK_CERTIFICATES: Certificate[] = [
  { id: '1', certificateNo: 'CERT-1702656000000-ABC123', testName: 'Samsung Protect Max Certification', score: 80, issuedAt: '2024-12-15', passed: true },
  { id: '2', certificateNo: 'CERT-1702569600000-DEF456', testName: 'Coverage & Benefits Quiz', score: 90, issuedAt: '2024-12-14', passed: true },
];

export default function CertificatesPage() {
  const router = useRouter();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => { setCertificates(MOCK_CERTIFICATES); setLoading(false); }, 500);
  }, []);

  return (
    <div className="h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col overflow-hidden">
      <FestiveHeader hideGreeting />
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-32">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <button onClick={() => router.push('/SEC/training')} className="flex items-center gap-2 text-blue-600 mb-4">
            <ArrowLeft className="w-5 h-5" /> Back to Training
          </button>
          <div className="flex items-center gap-3 mb-6">
            <Award className="w-8 h-8 text-yellow-500" />
            <h1 className="text-2xl font-bold text-gray-900">My Certificates</h1>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>
          ) : certificates.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">No Certificates Yet</h2>
              <p className="text-gray-600 mb-4">Complete tests to earn certificates</p>
              <button onClick={() => router.push('/SEC/training')} className="px-6 py-3 bg-blue-600 text-white rounded-xl">Go to Training</button>
            </div>
          ) : (
            <div className="space-y-4">
              {certificates.map(cert => (
                <div key={cert.id} className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-400">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{cert.testName}</h3>
                      <p className="text-sm text-gray-500 mt-1">Certificate No: {cert.certificateNo}</p>
                      <p className="text-sm text-gray-500">Issued: {new Date(cert.issuedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">{cert.score}%</div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Passed</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button className="flex-1 py-2 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 text-sm">
                      <Download className="w-4 h-4" /> Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <FestiveFooter />
    </div>
  );
}
