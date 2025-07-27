import { useState, useEffect } from 'react'
import { X, Filter, Calendar, Users, Building, Globe, Activity, Target } from 'lucide-react'
import { THERAPEUTIC_AREAS } from '../constants/therapeuticAreas'

interface AdvancedFilterModalProps {
  isOpen: boolean
  onClose: () => void
  onApplyFilters: (filters: FilterState) => void
  currentFilters: FilterState
}

export interface FilterState {
  searchTerm: string
  priorityFilter: string
  therapeuticAreaFilter: string
  stageFilter: string
  // Advanced filters
  clientFilter: string
  geographyFilter: string
  aiStatusFilter: string
  workflowStageFilter: string
  targetAudienceFilter: string
  dateRangeFilter: {
    start: string
    end: string
  }
}

const TARGET_AUDIENCES = [
  'Healthcare Professionals',
  'Patients',
  'Caregivers',
  'Payers',
  'Policy Makers',
  'Medical Students'
]

const GEOGRAPHIES = [
  'United States',
  'Canada',
  'United Kingdom',
  'Germany',
  'France',
  'Italy',
  'Spain',
  'Japan',
  'China',
  'Australia',
  'Brazil',
  'Mexico',
  'India',
  'Global'
]

const AI_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'error', label: 'Error' }
]

const WORKFLOW_STAGES = [
  { value: 'draft', label: 'Draft' },
  { value: 'seo_review', label: 'SEO Review' },
  { value: 'client_review', label: 'Client Review' },
  { value: 'mlr_review', label: 'MLR Review' },
  { value: 'revision_requested', label: 'Revision Requested' },
  { value: 'approved', label: 'Approved' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' }
]

export default function AdvancedFilterModal({
  isOpen,
  onClose,
  onApplyFilters,
  currentFilters
}: AdvancedFilterModalProps) {
  const [filters, setFilters] = useState<FilterState>(currentFilters)

  useEffect(() => {
    setFilters(currentFilters)
  }, [currentFilters])

  const handleApply = () => {
    onApplyFilters(filters)
    onClose()
  }

  const handleReset = () => {
    const resetFilters: FilterState = {
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
    }
    setFilters(resetFilters)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Advanced Filters</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-8rem)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Building className="h-4 w-4" />
                Client Name
              </label>
              <input
                type="text"
                value={filters.clientFilter}
                onChange={(e) => setFilters({ ...filters, clientFilter: e.target.value })}
                placeholder="Search by client name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Geography */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Globe className="h-4 w-4" />
                Geography
              </label>
              <select
                value={filters.geographyFilter}
                onChange={(e) => setFilters({ ...filters, geographyFilter: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Geographies</option>
                {GEOGRAPHIES.map(geo => (
                  <option key={geo} value={geo}>{geo}</option>
                ))}
              </select>
            </div>

            {/* AI Processing Status */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Activity className="h-4 w-4" />
                AI Processing Status
              </label>
              <select
                value={filters.aiStatusFilter}
                onChange={(e) => setFilters({ ...filters, aiStatusFilter: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                {AI_STATUSES.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>

            {/* Workflow Stage */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Activity className="h-4 w-4" />
                Workflow Stage
              </label>
              <select
                value={filters.workflowStageFilter}
                onChange={(e) => setFilters({ ...filters, workflowStageFilter: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Stages</option>
                {WORKFLOW_STAGES.map(stage => (
                  <option key={stage.value} value={stage.value}>{stage.label}</option>
                ))}
              </select>
            </div>

            {/* Target Audience */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Target className="h-4 w-4" />
                Target Audience
              </label>
              <select
                value={filters.targetAudienceFilter}
                onChange={(e) => setFilters({ ...filters, targetAudienceFilter: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Audiences</option>
                {TARGET_AUDIENCES.map(audience => (
                  <option key={audience} value={audience}>{audience}</option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4" />
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">From</label>
                  <input
                    type="date"
                    value={filters.dateRangeFilter.start}
                    onChange={(e) => setFilters({
                      ...filters,
                      dateRangeFilter: { ...filters.dateRangeFilter, start: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">To</label>
                  <input
                    type="date"
                    value={filters.dateRangeFilter.end}
                    onChange={(e) => setFilters({
                      ...filters,
                      dateRangeFilter: { ...filters.dateRangeFilter, end: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Reset All
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
