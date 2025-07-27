import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import CTAButton from '../components/CTAButton'
import ExportModal from '../components/ExportModal'
import AdvancedFilterModal, { FilterState } from '../components/AdvancedFilterModal'
import { exportReviewData } from '../utils/exportUtils'
import { THERAPEUTIC_AREAS } from '../constants/therapeuticAreas'
import { 
  Search,
  FileText,
  Hash,
  Calendar,
  AlertCircle,
  Clock,
  Filter,
  Users,
  Building,
  ArrowRight,
  CheckCircle,
  XCircle,
  Grid3x3,
  List,
  Eye
} from 'lucide-react'
import { format, isWithinInterval, parseISO } from 'date-fns'

interface Submission {
  id: string
  product_name: string
  therapeutic_area: string
  stage: string
  workflow_stage: string
  target_audience: string[]
  created_at: string
  submitter_name: string
  submitter_email: string
  priority_level: string
  medical_indication?: string
  langchain_status?: string
  geography?: string[]
  client_name?: string
  mechanism_of_action?: string
  key_differentiators?: string[]
  seo_keywords?: string[]
  long_tail_keywords?: string[]
  consumer_questions?: string[]
  h1_tag?: string
  meta_title?: string
  meta_description?: string
  // AI-generated fields
  seo_title?: string
  geo_event_tags?: string[]
  h2_tags?: string[]
  seo_strategy_outline?: string
  geo_optimization_score?: number
  ai_processing_status?: string
  ai_output?: any
}

export default function SEOReview() {
  const navigate = useNavigate()
  const [showExportModal, setShowExportModal] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  
  // Initialize viewMode from localStorage or default to 'grid'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    const savedViewMode = localStorage.getItem('seoReviewViewMode')
    return (savedViewMode === 'list' || savedViewMode === 'grid') ? savedViewMode : 'grid'
  })

  // Initialize filter state
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    priorityFilter: 'all',
    therapeuticAreaFilter: 'all',
    stageFilter: 'all',
    clientFilter: '',
    geographyFilter: 'all',
    aiStatusFilter: 'all',
    workflowStageFilter: 'all',
    targetAudienceFilter: 'all',
    dateRangeFilter: {
      start: '',
      end: ''
    }
  })

  // Save viewMode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('seoReviewViewMode', viewMode)
  }, [viewMode])

  const { data: submissions, isLoading, error } = useQuery({
    queryKey: ['seo-review-queue'],
    queryFn: async () => {
      console.log('Fetching submissions from Supabase...')
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100) // Ensure we get all data
      
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      console.log('Fetched submissions:', data?.length, 'records')
      return data as Submission[]
    },
    refetchInterval: 30000
  })

  // Fetch submission statistics
  const { data: submissionStats } = useQuery({
    queryKey: ['seo-submission-stats'],
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

  // Log any query errors
  useEffect(() => {
    if (error) {
      console.error('Query error:', error)
    }
  }, [error])

  const filteredSubmissions = submissions?.filter(submission => {
    // Search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      const nameMatch = submission.product_name?.toLowerCase().includes(searchLower)
      const areaMatch = submission.therapeutic_area?.toLowerCase().includes(searchLower)
      const clientMatch = submission.client_name?.toLowerCase().includes(searchLower)
      if (!nameMatch && !areaMatch && !clientMatch) {
        return false
      }
    }
    
    // Priority filter
    if (filters.priorityFilter !== 'all') {
      const submissionPriority = submission.priority_level?.toLowerCase() || 'medium'
      if (submissionPriority !== filters.priorityFilter) {
        return false
      }
    }
    
    // Therapeutic area filter
    if (filters.therapeuticAreaFilter !== 'all') {
      const submissionArea = submission.therapeutic_area || 'Not specified'
      if (submissionArea !== filters.therapeuticAreaFilter) {
        return false
      }
    }
    
    // Stage filter
    if (filters.stageFilter !== 'all') {
      const submissionStage = submission.stage || 'pre-launch'
      if (submissionStage !== filters.stageFilter) {
        return false
      }
    }
    
    // Client filter (text search)
    if (filters.clientFilter) {
      const clientName = submission.client_name?.toLowerCase() || ''
      if (!clientName.includes(filters.clientFilter.toLowerCase())) {
        return false
      }
    }
    
    // Geography filter
    if (filters.geographyFilter !== 'all') {
      const geographies = submission.geography || []
      if (!geographies.includes(filters.geographyFilter)) {
        return false
      }
    }
    
    // AI Status filter
    if (filters.aiStatusFilter !== 'all') {
      const aiStatus = submission.ai_processing_status || 'pending'
      if (aiStatus !== filters.aiStatusFilter) {
        return false
      }
    }
    
    // Workflow Stage filter
    if (filters.workflowStageFilter !== 'all') {
      const workflowStage = submission.workflow_stage || 'draft'
      if (workflowStage !== filters.workflowStageFilter) {
        return false
      }
    }
    
    // Target Audience filter
    if (filters.targetAudienceFilter !== 'all') {
      const audiences = submission.target_audience || []
      if (!audiences.includes(filters.targetAudienceFilter)) {
        return false
      }
    }
    
    // Date range filter
    if (filters.dateRangeFilter.start || filters.dateRangeFilter.end) {
      const submissionDate = parseISO(submission.created_at)
      const startDate = filters.dateRangeFilter.start ? parseISO(filters.dateRangeFilter.start) : new Date(0)
      const endDate = filters.dateRangeFilter.end ? parseISO(filters.dateRangeFilter.end) : new Date()
      
      if (!isWithinInterval(submissionDate, { start: startDate, end: endDate })) {
        return false
      }
    }
    
    return true
  }) || []

  const handleCardClick = (submissionId: string) => {
    navigate(`/seo-review/${submissionId}`)
  }

  const handleExport = (format: 'csv' | 'pdf') => {
    exportReviewData(filteredSubmissions, format, {
      filename: 'seo-review-report',
      title: 'SEO Review Report'
    })
  }

  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'text-red-700 bg-red-50 ring-red-600/20'
      case 'medium':
        return 'text-amber-700 bg-amber-50 ring-amber-600/20'
      case 'low':
        return 'text-green-700 bg-green-50 ring-green-600/20'
      default:
        return 'text-gray-700 bg-gray-50 ring-gray-600/20'
    }
  }

  const getProcessingStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'text-green-700 bg-green-50'
      case 'processing':
        return 'text-blue-700 bg-blue-50'
      case 'error':
        return 'text-red-700 bg-red-50'
      default:
        return 'text-gray-700 bg-gray-50'
    }
  }

  const activeFilterCount = () => {
    let count = 0
    if (filters.searchTerm) count++
    if (filters.priorityFilter !== 'all') count++
    if (filters.therapeuticAreaFilter !== 'all') count++
    if (filters.stageFilter !== 'all') count++
    if (filters.clientFilter) count++
    if (filters.geographyFilter !== 'all') count++
    if (filters.aiStatusFilter !== 'all') count++
    if (filters.workflowStageFilter !== 'all') count++
    if (filters.targetAudienceFilter !== 'all') count++
    if (filters.dateRangeFilter.start || filters.dateRangeFilter.end) count++
    return count
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
        title="Export SEO Review Report"
      />

      {/* Advanced Filter Modal */}
      <AdvancedFilterModal
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={filters}
      />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SEO Review</h1>
          <p className="text-sm text-gray-600 mt-1">Review and optimize AI-generated content for search performance</p>
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
              value={filters.searchTerm}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filters.priorityFilter}
            onChange={(e) => setFilters({ ...filters, priorityFilter: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          <select
            value={filters.therapeuticAreaFilter}
            onChange={(e) => setFilters({ ...filters, therapeuticAreaFilter: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Therapeutic Areas</option>
            <option value="Not specified">Not specified</option>
            {THERAPEUTIC_AREAS.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>

          <select
            value={filters.stageFilter}
            onChange={(e) => setFilters({ ...filters, stageFilter: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Stages</option>
            <option value="pre-launch">Pre-Launch</option>
            <option value="launch">Launch</option>
            <option value="post-launch">Post-Launch</option>
          </select>

          <CTAButton 
            variant="secondary" 
            icon={<Filter className="h-4 w-4" />}
            onClick={() => setShowAdvancedFilters(true)}
          >
            More Filters{activeFilterCount() > 0 && ` (${activeFilterCount()})`}
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
                  <p className="text-sm text-gray-600 mt-1">{submission.therapeutic_area || 'Not specified'}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(submission.priority_level || 'medium')}`}>
                  {submission.priority_level || 'Medium'} Priority
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building className="h-4 w-4" />
                  <span>{submission.client_name || 'Pharma Corp'}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>{Array.isArray(submission.target_audience) ? submission.target_audience.join(', ') : 'Healthcare Professionals'}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Submitted {format(new Date(submission.created_at), 'MMM d, yyyy')}</span>
                </div>

                {/* Show AI processing status */}
                {submission.ai_processing_status && (
                  <div className={`flex items-center gap-2 text-sm px-2 py-1 rounded ${getProcessingStatusColor(submission.ai_processing_status)}`}>
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">AI Status: {submission.ai_processing_status}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Hash className="h-4 w-4" />
                  <span>{submission.seo_keywords?.length || 0} keywords • {submission.long_tail_keywords?.length || 0} long-tail</span>
                </div>

                {/* Display AI-generated SEO title if available */}
                {submission.seo_title && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-medium">SEO Title: {submission.seo_title}</span>
                  </div>
                )}

                {/* Display GEO event tags if available */}
                {submission.geo_event_tags && submission.geo_event_tags.length > 0 && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <Hash className="h-4 w-4 text-blue-600" />
                    <span className="text-xs">Events: {submission.geo_event_tags.join(', ')}</span>
                  </div>
                )}

                {submission.medical_indication && (
                  <div className="flex items-start gap-2 text-sm text-gray-600 bg-blue-50 p-2 rounded">
                    <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                    <span className="text-xs">{submission.medical_indication.substring(0, 100)}...</span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {submission.workflow_stage === 'seo_review' ? 'Ready for review' : `Stage: ${submission.workflow_stage}`}
                </span>
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
                  Keywords
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AI Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
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
                      <div className="text-sm text-gray-500">{submission.therapeutic_area || 'Not specified'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {submission.client_name || 'Pharma Corp'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(submission.priority_level || 'medium')}`}>
                      {submission.priority_level || 'Medium'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {submission.seo_keywords?.length || 0} / {submission.long_tail_keywords?.length || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {submission.ai_processing_status && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getProcessingStatusColor(submission.ai_processing_status)}`}>
                        {submission.ai_processing_status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(submission.created_at), 'MMM d, yyyy')}
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
          <p className="text-gray-500">No submissions found</p>
          <p className="text-sm text-gray-400 mt-2">Try adjusting your filters</p>
        </div>
      )}
    </div>
  )
}
