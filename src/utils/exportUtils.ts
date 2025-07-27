import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import { format } from 'date-fns'

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

interface ExportData {
  id: string
  product_name: string
  therapeutic_area: string
  stage?: string
  workflow_stage: string
  priority_level: string
  submitter_company?: string
  client_name?: string
  target_audience?: string[]
  created_at: string
  client_review_responses?: any
  [key: string]: any
}

export function exportToCSV(data: ExportData[], filename: string = 'mlr-review-export') {
  if (!data || data.length === 0) {
    alert('No data to export')
    return
  }

  // Define columns to export
  const headers = [
    'Product Name',
    'Therapeutic Area',
    'Stage',
    'Workflow Stage',
    'Priority',
    'Company',
    'Target Audience',
    'Client Score',
    'Submitted Date'
  ]

  // Convert data to CSV format
  const csvContent = [
    headers.join(','),
    ...data.map(row => [
      `"${row.product_name || ''}"`,
      `"${row.therapeutic_area || ''}"`,
      `"${row.stage || ''}"`,
      `"${row.workflow_stage || ''}"`,
      `"${row.priority_level || 'medium'}"`,
      `"${row.submitter_company || row.client_name || ''}"`,
      `"${row.target_audience?.join('; ') || ''}"`,
      `"${row.client_review_responses?.roiConfidence || ''}"`,
      `"${format(new Date(row.created_at), 'yyyy-MM-dd')}"`,
    ].join(','))
  ].join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportToPDF(data: ExportData[], filename: string = 'mlr-review-report', title: string = 'MLR Review Report') {
  if (!data || data.length === 0) {
    alert('No data to export')
    return
  }

  const doc = new jsPDF('l', 'mm', 'a4') // landscape orientation

  // Add title
  doc.setFontSize(20)
  doc.text(title, 14, 15)
  
  // Add date
  doc.setFontSize(10)
  doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy')}`, 14, 25)
  
  // Add summary stats
  const totalSubmissions = data.length
  const highPriority = data.filter(d => d.priority_level?.toLowerCase() === 'high').length
  const mediumPriority = data.filter(d => d.priority_level?.toLowerCase() === 'medium').length
  const lowPriority = data.filter(d => d.priority_level?.toLowerCase() === 'low').length
  
  doc.setFontSize(12)
  doc.text(`Total Submissions: ${totalSubmissions}`, 14, 35)
  doc.text(`High Priority: ${highPriority} | Medium Priority: ${mediumPriority} | Low Priority: ${lowPriority}`, 14, 42)

  // Prepare table data
  const tableHeaders = [
    'Product',
    'Therapeutic Area',
    'Stage',
    'Priority',
    'Company',
    'Target Audience',
    'Client Score',
    'Submitted'
  ]

  const tableData = data.map(row => [
    row.product_name || '',
    row.therapeutic_area || '',
    row.stage || '',
    row.priority_level || 'medium',
    row.submitter_company || row.client_name || '',
    row.target_audience?.join(', ') || '',
    row.client_review_responses?.roiConfidence || '-',
    format(new Date(row.created_at), 'MMM d, yyyy')
  ])

  // Add table
  doc.autoTable({
    head: [tableHeaders],
    body: tableData,
    startY: 50,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [147, 51, 234], // Purple color matching the app theme
      textColor: 255,
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251], // Light gray
    },
    columnStyles: {
      0: { cellWidth: 40 }, // Product
      1: { cellWidth: 35 }, // Therapeutic Area
      2: { cellWidth: 25 }, // Stage
      3: { cellWidth: 20 }, // Priority
      4: { cellWidth: 35 }, // Company
      5: { cellWidth: 50 }, // Target Audience
      6: { cellWidth: 20 }, // Client Score
      7: { cellWidth: 25 }, // Submitted
    },
  })

  // Add footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    )
  }

  // Save the PDF
  doc.save(`${filename}-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
}

// Export function for other review pages (SEO, Client)
export function exportReviewData(
  data: any[],
  format: 'csv' | 'pdf',
  options: {
    filename?: string
    title?: string
  } = {}
) {
  const { 
    filename = 'review-export', 
    title = 'Review Report'
  } = options

  if (format === 'csv') {
    exportToCSV(data, filename)
  } else {
    exportToPDF(data, filename, title)
  }
}
