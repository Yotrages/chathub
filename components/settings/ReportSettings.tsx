import React from 'react';
import { Report } from '@/types';

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
//   showReportModal,
  setShowReportModal,
//   reportForm,
//   setReportForm,
//   submitReport,
//   error,
}: ReportsSettingsProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Report Abuse</h3>
        <button
          onClick={() => setShowReportModal(true)}
          className="mt-2 sm:mt-0 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
        >
          Submit Report
        </button>
      </div>
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h4 className="text-md font-medium text-gray-900">My Reports</h4>
        </div>
        <div className="divide-y divide-gray-200">
          {reports.length === 0 ? (
            <div className="px-4 sm:px-6 py-8 text-center text-gray-500">
              No reports submitted
            </div>
          ) : (
            reports.map((report) => (
              <div key={report._id} className="px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                      {report.reportType.replace('_', ' ')}
                    </span>
                    <p className="mt-1 text-sm text-gray-600">{report.description}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Status: <span className={`capitalize ${report.status === 'resolved' ? 'text-green-600' : report.status === 'dismissed' ? 'text-red-600' : 'text-yellow-600'}`}>
                        {report.status}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Submitted: {new Date(report.createdAt).toLocaleString()}
                    </p>
                    {report.reportedUserId && (
                      <p className="mt-1 text-xs text-gray-500">Reported User ID: {report.reportedUserId}</p>
                    )}
                    {report.reportedPostId && (
                      <p className="mt-1 text-xs text-gray-500">Reported Post ID: {report.reportedPostId}</p>
                    )}
                    {report.reportedCommentId && (
                      <p className="mt-1 text-xs text-gray-500">Reported Comment ID: {report.reportedCommentId}</p>
                    )}
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