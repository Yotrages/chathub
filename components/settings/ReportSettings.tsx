import React from 'react';
import { Report } from '@/types';
import { X } from 'lucide-react';

interface ReportsSettingsProps {
  reports: Report[];
  showReportModal: boolean;
  setShowReportModal: (value: boolean) => void;
  reportForm: {
    reportType: 'spam' | 'harassment' | 'inappropriate_content' | 'fake_account' | 'copyright' | 'other';
    description: string;
    reportedUserId: string;
    reportedPostId: string;
    reportedCommentId: string;
  };
  setReportForm: (form: any) => void;
  submitReport: () => void;
  error: string | null;
}

export default function ReportsSettings({
  reports,
  setShowReportModal,
}: ReportsSettingsProps) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-white dark:from-gray-800 to-red-50 dark:to-gray-800 p-6 rounded-2xl border border-red-100 dark:border-red-900/50 shadow-lg hover:shadow-xl dark:shadow-lg dark:hover:shadow-xl transition-all duration-300">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg flex items-center justify-center mr-3">
              <X className="h-4 w-4 text-white" />
            </div>
            Report Abuse
          </h3>
          <button
            onClick={() => setShowReportModal(true)}
            className="mt-3 sm:mt-0 px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            Submit Report
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl dark:shadow-lg dark:hover:shadow-xl transition-all duration-300 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 dark:from-gray-700/50 to-gray-100 dark:to-gray-700/30">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">My Reports</h4>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {reports.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <X className="h-8 w-8 text-white" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">No reports submitted</p>
            </div>
          ) : (
            reports.map((report) => (
              <div key={report._id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 text-white capitalize shadow-sm">
                        {report.reportType.replace('_', ' ')}
                      </span>
                      <span className={`ml-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${
                        report.status === 'resolved' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 
                        report.status === 'dismissed' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' : 
                        'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                      }`}>
                        {report.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 dark:text-gray-200 font-medium mb-2">{report.description}</p>
                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                      <p>Submitted: {new Date(report.createdAt).toLocaleString()}</p>
                      {report.reportedUserId && (
                        <p>Reported User ID: {report.reportedUserId}</p>
                      )}
                      {report.reportedPostId && (
                        <p>Reported Post ID: {report.reportedPostId}</p>
                      )}
                      {report.reportedCommentId && (
                        <p>Reported Comment ID: {report.reportedCommentId}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}