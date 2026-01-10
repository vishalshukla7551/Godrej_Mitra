'use client';

import { useState, useEffect } from 'react';
import { FaSignOutAlt } from 'react-icons/fa';
import { clientLogout } from '@/lib/clientLogout';

interface StoreChangeRequest {
  id: string;
  requestedStoreIds: string[];
  currentStoreIds: string[];
  reason: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  userId: string;
  userRole: 'ASE' | 'ABM' | 'ASA_CANVASSER';
  profile: {
    id: string;
    fullName: string;
    phone: string;
  };
  // Backward compatibility
  ase?: {
    id: string;
    fullName: string;
    phone: string;
  };
  abm?: {
    id: string;
    fullName: string;
    phone: string;
  };
  asaCanvasser?: {
    id: string;
    fullName: string;
    phone: string;
  };
  currentStores: Array<{
    id: string;
    name: string;
    city: string | null;
  }>;
  requestedStores: Array<{
    id: string;
    name: string;
    city: string | null;
  }>;
}

interface ApiResponse {
  success: boolean;
  data: {
    requests: StoreChangeRequest[];
    pagination: {
      page: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
    };
  };
}

export default function StoreChangeRequestsPage() {
  const [requests, setRequests] = useState<StoreChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0
  });

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        status: statusFilter,
        page: page.toString(),
        pageSize: '20'
      });

      console.log('Fetching requests with params:', params.toString());
      const response = await fetch(`/api/admin/store-change-requests?${params}`);
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Failed to fetch requests: ${response.status} ${errorText}`);
      }

      const result: ApiResponse = await response.json();
      console.log('API result:', result);
      
      if (result.success) {
        setRequests(result.data.requests);
        setPagination(result.data.pagination);
      } else {
        throw new Error('API returned error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, page]);

  const handleAction = async (requestId: string, action: 'approve' | 'reject', reviewNotes?: string) => {
    try {
      const response = await fetch('/api/admin/store-change-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId, action, reviewNotes }),
      });

      if (response.ok) {
        // Refresh requests after successful action
        fetchRequests();
        alert(`Request ${action}d successfully!`);
      } else {
        const errorData = await response.json();
        alert(errorData.error || `Failed to ${action} request`);
      }
    } catch (err) {
      alert(`Failed to ${action} request`);
      console.error(`Error ${action}ing request:`, err);
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Store Change Requests</h1>
            <p className="text-sm text-neutral-400">
              Manage ASE, ABM, and ASA Canvasser store mapping change requests
            </p>
          </div>

          <button
            onClick={() => clientLogout('/login/role')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors shadow-lg self-start"
          >
            <FaSignOutAlt size={12} />
            Logout
          </button>
        </header>

        {/* Filters */}
        <section className="flex items-center gap-3">
          <select
            className="appearance-none bg-neutral-900 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-neutral-800"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="ALL">All Requests</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <button
            onClick={async () => {
              try {
                const response = await fetch('/api/test/create-request', { method: 'POST' });
                const result = await response.json();
                if (result.success) {
                  alert('Test request created successfully!');
                  fetchRequests(); // Refresh the list
                } else {
                  alert('Failed to create test request: ' + result.error);
                }
              } catch (err) {
                alert('Error creating test request: ' + err);
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            Create Test Request
          </button>
        </section>

        {/* Loading and Error States */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <span className="ml-3 text-white">Loading requests...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-200">
            <p className="font-semibold">Error loading data:</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={fetchRequests}
              className="mt-2 px-3 py-1 bg-red-700 hover:bg-red-600 rounded text-sm"
            >
              Retry
            </button>
          </div>
        )}

        {/* Requests List */}
        {!loading && !error && (
          <section className="space-y-4">
            {requests.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center text-gray-500">
                No store change requests found.
              </div>
            ) : (
              requests.map((request) => (
                <div key={request.id} className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.profile?.fullName || request.ase?.fullName || request.abm?.fullName || request.asaCanvasser?.fullName}
                        </h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          request.userRole === 'ASE' ? 'bg-blue-100 text-blue-800' : 
                          request.userRole === 'ABM' ? 'bg-purple-100 text-purple-800' :
                          request.userRole === 'ASA_CANVASSER' ? 'bg-green-100 text-green-800' :
                          request.ase ? 'bg-blue-100 text-blue-800' : 
                          request.abm ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {request.userRole || (request.ase ? 'ASE' : request.abm ? 'ABM' : 'ASA_CANVASSER')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {request.profile?.phone || request.ase?.phone || request.abm?.phone || request.asaCanvasser?.phone}
                      </p>
                      <p className="text-xs text-gray-500">
                        Submitted: {formatDate(request.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Current Stores</h4>
                      <div className="space-y-1">
                        {request.currentStores.length > 0 ? (
                          request.currentStores.map((store) => (
                            <div key={store.id} className="text-sm text-gray-600">
                              {store.name} {store.city && `- ${store.city}`}
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-gray-400">No stores currently mapped</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Requested Stores</h4>
                      <div className="space-y-1">
                        {request.requestedStores.map((store) => (
                          <div key={store.id} className="text-sm text-gray-600">
                            {store.name} {store.city && `- ${store.city}`}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {request.reason && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Reason</h4>
                      <p className="text-sm text-gray-600">{request.reason}</p>
                    </div>
                  )}

                  {request.reviewNotes && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Admin Notes</h4>
                      <p className="text-sm text-gray-600">{request.reviewNotes}</p>
                      {request.reviewedBy && request.reviewedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          Reviewed by {request.reviewedBy} on {formatDate(request.reviewedAt)}
                        </p>
                      )}
                    </div>
                  )}

                  {request.status === 'PENDING' && (
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => {
                          const notes = prompt('Add review notes (optional):');
                          handleAction(request.id, 'approve', notes || undefined);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          const notes = prompt('Add review notes (optional):');
                          handleAction(request.id, 'reject', notes || undefined);
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </section>
        )}

        {/* Pagination */}
        {!loading && !error && pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4 text-sm text-neutral-200">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page === 1}
              className="px-3 py-1 border border-neutral-700 rounded-lg disabled:opacity-40 text-neutral-100 bg-neutral-900 hover:bg-neutral-800"
            >
              Previous
            </button>
            <span className="px-3 py-1">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1 border border-neutral-700 rounded-lg disabled:opacity-40 text-neutral-100 bg-neutral-900 hover:bg-neutral-800"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}