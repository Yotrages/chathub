import React from 'react';
import { Download, Trash2 } from 'lucide-react';
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
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Account Status</h3>
        {settings.account.isDeactivated ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              Your account is currently deactivated.
              {settings.account.deactivatedAt && (
                <span className="block mt-1">
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
              className="mt-3 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
            >
              Reactivate Account
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Your account is active</p>
            <button
              onClick={deactivateAccount}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm"
            >
              Deactivate Account
            </button>
          </div>
        )}
        {settings.account.deleteScheduledAt && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
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
              className="mt-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
            >
              Cancel Deletion
            </button>
          </div>
        )}
      </div>
      <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Data Management</h3>
        <div className="space-y-4">
          <button
            onClick={requestDataDownload}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Request Data Download
          </button>
          <div className="text-sm text-gray-600">
            <p>Download a copy of your data including posts, messages, and profile information.</p>
          </div>
        </div>
      </div>
      <div className="bg-white p-4 sm:p-6 rounded-lg border border-red-200">
        <h3 className="text-lg font-medium text-red-600 mb-4">Danger Zone</h3>
        <div className="space-y-4">
          <button
            onClick={scheduleDelete}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Account
          </button>
          <div className="text-sm text-gray-600">
            <p>Permanently delete your account and all associated data. This action cannot be undone after 30 days.</p>
          </div>
        </div>
      </div>
    </div>
  );
}