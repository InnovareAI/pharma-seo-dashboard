import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import CTAButton from '../components/CTAButton'
import ExportModal from '../components/ExportModal'
import { exportReviewData } from '../utils/exportUtils'
import { THERAPEUTIC_AREAS } from '../constants/therapeuticAreas'
import { 
  Search,
  FileText,
  Shield,
  Calendar,
  Clock,
  Filter,
  Users,
  Building,
  ArrowRight,
  Eye,
  CheckCircle,
  Scale,
  XCircle,
  Grid3x3,
  List
} from 'lucide-react'
import { format } from 'date-fns'

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
  submitter_company?: string
  priority_level: string
  medical_indication?: string
  langchain_status?: string
  geography?: string[]
  client_name?: string
  mechanism_of_action?: string
  key_differentiators?: string[]
  client_review_responses?: any
  client_reviewed_at?: string
  client_reviewed_by?: string
  dosage_form?: string
  ai_output?: any
}

const STORAGE_KEYS = {
  SEARCH_TERM: 'mlr_review_search',
  PRIORITY_FILTER: 'mlr_review_priority',
  THERAPEUTIC_FILTER: 'mlr_review_therapeutic',
  STAGE_FILTER: 'mlr_review_stage',
  VIEW_MODE: 'mlr_review_view'
} as const

export default function MLRReview() {
  const navigate = useNavigate()
  const [showExportModal, setShowExportModal] = useState(false)
  
  // Initialize state from localStorage
  const [searchTerm, setSearchTerm] = useState(() => 
    localStorage.getItem(STORAGE_KEYS.SEARCH_TERM) || ''
  )
  const [priorityFilter, setPriorityFilter] = useState<string>(() => 
    localStorage.getItem(STORAGE_KEYS.PRIORITY_FILTER) || 'all'
  )
  const [therapeuticAreaFilter, setTherapeuticAreaFilter] = useState<string>(() => 
    localStorage.getItem(STORAGE_KEYS.THERAPEUTIC_FILTER) || 'all'
  )
  const [stageFilter, setStageFilter] = useState<string>(() => 
    localStorage.getItem(STORAGE_KEYS.STAGE_FILTER) || 'all'
  )
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => 
    (localStorage.getItem(STORAGE_KEYS.VIEW_MODE) as 'grid' | 'list') || 'grid'
  )

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SEARCH_TERM, searchTerm)
  }, [searchTerm])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRIORITY_FILTER, priorityFilter)
  }, [priorityFilter])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THERAPEUTIC_FILTER, therapeuticAreaFilter)
  }, [therapeuticAreaFilter])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STAGE_FILTER, stageFilter)
  }, [stageFilter])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VIEW_MODE, viewMode)
  }, [viewMode])

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['mlr-review-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('workflow_stage', 'mlr_review')
        .order('created_at', { ascending: true })
      
      if (error) throw error
      return data as Submission[]
    },
    refetchInterval: 30000
  })

  // Fetch submission statistics - same as Overview and ClientReview
  const { data: submissionStats } = useQuery({
    queryKey: ['mlr-submission-stats'],
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
    if (searchTerm && !submission.product_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !submission.therapeutic_area.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    if (priorityFilter !== 'all' && submission.priority_level.toLowerCase() !== priorityFilter) {
      return false
    }
    if (therapeuticAreaFilter !== 'all' && submission.therapeutic_area !== therapeuticAreaFilter) {
      return false
    }
    if (stageFilter !== 'all' && submission.stage !== stageFilter) {
      return false
    }
    return true
  }) || []

  const handleCardClick = (submissionId: string) => {
    navigate(`/mlr-review/${submissionId}`)
  }

  const handleExport = (format: 'csv' | 'pdf') => {
    exportReviewData(filteredSubmissions, format, {
      filename: 'mlr-review-report',
      title: 'MLR Review Report',
      type: 'mlr'
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Add reset filters function
  const resetFilters = () => {
    setSearchTerm('')
    setPriorityFilter('all')
    setTherapeuticAreaFilter('all')
    setStageFilter('all')
    // Clear localStorage
    localStorage.removeItem(STORAGE_KEYS.SEARCH_TERM)
    localStorage.removeItem(STORAGE_KEYS.PRIORITY_FILTER)
    localStorage.removeItem(STORAGE_KEYS.THERAPEUTIC_FILTER)
    localStorage.removeItem(STORAGE_KEYS.STAGE_FILTER)
  }

  const hasActiveFilters = searchTerm || 
    priorityFilter !== 'all' || 
    therapeuticAreaFilter !== 'all' || 
    stageFilter !== 'all'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
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
        title="Export MLR Review Report"
      />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">MLR Review</h1>
          <p className="text-sm text-gray-600 mt-1">Medical legal compliance review before publication</p>
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          <select
            value={therapeuticAreaFilter}
            onChange={(e) => setTherapeuticAreaFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Therapeutic Areas</option>
            {THERAPEUTIC_AREAS.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Stages</option>
            <option value="pre-launch">Pre-Launch</option>
            <option value="launch">Launch</option>
            <option value="post-launch">Post-Launch</option>
          </select>

          <div className="flex gap-2">
            {hasActiveFilters && (
              <CTAButton 
                variant="secondary" 
                icon={<XCircle className="h-4 w-4" />}
                onClick={resetFilters}
              >
                Reset
              </CTAButton>
            )}
            <CTAButton variant="secondary" icon={<Filter className="h-4 w-4" />}>
              More Filters
            </CTAButton>
          </div>
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
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                    {submission.product_name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{submission.therapeutic_area}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(submission.priority_level || 'medium')}`}>
                  {submission.priority_level || 'Medium'} Priority
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building className="h-4 w-4" />
                  <span>{('submitter_company' in submission ? submission.submitter_company : submission.client_name) || 'Pharma Corp'}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>{submission.target_audience?.join(', ') || 'Healthcare Professionals'}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Received {format(new Date(submission.created_at), 'MMM d, yyyy')}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-purple-600">
                  <Shield className="h-4 w-4" />
                  <span>Pending MLR Review</span>
                </div>

                {submission.client_review_responses?.roiConfidence && (
                  <div className="flex items-start gap-2 text-sm text-gray-600 bg-green-50 p-2 rounded">
                    <Scale className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-xs">Client Score: {submission.client_review_responses.roiConfidence}</span>
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
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
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
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Audience
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Received
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
                    {('submitter_company' in submission ? submission.submitter_company : submission.client_name) || 'Pharma Corp'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(submission.priority_level || 'medium')}`}>
                      {submission.priority_level || 'Medium'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {submission.target_audience?.join(', ') || 'Healthcare Professionals'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {submission.client_review_responses?.roiConfidence ? (
                      <div className="flex items-center gap-1">
                        <Scale className="h-4 w-4 text-green-600" />
                        {submission.client_review_responses.roiConfidence}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(submission.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleCardClick(submission.id)}
                      className="text-purple-600 hover:text-purple-900 flex items-center gap-1"
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
          <p className="text-gray-500">No content found for MLR review</p>
        </div>
      )}
    </div>
  )
}
