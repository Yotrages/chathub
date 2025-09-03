import React from 'react';
import { Mail, Smartphone, Bell } from 'lucide-react';
import { UserSettings } from '@/types';

interface NotificationSettingsProps {
  settings: UserSettings;
  updateSettings: (section: string, data: any) => void;
}

export default function NotificationSettings({ settings, updateSettings }: NotificationSettingsProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {['email', 'push', 'inApp'].map((type) => (
        <div key={type} className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            {type === 'email' && <Mail className="h-5 w-5 mr-2" />}
            {type === 'push' && <Smartphone className="h-5 w-5 mr-2" />}
            {type === 'inApp' && <Bell className="h-5 w-5 mr-2" />}
            {type === 'email' ? 'Email' : type === 'push' ? 'Push' : 'In-App'} Notifications
          </h3>
          <div className="space-y-4">
            {Object.entries(settings.notifications[type as keyof typeof settings.notifications]).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value as boolean}
                    onChange={(e) => updateSettings('notifications', {
                      ...settings.notifications,
                      [type]: {
                        ...settings.notifications[type as keyof typeof settings.notifications],
                        [key]: e.target.checked,
                      },
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}