import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import CTAButton from '@/components/CTAButton'
import ExportModal from '@/components/ExportModal'
import { exportReviewData } from '@/utils/exportUtils'
import { 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  Building,
  Calendar,
  MessageSquare,
  FileText,
  Users,
  Edit3,
  Eye,
  XCircle,
  Grid3x3,
  List
} from 'lucide-react'
import { format } from 'date-fns'

export default function ClientReview() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [selectedClient, setSelectedClient] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showExportModal, setShowExportModal] = useState(false)
  
  // Initialize viewMode from localStorage or default to 'grid'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    const savedViewMode = localStorage.getItem('clientReviewViewMode')
    return (savedViewMode === 'list' || savedViewMode === 'grid') ? savedViewMode : 'grid'
  })

  // Save viewMode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('clientReviewViewMode', viewMode)
  }, [viewMode])

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['client-review-content', { searchQuery, selectedPriority, selectedClient, selectedStatus }],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('workflow_stage', 'client_review')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    }
  })

  // Fetch submission statistics
  const { data: submissionStats } = useQuery({
    queryKey: ['client-submission-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('submissions')
        .select('workflow_stage, ai_processing_status')
      
      if (error) throw error
      
      const stats = {
        total: data.length,
        processed: data.filter(s => 
          s.ai_processing_status === 'completed' || 
          s.workflow_stage === 'seo_review' || 
          s.workflow_stage === 'client_review' || 
          s.workflow_stage === 'mlr_review' ||
          s.workflow_stage === 'revision_requested' ||
          s.workflow_stage === 'approved' ||
          s.workflow_stage === 'completed'
        ).length,
        approved: data.filter(s => 
          s.workflow_stage === 'approved' || 
          s.workflow_stage === 'completed'
        ).length,
        rejected: data.filter(s => s.workflow_stage === 'rejected').length
      }
      
      return stats
    }
  })

  const filteredSubmissions = submissions?.filter(submission => {
    const matchesSearch = !searchQuery || 
      submission.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.therapeutic_area?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesPriority = selectedPriority === 'all' || submission.priority_level === selectedPriority
    const matchesClient = selectedClient === 'all' || submission.sponsor_name === selectedClient
    const matchesStatus = selectedStatus === 'all' || submission.client_review_status === selectedStatus
    
    return matchesSearch && matchesPriority && matchesClient && matchesStatus
  })

  const handleExport = (format: 'csv' | 'pdf') => {
    exportReviewData(filteredSubmissions || [], format, {
      filename: 'client-review-report',
      title: 'Client Review Report'
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'revision_requested': return <Edit3 className="h-5 w-5 text-yellow-600" />
      default: return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600'
      case 'revision_requested': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  const handleCardClick = (id: string) => {
    navigate(`/client-review/${id}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title="Export Client Review Report"
      />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Review</h1>
          <p className="text-sm text-gray-600 mt-1">Review and approve SEO-optimized content with clients</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid3x3 className="h-4 w-4" />
              <span className="text-sm font-medium">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="h-4 w-4" />
              <span className="text-sm font-medium">List</span>
            </button>
          </div>
          <CTAButton 
            variant="primary" 
            icon={<FileText className="h-4 w-4" />}
            onClick={() => setShowExportModal(true)}
          >
            Export Report
          </CTAButton>
        </div>
      </div>

      {/* Stats Cards - Updated to match Overview format */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{submissionStats?.total || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Processed</p>
              <p className="text-2xl font-semibold text-green-600 mt-1">{submissionStats?.processed || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-semibold text-indigo-600 mt-1">{submissionStats?.approved || 0}</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-semibold text-red-600 mt-1">{submissionStats?.rejected || 0}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Clients</option>
            {[...new Set(submissions?.map(s => s.sponsor_name || s.client_name).filter(Boolean))].map(client => (
              <option key={client} value={client}>{client}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="revision_requested">Revision Requested</option>
          </select>

          <CTAButton variant="secondary" icon={<Filter className="h-4 w-4" />}>
            More Filters
          </CTAButton>
        </div>
      </div>

      {/* Content Display - Grid or List based on viewMode */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubmissions?.map((submission) => (
            <div
              key={submission.id}
              onClick={() => handleCardClick(submission.id)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {submission.product_name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{submission.therapeutic_area}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(submission.priority_level || 'medium')}`}>
                  {(submission.priority_level || 'medium').charAt(0).toUpperCase() + (submission.priority_level || 'medium').slice(1)} Priority
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building className="h-4 w-4" />
                  <span>{submission.sponsor_name || submission.client_name || 'Pharma Corp'}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>{submission.target_audience || 'Healthcare Professionals'}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Sent {new Date(submission.client_approval_date || submission.created_at).toLocaleDateString()}</span>
                </div>

                <div className={`flex items-center gap-2 text-sm ${getStatusColor(submission.client_review_status || 'pending')}`}>
                  {getStatusIcon(submission.client_review_status || 'pending')}
                  <span className="capitalize">{(submission.client_review_status || 'pending').replace('_', ' ')}</span>
                </div>

                {submission.client_feedback && (
                  <div className="flex items-start gap-2 text-sm text-gray-600 bg-yellow-50 p-2 rounded">
                    <MessageSquare className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <span className="text-xs">{submission.client_feedback}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <CTAButton
                  size="sm"
                  variant="secondary"
                  icon={<Eye className="h-3 w-3" />}
                >
                  View Details
                </CTAButton>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Audience
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Sent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubmissions?.map((submission) => (
                <tr key={submission.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{submission.product_name}</div>
                      <div className="text-sm text-gray-500">{submission.therapeutic_area}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {submission.sponsor_name || submission.client_name || 'Pharma Corp'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(submission.priority_level || 'medium')}`}>
                      {(submission.priority_level || 'medium').charAt(0).toUpperCase() + (submission.priority_level || 'medium').slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {submission.target_audience || 'Healthcare Professionals'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`flex items-center gap-1 text-sm ${getStatusColor(submission.client_review_status || 'pending')}`}>
                      {getStatusIcon(submission.client_review_status || 'pending')}
                      <span className="capitalize">{(submission.client_review_status || 'pending').replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(submission.client_approval_date || submission.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleCardClick(submission.id)}
                      className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredSubmissions?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No content found for client review</p>
        </div>
      )}
    </div>
  )
}
