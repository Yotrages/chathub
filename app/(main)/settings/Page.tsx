'use client';
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { api } from '@/libs/axios/config';
import PrivacySettings from '@/components/settings/PrivacySettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import AppearanceSettings from '@/components/settings/AppearanceSettings';
import SecuritySettings from '@/components/settings/SecuritySettings';
import ContentSettings from '@/components/settings/ContentSettings';
import AccountSettings from '@/components/settings/AccountSettings';
import ReportsSettings from '@/components/settings/ReportSettings';
import { Report, UserSettings } from '@/types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [activeTab, setActiveTab] = useState('privacy');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({
    reportType: 'spam' as 'spam' | 'harassment' | 'inappropriate_content' | 'fake_account' | 'copyright' | 'other',
    description: '',
    reportedUserId: '',
    reportedPostId: '',
    reportedCommentId: '',
  });
  const [error, setError] = useState<string | null>(null);

  const tabs = [
    { id: 'privacy', label: 'Privacy', icon: 'Eye' },
    { id: 'notifications', label: 'Notifications', icon: 'Bell' },
    { id: 'appearance', label: 'Appearance', icon: 'Palette' },
    { id: 'security', label: 'Security', icon: 'Shield' },
    { id: 'content', label: 'Content', icon: 'Filter' },
    { id: 'account', label: 'Account', icon: 'User' },
    { id: 'reports', label: 'Reports', icon: 'Flag' },
  ];

  useEffect(() => {
    fetchSettings();
    fetchReports();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError('Failed to load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const response = await api.get('/settings/my-reports');
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('Failed to load reports. Please try again.');
    }
  };

  const updateSettings = async (section: string, settingsData: any) => {
    setSaving(true);
    setError(null);
    try {
      const response = await api.put(`/settings/${section}`, settingsData); 
      setSettings(response.data);
    } catch (error) {
      console.error(`Error updating ${section} settings:`, error);
      setError(`Failed to update ${section} settings. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  const uploadBackground = async (file: File) => {
    setError(null);
    const formData = new FormData();
    formData.append('background', file);
    try {
      const response = await api.post('/settings/background', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSettings(response.data);
    } catch (error) {
      console.error('Error uploading background:', error);
      setError('Failed to upload background image. Please try again.');
    }
  };

  const submitReport = async () => {
    if (!reportForm.description || reportForm.description.length < 10) {
      setError('Description must be at least 10 characters');
      return;
    }
    setError(null);
    try {
      const response = await api.post('/settings/report', {
        ...reportForm,
        reportedUserId: reportForm.reportedUserId || undefined,
        reportedPostId: reportForm.reportedPostId || undefined,
        reportedCommentId: reportForm.reportedCommentId || undefined,
      });
      if (response.status === 201) {
        setShowReportModal(false);
        setReportForm({ reportType: 'spam', description: '', reportedUserId: '', reportedPostId: '', reportedCommentId: '' });
        fetchReports();
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      setError('Failed to submit report. Please try again.');
    }
  };

  const deactivateAccount = async () => {
    if (confirm('Are you sure you want to deactivate your account?')) {
      setError(null);
      try {
        const response = await api.post('/settings/deactivate');
        setSettings(response.data);
      } catch (error) {
        console.error('Error deactivating account:', error);
        setError('Failed to deactivate account. Please try again.');
      }
    }
  };

  const scheduleDelete = async () => {
    if (confirm('Are you sure you want to schedule account deletion? This action cannot be undone after 30 days.')) {
      setError(null);
      try {
        const response = await api.post('/settings/schedule-delete');
        setSettings(response.data);
      } catch (error) {
        console.error('Error scheduling deletion:', error);
        setError('Failed to schedule deletion. Please try again.');
      }
    }
  };

  const requestDataDownload = async () => {
    setError(null);
    try {
      const response = await api.post('/settings/request-data');
      setSettings(response.data);
      alert('Data download request submitted. You will receive an email when ready.');
    } catch (error) {
      console.error('Error requesting data download:', error);
      setError('Failed to request data download. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Failed to load settings</h2>
          <button
            onClick={fetchSettings}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Settings</h1>
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          <div className="w-full lg:w-1/4">
            <div className="bg-white rounded-lg border border-gray-200">
              {tabs.map((tab) => {
                const Icon = require('lucide-react')[tab.icon];
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="w-full lg:w-3/4 relative">
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
              {saving && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}
              {activeTab === 'privacy' && <PrivacySettings settings={settings} updateSettings={updateSettings} />}
              {activeTab === 'notifications' && <NotificationSettings settings={settings} updateSettings={updateSettings} />}
              {activeTab === 'appearance' && <AppearanceSettings settings={settings} updateSettings={updateSettings} uploadBackground={uploadBackground} />}
              {activeTab === 'security' && <SecuritySettings settings={settings} updateSettings={updateSettings} />}
              {activeTab === 'content' && <ContentSettings settings={settings} updateSettings={updateSettings} setError={setError} />}
              {activeTab === 'account' && (
                <AccountSettings
                  settings={settings}
                  fetchSettings={fetchSettings}
                  deactivateAccount={deactivateAccount}
                  scheduleDelete={scheduleDelete}
                  requestDataDownload={requestDataDownload}
                />
              )}
              {activeTab === 'reports' && (
                <ReportsSettings
                  reports={reports}
                  showReportModal={showReportModal}
                  setShowReportModal={setShowReportModal}
                  reportForm={reportForm}
                  setReportForm={setReportForm}
                  submitReport={submitReport}
                  error={error}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Submit a Report</h3>
              <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                <select
                  value={reportForm.reportType}
                  onChange={(e) => setReportForm({ ...reportForm, reportType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="spam">Spam</option>
                  <option value="harassment">Harassment</option>
                  <option value="inappropriate_content">Inappropriate Content</option>
                  <option value="fake_account">Fake Account</option>
                  <option value="copyright">Copyright Violation</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reported Item</label>
                <input
                  type="text"
                  placeholder="User ID (optional)"
                  value={reportForm.reportedUserId}
                  onChange={(e) => setReportForm({ ...reportForm, reportedUserId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="Post ID (optional)"
                  value={reportForm.reportedPostId}
                  onChange={(e) => setReportForm({ ...reportForm, reportedPostId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mt-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="Comment ID (optional)"
                  value={reportForm.reportedCommentId}
                  onChange={(e) => setReportForm({ ...reportForm, reportedCommentId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mt-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={reportForm.description}
                  onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  maxLength={1000}
                ></textarea>
                <p className="text-xs text-gray-500 mt-1">
                  {reportForm.description.length}/1000 characters
                </p>
              </div>
              {error && (
                <div className="p-2 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={submitReport}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                >
                  Submit Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}