'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, FileText, Download, CheckCircle2, Clock, Award, History } from 'lucide-react';
import FestiveHeader from '@/components/FestiveHeader';
import FestiveFooter from '@/components/FestiveFooter';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const CURRENT_YEAR_SHORT = new Date().getFullYear().toString().slice(-2);
const MONTH_OPTIONS = MONTHS.map((month) => `${month} ${CURRENT_YEAR_SHORT}`);

// Dummy data
const trainingVideos = [
  {
    id: 1,
    title: 'Samsung Protect Max Overview',
    duration: '3:20',
    thumbnail: 'https://via.placeholder.com/400x225/1e40af/ffffff?text=Overview',
  },
  {
    id: 2,
    title: 'Coverage & Benefits Explained',
    duration: '5:45',
    thumbnail: 'https://via.placeholder.com/400x225/1e40af/ffffff?text=Coverage',
  },
  {
    id: 3,
    title: 'How to Sell Protect Max',
    duration: '4:15',
    thumbnail: 'https://via.placeholder.com/400x225/1e40af/ffffff?text=Selling+Tips',
  },
  {
    id: 4,
    title: 'Customer FAQs & Objections',
    duration: '6:30',
    thumbnail: 'https://via.placeholder.com/400x225/1e40af/ffffff?text=FAQs',
  },
  {
    id: 5,
    title: 'Claims Process Walkthrough',
    duration: '4:50',
    thumbnail: 'https://via.placeholder.com/400x225/1e40af/ffffff?text=Claims',
  },
  {
    id: 6,
    title: 'Advanced Sales Techniques',
    duration: '7:20',
    thumbnail: 'https://via.placeholder.com/400x225/1e40af/ffffff?text=Advanced',
  },
];

const documents = [
  {
    id: 1,
    title: 'Samsung Protect Max Brochure.pdf',
    type: 'pdf',
    size: '2.4 MB',
  },
  {
    id: 2,
    title: 'Coverage Plan Details.pdf',
    type: 'pdf',
    size: '1.8 MB',
  },
  {
    id: 3,
    title: 'Sales Script Template.docx',
    type: 'docx',
    size: '345 KB',
  },
  {
    id: 4,
    title: 'Product Comparison Chart.pdf',
    type: 'pdf',
    size: '1.2 MB',
  },
  {
    id: 5,
    title: 'Terms & Conditions.pdf',
    type: 'pdf',
    size: '890 KB',
  },
  {
    id: 6,
    title: 'Quick Reference Guide.pdf',
    type: 'pdf',
    size: '1.5 MB',
  },
];

const tests = [
  {
    id: 1,
    title: 'Protect Max Basic Test',
    status: 'completed',
    score: 92,
    attempts: 1,
    maxAttempts: 3,
  },
  {
    id: 2,
    title: 'Coverage & Benefits Quiz',
    status: 'completed',
    score: 85,
    attempts: 2,
    maxAttempts: 3,
  },
  {
    id: 3,
    title: 'Sales Techniques Assessment',
    status: 'pending',
    score: null,
    attempts: 0,
    maxAttempts: 3,
  },
  {
    id: 4,
    title: 'Final Certification Exam',
    status: 'locked',
    score: null,
    attempts: 0,
    maxAttempts: 2,
  },
];

export default function TrainingPage() {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState<string>(
    MONTH_OPTIONS[new Date().getMonth()] ?? `November ${CURRENT_YEAR_SHORT}`,
  );

  const handleStartTest = (testId: number) => {
    router.push(`/SEC/training/test/${testId}`);
  };

  return (
    <div className="h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col overflow-hidden">
      <FestiveHeader hideGreeting />

      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-32">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Training Dashboard</h1>
              <p className="text-gray-600 mt-1">Samsung Protect Max Learning Module</p>
            </div>

            {/* Month filter at right-most corner */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <label
                htmlFor="month-filter"
                className="text-xs sm:text-sm font-medium text-gray-900 uppercase tracking-wide"
              >
                Month
              </label>
              <select
                id="month-filter"
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm bg-white text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {MONTH_OPTIONS.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 1 - Training Videos */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
              <h2 className="text-2xl font-bold text-gray-900">
                Training Videos – Samsung Protect Max
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {trainingVideos.map((video) => (
                <div
                  key={video.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer"
                >
                  <div className="relative aspect-video bg-gradient-to-br from-blue-500 to-blue-700">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors">
                        <Play className="w-8 h-8 text-blue-600 ml-1" fill="currentColor" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
                      {video.duration}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                      {video.title}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 2 - PDF & Docs Material */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
              <h2 className="text-2xl font-bold text-gray-900">Documents & Guides</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        doc.type === 'pdf'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}
                    >
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                        {doc.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">{doc.size}</p>
                    </div>
                    <button className="flex-shrink-0 w-9 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Links - Certificates & History */}
          <section className="mb-10">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => router.push('/SEC/training/certificates')}
                className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl p-4 flex items-center gap-3 shadow-lg hover:shadow-xl transition-shadow"
              >
                <Award className="w-8 h-8 text-white" />
                <div className="text-left">
                  <div className="font-bold text-white">My Certificates</div>
                  <div className="text-xs text-yellow-100">View earned certificates</div>
                </div>
              </button>
              <button
                onClick={() => router.push('/SEC/training/history')}
                className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 flex items-center gap-3 shadow-lg hover:shadow-xl transition-shadow"
              >
                <History className="w-8 h-8 text-white" />
                <div className="text-left">
                  <div className="font-bold text-white">Test History</div>
                  <div className="text-xs text-purple-100">Review past answers</div>
                </div>
              </button>
            </div>
          </section>

          {/* Section 3 - Tests & Quiz Results */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
              <h2 className="text-2xl font-bold text-gray-900">Tests & Results</h2>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {tests.map((test) => (
                <div
                  key={test.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-base sm:text-lg">
                            {test.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              Attempts: {test.attempts}/{test.maxAttempts}
                            </span>
                          </div>
                        </div>

                        {test.status === 'completed' && test.score !== null && (
                          <div className="flex-shrink-0">
                            <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg border border-green-200">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="font-semibold text-sm">{test.score}%</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Progress bar */}
                      {test.status === 'completed' && (
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${test.score}%` }}
                          ></div>
                        </div>
                      )}

                      {test.status === 'pending' && test.attempts > 0 && (
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(test.attempts / test.maxAttempts) * 100}%` }}
                          ></div>
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0">
                      {test.status === 'completed' && (
                        <button 
                          onClick={() => handleStartTest(test.id)}
                          className="w-full sm:w-auto px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors text-sm"
                        >
                          Retake Test
                        </button>
                      )}
                      {test.status === 'pending' && (
                        <button 
                          onClick={() => handleStartTest(test.id)}
                          className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm"
                        >
                          Start Test
                        </button>
                      )}
                      {test.status === 'locked' && (
                        <button
                          disabled
                          className="w-full sm:w-auto px-6 py-2.5 bg-gray-300 text-gray-500 font-semibold rounded-lg cursor-not-allowed text-sm"
                        >
                          Locked
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <FestiveFooter />
    </div>
  );
}
