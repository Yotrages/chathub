import React from 'react';
import { UserSettings } from '@/types';
import { api } from '@/libs/axios/config';
import { Bell, Monitor, X } from 'lucide-react';
import { ToggleSwitch } from './ToggleSwitch';

interface SecuritySettingsProps {
  settings: UserSettings;
  updateSettings: (section: string, data: any) => void;
}

export default function SecuritySettings({ settings, updateSettings } : SecuritySettingsProps) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-white dark:from-gray-800 to-green-50 dark:to-gray-800 p-6 rounded-2xl border border-green-100 dark:border-green-900/50 shadow-lg hover:shadow-xl dark:shadow-lg dark:hover:shadow-xl transition-all duration-300">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
            <Bell className="h-4 w-4 text-white" />
          </div>
          Authentication
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/70 dark:bg-gray-700/50 rounded-xl border border-green-200 dark:border-green-900/50 hover:shadow-md dark:hover:shadow-lg transition-all duration-200">
            <div>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Two-Factor Authentication</span>
              <p className="text-xs text-gray-600 dark:text-gray-400">Add an extra layer of security to your account</p>
            </div>
            <ToggleSwitch
              checked={settings.security.twoFactorAuth}
              onChange={(e: any) => updateSettings('security', {
                ...settings.security,
                twoFactorAuth: e.target.checked,
              })}
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-white/70 dark:bg-gray-700/50 rounded-xl border border-green-200 dark:border-green-900/50 hover:shadow-md dark:hover:shadow-lg transition-all duration-200">
            <div>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Login Alerts</span>
              <p className="text-xs text-gray-600 dark:text-gray-400">Get notified of new login attempts</p>
            </div>
            <ToggleSwitch
              checked={settings.security.loginAlerts}
              onChange={(e: any) => updateSettings('security', {
                ...settings.security,
                loginAlerts: e.target.checked,
              })}
            />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-white dark:from-gray-800 to-blue-50 dark:to-gray-800 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/50 shadow-lg hover:shadow-xl dark:shadow-lg dark:hover:shadow-xl transition-all duration-300">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
            <Monitor className="h-4 w-4 text-white" />
          </div>
          Session
        </h3>
        <div className="bg-white/70 dark:bg-gray-700/50 p-4 rounded-xl border border-blue-200 dark:border-blue-900/50">
          <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
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
            className="block w-full sm:w-1/2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-white hover:border-gray-400 dark:hover:border-gray-500 transition-colors font-medium"
          />
        </div>
      </div>

      <div className="bg-gradient-to-br from-white dark:from-gray-800 to-red-50 dark:to-gray-800 p-6 rounded-2xl border border-red-100 dark:border-red-900/50 shadow-lg hover:shadow-xl dark:shadow-lg dark:hover:shadow-xl transition-all duration-300">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg flex items-center justify-center mr-3">
            <X className="h-4 w-4 text-white" />
          </div>
          Blocked Users
        </h3>
        {settings.security.blockedUsers.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <X className="h-8 w-8 text-white" />
            </div>
            <p className="text-sm text-gray-500 font-medium">No blocked users</p>
          </div>
        ) : (
          <div className="space-y-3">
            {settings.security.blockedUsers.map((userId) => (
              <div key={userId} className="flex items-center justify-between p-4 bg-white/70 dark:bg-gray-700/50 rounded-xl border border-red-200 dark:border-red-900/50 hover:shadow-md dark:hover:shadow-lg transition-all duration-200">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">User ID: {userId}</span>
                <button
                  onClick={() => {
                    const updatedBlockedUsers = settings.security.blockedUsers.filter((id) => id !== userId);
                    updateSettings('security', {
                      ...settings.security,
                      blockedUsers: updatedBlockedUsers,
                    });
                    api.delete(`/settings/unblock-user/${userId}`).catch(console.error);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 text-sm font-medium shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105"
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