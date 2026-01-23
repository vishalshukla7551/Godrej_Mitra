'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface SupportQuery {
  id: string;
  queryNumber: string;
  category: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
  submittedAt: string;
  lastUpdatedAt: string;
  resolvedAt?: string;
  messages: SupportQueryMessage[];
  canvasserUser: {
    fullName: string;
    phone: string;
    employeeId?: string;
    store?: {
      name: string;
      city: string;
    };
  };
}

interface SupportQueryMessage {
  id: string;
  message: string;
  isFromAdmin: boolean;
  adminName?: string;
  sentAt: string;
}

interface StatusCounts {
  ALL: number;
  PENDING: number;
  IN_PROGRESS: number;
  RESOLVED: number;
}

const CATEGORY_OPTIONS = [
  { value: 'TECHNICAL_ISSUE', label: 'Technical Issue' },
  { value: 'ACCOUNT_PROBLEM', label: 'Account Problem' },
  { value: 'PAYMENT_INQUIRY', label: 'Payment Inquiry' },
  { value: 'TRAINING_SUPPORT', label: 'Training Support' },
  { value: 'GENERAL_INQUIRY', label: 'General Inquiry' },
  { value: 'BUG_REPORT', label: 'Bug Report' },
  { value: 'FEATURE_REQUEST', label: 'Feature Request' },
  { value: 'OTHER', label: 'Other' }
];

export default function CanvasserHelpRequestsPage() {
  const { loading: authLoading } = useAuth(['ZOPPER_ADMINISTRATOR']);
  
  const [queries, setQueries] = useState<SupportQuery[]>([]);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    ALL: 0,
    PENDING: 0,
    IN_PROGRESS: 0,
    RESOLVED: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuery, setSelectedQuery] = useState<SupportQuery | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      fetchQueries();
    }
  }, [authLoading, selectedStatus, searchTerm]);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: selectedStatus,
        search: searchTerm
      });

      const response = await fetch(`/api/zopper-administrator/support-queries?${params}`);
      const result = await response.json();

      if (result.success) {
        setQueries(result.data.queries);
        setStatusCounts(result.data.statusCounts);
      } else {
        setError(result.error || 'Failed to fetch queries');
      }
    } catch (err) {
      setError('Failed to fetch queries');
      console.error('Error fetching queries:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQueryDetails = async (queryId: string) => {
    try {
      const response = await fetch(`/api/zopper-administrator/support-queries/${queryId}`);
      const result = await response.json();

      if (result.success) {
        setSelectedQuery(result.data);
      } else {
        setError(result.error || 'Failed to fetch query details');
      }
    } catch (err) {
      setError('Failed to fetch query details');
      console.error('Error fetching query details:', err);
    }
  };

  const handleSendResponse = async () => {
    if (!selectedQuery || !responseMessage.trim()) return;

    try {
      setSubmittingResponse(true);
      setError(null);

      const response = await fetch(`/api/zopper-administrator/support-queries/${selectedQuery.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: responseMessage.trim() })
      });

      const result = await response.json();

      if (result.success) {
        setSelectedQuery(result.data);
        setResponseMessage('');
        await fetchQueries(); // Refresh the list
      } else {
        setError(result.error || 'Failed to send response');
      }
    } catch (err) {
      setError('Failed to send response');
      console.error('Error sending response:', err);
    } finally {
      setSubmittingResponse(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-900/30 text-yellow-300 border-yellow-700/50';
      case 'IN_PROGRESS': return 'bg-blue-900/30 text-blue-300 border-blue-700/50';
      case 'RESOLVED': return 'bg-green-900/30 text-green-300 border-green-700/50';
      default: return 'bg-slate-800/30 text-slate-300 border-slate-700/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return '⏳';
      case 'IN_PROGRESS': return '🔄';
      case 'RESOLVED': return '✅';
      default: return '❓';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return formatDate(dateString);
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50 relative overflow-hidden">
      {/* Glow accents */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -right-20 top-10 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute -left-10 bottom-10 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Canvasser Help Requests</h1>
          <p className="text-slate-300">Manage and respond to support queries from canvassers</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button 
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-300 text-sm underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-slate-700">
            <nav className="flex space-x-8">
              {Object.entries(statusCounts).map(([status, count]) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    selectedStatus === status
                      ? 'border-blue-400 text-blue-300'
                      : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {status !== 'ALL' && <span>{getStatusIcon(status)}</span>}
                    {status === 'ALL' ? 'All Requests' : status.replace('_', ' ')} 
                    <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded-full text-xs">
                      {count}
                    </span>
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by query number, canvasser name, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-600 bg-slate-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-400"
            />
          </div>
        </div>

        {/* Request Cards Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <p className="text-slate-300">Loading help requests...</p>
            </div>
          </div>
        ) : queries.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-slate-400 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No help requests found</h3>
            <p className="text-slate-400">
              {selectedStatus === 'ALL' 
                ? 'No canvassers have submitted help requests yet.' 
                : `No ${selectedStatus.toLowerCase().replace('_', ' ')} requests found.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {queries.map((query) => (
              <div 
                key={query.id} 
                className="bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm hover:shadow-lg hover:border-slate-600/50 transition-all cursor-pointer backdrop-blur-sm"
                onClick={() => fetchQueryDetails(query.id)}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {query.queryNumber}
                      </h3>
                      <p className="text-sm text-slate-300">
                        {CATEGORY_OPTIONS.find(c => c.value === query.category)?.label}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(query.status)}`}>
                      <span className="mr-1">{getStatusIcon(query.status)}</span>
                      {query.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Canvasser Info */}
                  <div className="mb-4 p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                        {query.canvasserUser.fullName?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">
                          {query.canvasserUser.fullName}
                        </p>
                        <p className="text-sm text-slate-300">
                          {query.canvasserUser.phone}
                        </p>
                        {query.canvasserUser.store && (
                          <p className="text-xs text-slate-400 truncate">
                            {query.canvasserUser.store.name}, {query.canvasserUser.store.city}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Query Preview */}
                  <div className="mb-4">
                    <p className="text-sm text-slate-300 line-clamp-3">
                      {query.description}
                    </p>
                  </div>

                  {/* Timestamps */}
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Submitted {formatRelativeTime(query.submittedAt)}</span>
                    </div>
                    {query.messages.length > 0 && (
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>{query.messages.length} message{query.messages.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Indicator */}
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        Updated {formatRelativeTime(query.lastUpdatedAt)}
                      </span>
                      <div className="flex items-center text-blue-400 text-sm font-medium">
                        <span>View Details</span>
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Query Detail Modal */}
      {selectedQuery && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-semibold text-white">
                      {selectedQuery.queryNumber}
                    </h2>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedQuery.status)}`}>
                      <span className="mr-1">{getStatusIcon(selectedQuery.status)}</span>
                      {selectedQuery.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-slate-300 mb-2">
                    {CATEGORY_OPTIONS.find(c => c.value === selectedQuery.category)?.label}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span>Submitted: {formatDate(selectedQuery.submittedAt)}</span>
                    <span>•</span>
                    <span>Last Updated: {formatDate(selectedQuery.lastUpdatedAt)}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedQuery(null)}
                  className="text-slate-400 hover:text-slate-300 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Canvasser Info */}
              <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-lg">
                    {selectedQuery.canvasserUser.fullName?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-white">{selectedQuery.canvasserUser.fullName}</h3>
                    <p className="text-slate-300">{selectedQuery.canvasserUser.phone}</p>
                    {selectedQuery.canvasserUser.employeeId && (
                      <p className="text-sm text-slate-400">Employee ID: {selectedQuery.canvasserUser.employeeId}</p>
                    )}
                    {selectedQuery.canvasserUser.store && (
                      <p className="text-sm text-slate-400">
                        Store: {selectedQuery.canvasserUser.store.name}, {selectedQuery.canvasserUser.store.city}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Body - Conversation Thread */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Original Query */}
              <div className="mb-6">
                <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0">
                      {selectedQuery.canvasserUser.fullName?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-white">{selectedQuery.canvasserUser.fullName}</p>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-400">{formatDate(selectedQuery.submittedAt)}</span>
                      </div>
                      <p className="text-sm text-slate-300 mb-2">Original Query</p>
                    </div>
                  </div>
                  <div className="ml-13">
                    <p className="text-slate-200 whitespace-pre-wrap">{selectedQuery.description}</p>
                  </div>
                </div>
              </div>

              {/* Messages Thread */}
              {selectedQuery.messages.length > 0 && (
                <div className="space-y-4 mb-6">
                  <h4 className="text-sm font-medium text-slate-300 uppercase tracking-wide">Conversation History</h4>
                  {selectedQuery.messages.map((message, index) => (
                    <div key={message.id} className={`${message.isFromAdmin ? 'ml-8' : 'mr-8'}`}>
                      <div className={`rounded-lg p-4 ${message.isFromAdmin ? 'bg-green-900/30 border border-green-700/50' : 'bg-slate-800/50 border border-slate-700/50'}`}>
                        <div className="flex items-start gap-3 mb-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 ${message.isFromAdmin ? 'bg-green-600' : 'bg-slate-600'}`}>
                            {message.isFromAdmin ? 'A' : selectedQuery.canvasserUser.fullName?.charAt(0) || 'U'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm text-white">
                                {message.isFromAdmin ? (message.adminName || 'Admin') : selectedQuery.canvasserUser.fullName}
                              </p>
                              <span className="text-xs text-slate-400">•</span>
                              <span className="text-xs text-slate-400">{formatDate(message.sentAt)}</span>
                            </div>
                            <p className="text-xs text-slate-300">
                              {message.isFromAdmin ? 'Admin Response' : 'Canvasser Reply'}
                            </p>
                          </div>
                        </div>
                        <div className="ml-11">
                          <p className="text-slate-200 whitespace-pre-wrap">{message.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Response Form */}
              {selectedQuery.status !== 'RESOLVED' && (
                <div className="border-t border-slate-700 pt-6">
                  <h4 className="text-lg font-medium text-white mb-4">Send Response</h4>
                  <div className="space-y-4">
                    <textarea
                      value={responseMessage}
                      onChange={(e) => setResponseMessage(e.target.value)}
                      placeholder="Type your response to help the canvasser..."
                      rows={4}
                      className="w-full border border-slate-600 bg-slate-800/50 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-white placeholder-slate-400"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-400">
                        {selectedQuery.status === 'PENDING' 
                          ? 'Sending a response will automatically change the status to "In Progress"'
                          : 'This query is currently in progress'
                        }
                      </p>
                      <button
                        onClick={handleSendResponse}
                        disabled={!responseMessage.trim() || submittingResponse}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        {submittingResponse ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Sending...
                          </span>
                        ) : 'Send Response'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Resolved State Message */}
              {selectedQuery.status === 'RESOLVED' && (
                <div className="border-t border-slate-700 pt-6">
                  <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white">
                        ✓
                      </div>
                      <div>
                        <h4 className="font-medium text-green-300">Query Resolved</h4>
                        <p className="text-sm text-green-400">
                          This query was marked as resolved by the canvasser on {formatDate(selectedQuery.resolvedAt || selectedQuery.lastUpdatedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-700">
              <button
                onClick={() => setSelectedQuery(null)}
                className="w-full bg-slate-700 text-slate-200 py-3 px-4 rounded-lg hover:bg-slate-600 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}