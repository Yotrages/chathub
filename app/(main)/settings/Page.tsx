'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Bell, 
  Palette, 
  User, 
  Monitor, 
  Flag, 
  Download,
  Trash2,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Globe,
  Smartphone,
  Mail,
  AtSign,
  Play,
  Filter,
  Upload,
  X,
} from 'lucide-react';
import { getCookie } from 'cookies-next';
import { api } from '@/libs/axios/config';

interface UserSettings {
  _id: string;
  userId: string;
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    allowMessagesFrom: 'everyone' | 'friends' | 'none';
    showOnlineStatus: boolean;
    allowTagging: boolean;
    showEmail: boolean;
    showPhoneNumber: boolean;
  };
  notifications: {
    email: {
      newFollower: boolean;
      messageReceived: boolean;
      postLiked: boolean;
      postCommented: boolean;
      mentioned: boolean;
      systemUpdates: boolean;
    };
    push: {
      newFollower: boolean;
      messageReceived: boolean;
      postLiked: boolean;
      postCommented: boolean;
      mentioned: boolean;
      systemUpdates: boolean;
    };
    inApp: {
      newFollower: boolean;
      messageReceived: boolean;
      postLiked: boolean;
      postCommented: boolean;
      mentioned: boolean;
      systemUpdates: boolean;
      onlineStatus: boolean;
    };
  };
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    fontSize: 'small' | 'medium' | 'large';
    backgroundImage: string;
    accentColor: string;
  };
  security: {
    twoFactorAuth: boolean;
    loginAlerts: boolean;
    sessionTimeout: number;
    blockedUsers: string[];
    trustedDevices: {
      deviceId: string;
      deviceName: string;
      lastUsed: string;
      trusted: boolean;
    }[];
  };
  content: {
    autoPlayVideos: boolean;
    showSensitiveContent: boolean;
    contentLanguages: string[];
    blockedKeywords: string[];
  };
  account: {
    isDeactivated: boolean;
    deactivatedAt?: string;
    deleteScheduledAt?: string;
    dataDownloadRequests: {
      requestedAt: string;
      status: 'pending' | 'processing' | 'completed' | 'failed';
      downloadUrl?: string;
      expiresAt?: string;
    }[];
  };
}

interface Report {
  _id: string;
  reportType: string;
  description: string;
  status: string;
  createdAt: string;
  reportedUserId?: string;
  reportedPostId?: string;
  reportedCommentId?: string;
}

interface BlockedUser {
  _id: string;
  username: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [activeTab, setActiveTab] = useState('privacy');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({
    reportType: 'spam' as 'spam' | 'harassment' | 'inappropriate_content' | 'fake_account' | 'copyright' | 'other',
    description: '',
    reportedUserId: '',
    reportedPostId: '',
    reportedCommentId: ''
  });
  const [error, setError] = useState<string | null>(null);

  const tabs = [
    { id: 'privacy', label: 'Privacy', icon: Eye },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'content', label: 'Content', icon: Filter },
    { id: 'account', label: 'Account', icon: User },
    { id: 'reports', label: 'Reports', icon: Flag }
  ];
  console.log(blockedUsers)

  useEffect(() => {
    fetchSettings();
    fetchReports();
  }, []);


  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/settings/');
      if (!response.data) throw new Error('Failed to fetch settings');
      const data =  response.data;
      setSettings(data);
      // Fetch usernames for blocked users
      // if (data.security.blockedUsers.length > 0) {
      //   const usersResponse = await api.get(`/users?ids=${data.security.blockedUsers.join(',')}`);
      //   if (usersResponse.status === 200) {
      //     const users =  usersResponse.data;
      //     setBlockedUsers(users);
      //   }
      // }
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
      if (!response.data) throw new Error('Failed to fetch reports');
      const data =  response.data;
      setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('Failed to load reports. Please try again.');
    }
  };

  const updateSettings = async (section: string, data: any) => {
    setSaving(true);
    setError(null);
    try {
      const response = await api.put(`/api/settings/${section}`, {data});
      if (!response.data) throw new Error(`Failed to update ${section} settings`);
      const updatedSettings = response.data;
      setSettings(updatedSettings);
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
      const response = await api.post('/api/settings/background', {formData});
      if (!response.data) throw new Error('Failed to upload background');
      const data = response.data;
      if (settings) {
        setSettings({
          ...settings,
          appearance: {
            ...settings.appearance,
            backgroundImage: data.backgroundImage
          }
        });
      }
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
      const response = await api.post('/api/settings/report', {
         ...reportForm,
          reportedUserId: reportForm.reportedUserId || undefined,
          reportedPostId: reportForm.reportedPostId || undefined,
          reportedCommentId: reportForm.reportedCommentId || undefined,
      });
      if (!response.data) throw new Error('Failed to submit report');
      setShowReportModal(false);
      setReportForm({ reportType: 'spam', description: '', reportedUserId: '', reportedPostId: '', reportedCommentId: '' });
      fetchReports();
    } catch (error) {
      console.error('Error submitting report:', error);
      setError('Failed to submit report. Please try again.');
    }
  };

  // const blockUser = async (userId: string) => {
  //   setError(null);
  //   try {
  //     const response = await fetch('/api/settings/block-user', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Authorization': `Bearer ${getCookie('auth-token')}`
  //       },
  //       body: JSON.stringify({ userId })
  //     });
  //     if (!response.ok) throw new Error('Failed to block user');
  //     const updatedSettings = await response.json();
  //     setSettings(updatedSettings);
  //     // Fetch username for the newly blocked user
  //     const userResponse = await fetch(`/api/users?ids=${userId}`, {
  //       headers: {
  //         'Authorization': `Bearer ${getCookie('auth-token')}`
  //       }
  //     });
  //     if (userResponse.ok) {
  //       const [newUser] = await userResponse.json();
  //       setBlockedUsers([...blockedUsers, newUser]);
  //     }
  //   } catch (error) {
  //     console.error('Error blocking user:', error);
  //     setError('Failed to block user. Please try again.');
  //   }
  // };

  // const unblockUser = async (userId: string) => {
  //   setError(null);
  //   try {
  //     const response = await fetch(`/api/settings/unblock-user/${userId}`, {
  //       method: 'DELETE',
  //       headers: {
  //         'Authorization': `Bearer ${getCookie('auth-token')}`
  //       }
  //     });
  //     if (!response.ok) throw new Error('Failed to unblock user');
  //     const updatedSettings = await response.json();
  //     setSettings(updatedSettings);
  //     setBlockedUsers(blockedUsers.filter(user => user._id !== userId));
  //   } catch (error) {
  //     console.error('Error unblocking user:', error);
  //     setError('Failed to unblock user. Please try again.');
  //   }
  // };

  const deactivateAccount = async () => {
    if (confirm('Are you sure you want to deactivate your account?')) {
      setError(null);
      try {
        const response = await api.post('/api/settings/deactivate');
        if (!response.data) throw new Error('Failed to deactivate account');
        fetchSettings();
      } catch (error) {
        console.error('Error deactivating account:', error);
        setError('Failed to deactivate account. Please try again.');
      }
    }
  };

  // const cancelDeletion = async () => {
  //   if (confirm('Are you sure you want to cancel account deletion?')) {
  //     setError(null);
  //     try {
  //       const response = await fetch('/api/settings/cancel-delete', {
  //         method: 'POST',
  //         headers: {
  //           'Authorization': `Bearer ${getCookie('auth-token')}`
  //         }
  //       });
  //       if (!response.ok) throw new Error('Failed to cancel deletion');
  //       fetchSettings();
  //     } catch (error) {
  //       console.error('Error canceling deletion:', error);
  //       setError('Failed to cancel deletion. Please try again.');
  //     }
  //   }
  // };

  const scheduleDelete = async () => {
    if (confirm('Are you sure you want to schedule account deletion? This action cannot be undone after 30 days.')) {
      setError(null);
      try {
        const response = await api.post('/api/settings/schedule-delete');
        if (!response.data) throw new Error('Failed to schedule deletion');
        fetchSettings();
      } catch (error) {
        console.error('Error scheduling deletion:', error);
        setError('Failed to schedule deletion. Please try again.');
      }
    }
  };

  const requestDataDownload = async () => {
    setError(null);
    try {
      const response = await api.post('/api/settings/request-data');
      if (!response.data) throw new Error('Failed to request data download');
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

  const renderPrivacySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Visibility</h3>
        <div className="space-y-3">
          {['public', 'friends', 'private'].map((option) => (
            <label key={option} className="flex items-center">
              <input
                type="radio"
                name="profileVisibility"
                value={option}
                checked={settings.privacy.profileVisibility === option}
                onChange={(e) => updateSettings('privacy', {
                  ...settings.privacy,
                  profileVisibility: e.target.value
                })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-3 text-sm text-gray-700 capitalize">{option}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Message Settings</h3>
        <div className="space-y-3">
          {['everyone', 'friends', 'none'].map((option) => (
            <label key={option} className="flex items-center">
              <input
                type="radio"
                name="allowMessagesFrom"
                value={option}
                checked={settings.privacy.allowMessagesFrom === option}
                onChange={(e) => updateSettings('privacy', {
                  ...settings.privacy,
                  allowMessagesFrom: e.target.value
                })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-3 text-sm text-gray-700 capitalize">
                {option === 'none' ? 'No one' : option}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Other Privacy Settings</h3>
        
        {[
          { key: 'showOnlineStatus', label: 'Show online status', icon: Globe },
          { key: 'allowTagging', label: 'Allow others to tag me', icon: AtSign },
          { key: 'showEmail', label: 'Show email address', icon: Mail },
          { key: 'showPhoneNumber', label: 'Show phone number', icon: Smartphone }
        ].map(({ key, label, icon: Icon }) => (
          <div key={key} className="flex items-center justify-between">
            <div className="flex items-center">
              <Icon className="h-5 w-5 text-gray-400 mr-3" />
              <span className="text-sm text-gray-700">{label}</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.privacy[key as keyof typeof settings.privacy] as boolean}
                onChange={(e) => updateSettings('privacy', {
                  ...settings.privacy,
                  [key]: e.target.checked
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      {['email', 'push', 'inApp'].map((type) => (
        <div key={type} className="bg-white p-6 rounded-lg border border-gray-200">
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
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value as boolean}
                    onChange={(e) => updateSettings('notifications', {
                      ...settings.notifications,
                      [type]: {
                        ...settings.notifications[type as keyof typeof settings.notifications],
                        [key]: e.target.checked
                      }
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

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Theme</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: 'light', label: 'Light', icon: Sun },
            { value: 'dark', label: 'Dark', icon: Moon },
            { value: 'auto', label: 'Auto', icon: Monitor }
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => updateSettings('appearance', {
                ...settings.appearance,
                theme: value
              })}
              className={`p-4 rounded-lg border-2 transition-colors ${
                settings.appearance.theme === value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Icon className="h-6 w-6 mx-auto mb-2" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Font Size</h3>
        <div className="space-y-3">
          {['small', 'medium', 'large'].map((size) => (
            <label key={size} className="flex items-center">
              <input
                type="radio"
                name="fontSize"
                value={size}
                checked={settings.appearance.fontSize === size}
                onChange={(e) => updateSettings('appearance', {
                  ...settings.appearance,
                  fontSize: e.target.value
                })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-3 text-sm text-gray-700 capitalize">{size}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Background Image</h3>
        <div className="flex items-center space-x-4">
          {settings.appearance.backgroundImage && (
            <img 
              src={settings.appearance.backgroundImage} 
              alt="Background" 
              className="h-20 w-20 object-cover rounded-lg"
            />
          )}
          <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center">
            <Upload className="h-4 w-4 mr-2" />
            Upload Background
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadBackground(file);
              }}
            />
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Accent Color</h3>
        <input
          type="color"
          value={settings.appearance.accentColor}
          onChange={(e) => updateSettings('appearance', {
            ...settings.appearance,
            accentColor: e.target.value
          })}
          className="h-12 w-24 rounded-md border border-gray-300 cursor-pointer"
        />
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Language</h3>
        <select
          value={settings.appearance.language}
          onChange={(e) => updateSettings('appearance', {
            ...settings.appearance,
            language: e.target.value
          })}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="it">Italian</option>
          <option value="pt">Portuguese</option>
          <option value="ja">Japanese</option>
          <option value="ko">Korean</option>
          <option value="zh">Chinese</option>
        </select>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
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
                  twoFactorAuth: e.target.checked
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
                  loginAlerts: e.target.checked
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
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
              sessionTimeout: parseInt(e.target.value)
            })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
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
                    const updatedBlockedUsers = settings.security.blockedUsers.filter(id => id !== userId);
                    updateSettings('security', {
                      ...settings.security,
                      blockedUsers: updatedBlockedUsers
                    });
                    
                    // Also make API call to unblock
                    api.delete(`/api/settings/unblock-user/${userId}`).catch(console.error);
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


  const renderContentSettings = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Media Settings</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Play className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <span className="text-sm font-medium text-gray-700">Auto-play videos</span>
                <p className="text-xs text-gray-500">Automatically play videos in your feed</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.content.autoPlayVideos}
                onChange={(e) => updateSettings('content', {
                  ...settings.content,
                  autoPlayVideos: e.target.checked
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <EyeOff className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <span className="text-sm font-medium text-gray-700">Show sensitive content</span>
                <p className="text-xs text-gray-500">Display potentially sensitive content</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.content.showSensitiveContent}
                onChange={(e) => updateSettings('content', {
                  ...settings.content,
                  showSensitiveContent: e.target.checked
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Content Languages</h3>
        
        <div className="space-y-2">
          {['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'].map((lang) => (
            <label key={lang} className="flex items-center">
              <input
                type="checkbox"
                checked={settings.content.contentLanguages.includes(lang)}
                onChange={(e) => {
                  const newLanguages = e.target.checked
                    ? [...settings.content.contentLanguages, lang]
                    : settings.content.contentLanguages.filter(l => l !== lang);
                  
                  updateSettings('content', {
                    ...settings.content,
                    contentLanguages: newLanguages.length > 0 ? newLanguages : ['en']
                  });
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700">
                {lang === 'en' ? 'English' : 
                 lang === 'es' ? 'Spanish' :
                 lang === 'fr' ? 'French' :
                 lang === 'de' ? 'German' :
                 lang === 'it' ? 'Italian' :
                 lang === 'pt' ? 'Portuguese' :
                 lang === 'ja' ? 'Japanese' :
                 lang === 'ko' ? 'Korean' :
                 lang === 'zh' ? 'Chinese' : lang}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Blocked Keywords</h3>
        
        <div className="space-y-2">
          {settings.content.blockedKeywords.map((keyword, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
              <span className="text-sm text-gray-700">{keyword}</span>
              <button
                onClick={() => {
                  const newKeywords = settings.content.blockedKeywords.filter((_, i) => i !== index);
                  updateSettings('content', {
                    ...settings.content,
                    blockedKeywords: newKeywords
                  });
                }}
                className="text-red-600 hover:text-red-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Add blocked keyword"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const keyword = e.currentTarget.value.trim();
                  if (keyword && !settings.content.blockedKeywords.includes(keyword)) {
                    if (keyword.length > 50) {
                      setError('Keyword cannot exceed 50 characters');
                      return;
                    }
                    if (!/^[a-zA-Z0-9\s]+$/.test(keyword)) {
                      setError('Keyword can only contain letters, numbers, and spaces');
                      return;
                    }
                    updateSettings('content', {
                      ...settings.content,
                      blockedKeywords: [...settings.content.blockedKeywords, keyword]
                    });
                    e.currentTarget.value = '';
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderAccountSettings = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
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
                  await api.post('/api/settings/cancel-delete');
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

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Data Management</h3>
        
        <div className="space-y-4">
          <button
            onClick={requestDataDownload}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Request Data Download
          </button>
          
          <div className="text-sm text-gray-600">
            <p>Download a copy of your data including posts, messages, and profile information.</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-red-200">
        <h3 className="text-lg font-medium text-red-600 mb-4">Danger Zone</h3>
        
        <div className="space-y-4">
          <button
            onClick={scheduleDelete}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
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

  const renderReportsSettings = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Report Abuse</h3>
        <button
          onClick={() => setShowReportModal(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Submit Report
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-md font-medium text-gray-900">My Reports</h4>
        </div>
        
        <div className="divide-y divide-gray-200">
          {reports.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No reports submitted
            </div>
          ) : (
            reports.map((report) => (
              <div key={report._id} className="px-6 py-4">
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-1/4">
            <div className="bg-white rounded-lg border border-gray-200">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-6 py-4 text-sm font-medium text-left ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="h-5 w-5 mr-3" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full lg:w-3/4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {saving && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
老
                </div>
              )}
              {activeTab === 'privacy' && renderPrivacySettings()}
             
              {activeTab === 'notifications' && renderNotificationSettings()}
              {activeTab === 'appearance' && renderAppearanceSettings()}
              {activeTab === 'security' && renderSecuritySettings()}
              {activeTab === 'content' && renderContentSettings()}
              {activeTab === 'account' && renderAccountSettings()}
              {activeTab === 'reports' && renderReportsSettings()}
            </div>
          </div>
        </div>
      </div>

      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  placeholder="Post ID (optional)"
                  value={reportForm.reportedPostId}
                  onChange={(e) => setReportForm({ ...reportForm, reportedPostId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mt-2"
                />
                <input
                  type="text"
                  placeholder="Comment ID (optional)"
                  value={reportForm.reportedCommentId}
                  onChange={(e) => setReportForm({ ...reportForm, reportedCommentId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mt-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={reportForm.description}
                  onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={submitReport}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Submit Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )}