import React from 'react';
import { Download, Globe, Trash2 } from 'lucide-react';
import { UserSettings } from '@/types';
import { api } from '@/libs/axios/config';

interface AccountSettingsProps {
  settings: UserSettings;
  fetchSettings: () => void;
  deactivateAccount: () => void;
  scheduleDelete: () => void;
  requestDataDownload: () => void;
}

export default function AccountSettings({
  settings,
  fetchSettings,
  deactivateAccount,
  scheduleDelete,
  requestDataDownload,
}: AccountSettingsProps) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-white dark:from-gray-800 to-blue-50 dark:to-gray-800 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/50 shadow-lg hover:shadow-xl dark:shadow-lg dark:hover:shadow-xl transition-all duration-300">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
            <Globe className="h-4 w-4 text-white" />
          </div>
          Account Status
        </h3>
        {settings.account?.isDeactivated ? (
          <div className="p-5 bg-gradient-to-r from-yellow-50 dark:from-yellow-900/20 to-orange-50 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded-xl shadow-inner">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
              Your account is currently deactivated.
              {settings.account.deactivatedAt && (
                <span className="block mt-2 text-xs opacity-80">
                  Deactivated on: {new Date(settings.account.deactivatedAt).toLocaleDateString()}
                </span>
              )}
            </p>
            <button
              onClick={async () => {
                try {
                  await api.post('/settings/reactivate');
                  fetchSettings();
                } catch (error) {
                  console.error('Error reactivating account:', error);
                }
              }}
              className="mt-4 px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              Reactivate Account
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-900/50">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-sm text-green-800 dark:text-green-200 font-medium">Your account is active and healthy</p>
            </div>
            <button
              onClick={deactivateAccount}
              className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl hover:from-yellow-600 hover:to-orange-600 text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              Deactivate Account
            </button>
          </div>
        )}
        {settings.account?.deleteScheduledAt && (
          <div className="mt-6 p-5 bg-gradient-to-r from-red-50 dark:from-red-900/20 to-pink-50 dark:to-pink-900/20 border border-red-200 dark:border-red-900/50 rounded-xl shadow-inner">
            <p className="text-sm text-red-800 dark:text-red-200 font-medium">
              Account deletion scheduled for: {new Date(settings.account.deleteScheduledAt).toLocaleDateString()}
            </p>
            <button
              onClick={async () => {
                try {
                  await api.post('/settings/cancel-delete');
                  fetchSettings();
                } catch (error) {
                  console.error('Error canceling deletion:', error);
                }
              }}
              className="mt-3 px-6 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              Cancel Deletion
            </button>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-white dark:from-gray-800 to-indigo-50 dark:to-gray-800 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 shadow-lg hover:shadow-xl dark:shadow-lg dark:hover:shadow-xl transition-all duration-300">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
            <Download className="h-4 w-4 text-white" />
          </div>
          Data Management
        </h3>
        <div className="space-y-4">
          <button
            onClick={requestDataDownload}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <Download className="h-4 w-4 mr-2" />
            Request Data Download
          </button>
          <div className="text-sm text-gray-700 dark:text-gray-300 p-4 bg-white/70 dark:bg-gray-700/50 rounded-xl border border-blue-100 dark:border-blue-900/50 transition-colors duration-200">
            <p>Download a comprehensive archive of your data including posts, messages, and profile information.</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-2xl border border-red-200 shadow-lg hover:shadow-xl transition-all duration-300">
        <h3 className="text-xl font-semibold text-red-600 mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg flex items-center justify-center mr-3">
            <Trash2 className="h-4 w-4 text-white" />
          </div>
          Danger Zone
        </h3>
        <div className="space-y-4">
          <button
            onClick={scheduleDelete}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Account
          </button>
          <div className="text-sm text-gray-700 dark:text-gray-300 p-4 bg-white/70 dark:bg-gray-700/50 rounded-xl border border-red-200 dark:border-red-900/50 transition-colors duration-200">
            <p>Permanently delete your account and all associated data. This action cannot be undone after 30 days.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
