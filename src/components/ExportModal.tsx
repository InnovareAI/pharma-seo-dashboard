import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, FileText, Download } from 'lucide-react'
import CTAButton from './CTAButton'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  onExport: (format: 'csv' | 'pdf') => void
  title?: string
}

export default function ExportModal({ isOpen, onClose, onExport, title = "Export Report" }: ExportModalProps) {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                      <div className="flex justify-between items-start">
                        <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                          {title}
                        </Dialog.Title>
                        <button
                          type="button"
                          className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                          onClick={onClose}
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                      
                      <div className="mt-6">
                        <p className="text-sm text-gray-500 mb-6">
                          Choose your preferred export format:
                        </p>
                        
                        <div className="space-y-3">
                          <button
                            onClick={() => {
                              onExport('csv')
                              onClose()
                            }}
                            className="w-full flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                                <FileText className="h-6 w-6 text-green-600" />
                              </div>
                              <div className="text-left">
                                <h4 className="font-medium text-gray-900">CSV Export</h4>
                                <p className="text-sm text-gray-500">Download data in spreadsheet format</p>
                              </div>
                            </div>
                            <Download className="h-5 w-5 text-gray-400 group-hover:text-purple-600" />
                          </button>

                          <button
                            onClick={() => {
                              onExport('pdf')
                              onClose()
                            }}
                            className="w-full flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                                <FileText className="h-6 w-6 text-red-600" />
                              </div>
                              <div className="text-left">
                                <h4 className="font-medium text-gray-900">PDF Report</h4>
                                <p className="text-sm text-gray-500">Download formatted report document</p>
                              </div>
                            </div>
                            <Download className="h-5 w-5 text-gray-400 group-hover:text-purple-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <CTAButton
                    variant="secondary"
                    onClick={onClose}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </CTAButton>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
