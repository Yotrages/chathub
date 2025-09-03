import React from 'react';
import { UserSettings } from '@/types';
import { api } from '@/libs/axios/config';

interface SecuritySettingsProps {
  settings: UserSettings;
  updateSettings: (section: string, data: any) => void;
}

export default function SecuritySettings({ settings, updateSettings }: SecuritySettingsProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Authentication</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">Two-Factor Authentication</span>
              <p className="text-xs text-gray-500">Add an extra layer of security to your account</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.security.twoFactorAuth}
                onChange={(e) => updateSettings('security', {
                  ...settings.security,
                  twoFactorAuth: e.target.checked,
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">Login Alerts</span>
              <p className="text-xs text-gray-500">Get notified of new login attempts</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.security.loginAlerts}
                onChange={(e) => updateSettings('security', {
                  ...settings.security,
                  loginAlerts: e.target.checked,
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
      <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Session</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Timeout (minutes)
          </label>
          <input
            type="number"
            min="15"
            max="1440"
            value={settings.security.sessionTimeout}
            onChange={(e) => updateSettings('security', {
              ...settings.security,
              sessionTimeout: parseInt(e.target.value),
            })}
            className="block w-full sm:w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Blocked Users</h3>
        {settings.security.blockedUsers.length === 0 ? (
          <p className="text-sm text-gray-500">No blocked users</p>
        ) : (
          <div className="space-y-2">
            {settings.security.blockedUsers.map((userId) => (
              <div key={userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <span className="text-sm text-gray-700">User ID: {userId}</span>
                <button
                  onClick={() => {
                    const updatedBlockedUsers = settings.security.blockedUsers.filter((id) => id !== userId);
                    updateSettings('security', {
                      ...settings.security,
                      blockedUsers: updatedBlockedUsers,
                    });
                    api.delete(`/settings/unblock-user/${userId}`).catch(console.error);
                  }}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}