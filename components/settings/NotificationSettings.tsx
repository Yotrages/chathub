import React from 'react';
import { Mail, Smartphone, Bell } from 'lucide-react';
import { UserSettings } from '@/types';
import { ToggleSwitch } from './ToggleSwitch';

interface NotificationSettingsProps {
  settings: UserSettings;
  updateSettings: (section: string, data: any) => void;
}

export default function NotificationSettings({ settings, updateSettings }: NotificationSettingsProps) {
  const notificationTypes = [
    { key: 'email', label: 'Email', icon: Mail, gradient: 'from-blue-500 to-indigo-600' },
    { key: 'push', label: 'Push', icon: Smartphone, gradient: 'from-green-500 to-emerald-600' },
    { key: 'inApp', label: 'In-App', icon: Bell, gradient: 'from-purple-500 to-violet-600' },
  ] as const;

  return (
    <div className="space-y-6">
      {notificationTypes.map(({ key, label, icon: Icon, gradient }) => (
        <div key={key} className="bg-gradient-to-br from-white dark:from-gray-800 to-gray-50 dark:to-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl dark:shadow-lg dark:hover:shadow-xl transition-all duration-300">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <div className={`w-8 h-8 bg-gradient-to-r ${gradient} rounded-lg flex items-center justify-center mr-3`}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            {label} Notifications
          </h3>
          <div className="space-y-4">
            {Object.entries(settings.notifications[key] as Record<string, boolean>).map(([settingKey, value]) => (
              <div key={settingKey} className="flex items-center justify-between p-4 bg-white/70 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-md dark:hover:shadow-lg transition-all duration-200">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {settingKey.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                </span>
                <ToggleSwitch
                  checked={value as boolean}
                  onChange={(e: any) => updateSettings('notifications', {
                    ...settings.notifications,
                    [key]: {
                      ...settings.notifications[key],
                      [settingKey]: e.target.checked,
                    },
                  })}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}