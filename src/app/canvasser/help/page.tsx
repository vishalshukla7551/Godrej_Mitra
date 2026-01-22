'use client';

import { useState, useEffect } from 'react';
import CanvasserHeader from '@/app/canvasser/CanvasserHeader';
import CanvasserFooter from '@/app/canvasser/CanvasserFooter';

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
  };
}

interface SupportQueryMessage {
  id: string;
  message: string;
  isFromAdmin: boolean;
  adminName?: string;
  sentAt: string;
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

export default function HelpPage() {
  const [queries, setQueries] = useState<SupportQuery[]>([]);
  const [canCreateNew, setCanCreateNew] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<SupportQuery | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    category: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [replyMessage, setReplyMessage] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/canvasser/support-query');
      const result = await response.json();

      if (result.success) {
        setQueries(result.data.queries);
        setCanCreateNew(result.data.canCreateNew);
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

  const handleDescriptionChange = (value: string) => {
    const words = value.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    setFormData({ ...formData, description: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.description.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (wordCount > 500) {
      setError('Description must be 500 words or less');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch('/api/canvasser/support-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        setFormData({ category: '', description: '' });
        setWordCount(0);
        setShowCreateForm(false);
        await fetchQueries();
      } else {
        setError(result.error || 'Failed to submit query');
      }
    } catch (err) {
      setError('Failed to submit query');
      console.error('Error submitting query:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (queryId: string) => {
    try {
      const response = await fetch(`/api/canvasser/support-query/${queryId}/resolve`, {
        method: 'POST'
      });

      const result = await response.json();

      if (result.success) {
        await fetchQueries();
        setSelectedQuery(null);
      } else {
        setError(result.error || 'Failed to resolve query');
      }
    } catch (err) {
      setError('Failed to resolve query');
      console.error('Error resolving query:', err);
    }
  };

  const handleReply = async () => {
    if (!selectedQuery || !replyMessage.trim()) return;

    try {
      setSubmittingReply(true);
      setError(null);

      const response = await fetch(`/api/canvasser/support-query/${selectedQuery.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyMessage.trim() })
      });

      const result = await response.json();

      if (result.success) {
        setSelectedQuery(result.data);
        setReplyMessage('');
        await fetchQueries(); // Refresh the list
      } else {
        setError(result.error || 'Failed to send reply');
      }
    } catch (err) {
      setError('Failed to send reply');
      console.error('Error sending reply:', err);
    } finally {
      setSubmittingReply(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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

  if (loading) {
    return (
      <div className="h-screen bg-white flex flex-col overflow-hidden">
        <CanvasserHeader />
        <main className="flex-1 overflow-y-auto pb-32 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-900">Loading help center...</p>
          </div>
        </main>
        <CanvasserFooter />
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      <CanvasserHeader />

      <main className="flex-1 overflow-y-auto pb-32">
        <div className="px-4 pt-4">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Help & Support</h1>
            <p className="text-gray-900">Submit queries and get help from our support team</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="text-red-600 text-xs underline mt-1"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Create New Query Button */}
          {canCreateNew && !showCreateForm && (
            <div className="mb-6">
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                + Submit New Query
              </button>
            </div>
          )}

          {!canCreateNew && !showCreateForm && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-orange-900 text-sm">
                You have a pending or in-progress query. Please wait for it to be resolved before submitting a new one.
              </p>
            </div>
          )}

          {/* Create Query Form */}
          {showCreateForm && (
            <div className="mb-6 bg-gray-50 p-4 rounded-lg border">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Submit New Query</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 text-gray-900"
                    required
                  >
                    <option value="">Select a category</option>
                    {CATEGORY_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Description * ({wordCount}/500 words)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleDescriptionChange(e.target.value)}
                    placeholder="Describe your issue or question in detail..."
                    rows={6}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 resize-none text-gray-900 placeholder-gray-600"
                    required
                  />
                  {wordCount > 500 && (
                    <p className="text-red-600 text-xs mt-1">Description exceeds 500 words limit</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting || wordCount > 500}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? 'Submitting...' : 'Submit Query'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setFormData({ category: '', description: '' });
                      setWordCount(0);
                      setError(null);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Queries List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Your Queries</h2>
            
            {queries.length === 0 ? (
              <div className="text-center py-8 text-gray-900">
                <p>No queries submitted yet</p>
              </div>
            ) : (
              queries.map(query => (
                <div key={query.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {query.queryNumber}
                      </h3>
                      <p className="text-sm text-gray-900">
                        {CATEGORY_OPTIONS.find(c => c.value === query.category)?.label}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(query.status)}`}>
                      {query.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-gray-900 text-sm mb-3 line-clamp-2">
                    {query.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-800 mb-3">
                    <span>Submitted: {formatDate(query.submittedAt)}</span>
                    <span>Updated: {formatDate(query.lastUpdatedAt)}</span>
                  </div>

                  {query.messages.length > 0 && (
                    <div className="border-t pt-3 mb-3">
                      <p className="text-xs text-gray-900 mb-2">
                        {query.messages.length} message{query.messages.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedQuery(query)}
                      className="flex-1 bg-gray-100 text-gray-900 py-2 px-3 rounded text-sm hover:bg-gray-200 transition-colors"
                    >
                      View Details
                    </button>
                    
                    {query.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleResolve(query.id)}
                        className="bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        Mark as Resolved
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Query Detail Modal */}
      {selectedQuery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedQuery.queryNumber} - {CATEGORY_OPTIONS.find(c => c.value === selectedQuery.category)?.label}
                </h2>
                <button
                  onClick={() => setSelectedQuery(null)}
                  className="text-gray-700 hover:text-gray-900"
                >
                  ✕
                </button>
              </div>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${getStatusColor(selectedQuery.status)}`}>
                {selectedQuery.status.replace('_', ' ')}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {/* Original Query */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {selectedQuery.canvasserUser?.fullName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">{selectedQuery.canvasserUser?.fullName || 'Unknown User'}</p>
                    <p className="text-xs text-gray-800">{formatDate(selectedQuery.submittedAt)}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-900">{selectedQuery.description}</p>
              </div>

              {/* Messages Thread */}
              {selectedQuery.messages.map(message => (
                <div key={message.id} className={`mb-4 p-3 rounded-lg ${message.isFromAdmin ? 'bg-green-50 ml-4' : 'bg-gray-50 mr-4'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${message.isFromAdmin ? 'bg-green-600' : 'bg-gray-600'}`}>
                      {message.isFromAdmin ? 'A' : selectedQuery.canvasserUser?.fullName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">
                        {message.isFromAdmin ? (message.adminName || 'Admin') : selectedQuery.canvasserUser?.fullName || 'Unknown User'}
                      </p>
                      <p className="text-xs text-gray-800">{formatDate(message.sentAt)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-900">{message.message}</p>
                </div>
              ))}
            </div>

            <div className="p-4 border-t">
              {/* Reply Form for IN_PROGRESS queries */}
              {selectedQuery.status === 'IN_PROGRESS' && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Continue Conversation</h4>
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your follow-up message or additional questions..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 resize-none text-gray-900 placeholder-gray-600 text-sm"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-600">
                      You can continue the conversation if you need more help
                    </p>
                    <button
                      onClick={handleReply}
                      disabled={!replyMessage.trim() || submittingReply}
                      className="bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {submittingReply ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedQuery(null);
                    setReplyMessage('');
                  }}
                  className="flex-1 bg-gray-100 text-gray-900 py-2 px-4 rounded hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                
                {selectedQuery.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => {
                      handleResolve(selectedQuery.id);
                      setSelectedQuery(null);
                      setReplyMessage('');
                    }}
                    className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
                  >
                    Mark as Resolved
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <CanvasserFooter />
    </div>
  );
}