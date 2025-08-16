// import { errorNotification } from "@/libs/feedback/notification";
// import { getCookie } from "cookies-next";

// const fetchSettings = async () => {
//     try {
//       setLoading(true);
//       const response = await fetch('/api/settings', {
//         headers: {
//           'Authorization': `Bearer ${getCookie('auth-token')}`
//         }
//       });
//       if (!response.ok) throw new Error('Failed to fetch settings');
//       const data = await response.json();
//       setSettings(data);
//       // Fetch usernames for blocked users
//       if (data.security.blockedUsers.length > 0) {
//         const usersResponse = await fetch(`/api/users?ids=${data.security.blockedUsers.join(',')}`, {
//           headers: {
//             'Authorization': `Bearer ${getCookie('auth-token')}`
//           }
//         });
//         if (usersResponse.ok) {
//           const users = await usersResponse.json();
//           setBlockedUsers(users);
//         }
//       }
//     } catch (error) {
//       console.error('Error fetching settings:', error);
//       setError('Failed to load settings. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchReports = async () => {
//     try {
//       const response = await fetch('/api/settings/my-reports', {
//         headers: {
//           'Authorization': `Bearer ${getCookie('auth-token')}`
//         }
//       });
//       if (!response.ok) throw new Error('Failed to fetch reports');
//       const data = await response.json();
//       setReports(data);
//     } catch (error) {
//       console.error('Error fetching reports:', error);
//       setError('Failed to load reports. Please try again.');
//     }
//   };

//   const updateSettings = async (section: string, data: any) => {
//     setSaving(true);
//     setError(null);
//     try {
//       const response = await fetch(`/api/settings/${section}`, {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${getCookie('auth-token')}`
//         },
//         body: JSON.stringify(data)
//       });
//       if (!response.ok) throw new Error(`Failed to update ${section} settings`);
//       const updatedSettings = await response.json();
//       setSettings(updatedSettings);
//     } catch (error) {
//       console.error(`Error updating ${section} settings:`, error);
//       setError(`Failed to update ${section} settings. Please try again.`);
//     } finally {
//       setSaving(false);
//     }
//   };

//   const uploadBackground = async (file: File) => {
//     setError(null);
//     const formData = new FormData();
//     formData.append('background', file);
    
//     try {
//       const response = await fetch('/api/settings/background', {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${getCookie('auth-token')}`
//         },
//         body: formData
//       });
//       if (!response.ok) throw new Error('Failed to upload background');
//       const data = await response.json();
//       if (settings) {
//         setSettings({
//           ...settings,
//           appearance: {
//             ...settings.appearance,
//             backgroundImage: data.backgroundImage
//           }
//         });
//       }
//     } catch (error) {
//       console.error('Error uploading background:', error);
//       setError('Failed to upload background image. Please try again.');
//     }
//   };

//   const submitReport = async () => {
//     if (!reportForm.description || reportForm.description.length < 10) {
//       setError('Description must be at least 10 characters');
//       return;
//     }
//     setError(null);
//     try {
//       const response = await fetch('/api/settings/report', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${getCookie('auth-token')}`
//         },
//         body: JSON.stringify({
//           ...reportForm,
//           reportedUserId: reportForm.reportedUserId || undefined,
//           reportedPostId: reportForm.reportedPostId || undefined,
//           reportedCommentId: reportForm.reportedCommentId || undefined
//         })
//       });
//       if (!response.ok) throw new Error('Failed to submit report');
//       setShowReportModal(false);
//       setReportForm({ reportType: 'spam', description: '', reportedUserId: '', reportedPostId: '', reportedCommentId: '' });
//       fetchReports();
//     } catch (error) {
//       console.error('Error submitting report:', error);
//       setError('Failed to submit report. Please try again.');
//     }
//   };

//   const blockUser = async (userId: string) => {
//     setError(null);
//     try {
//       const response = await fetch('/api/settings/block-user', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${getCookie('auth-token')}`
//         },
//         body: JSON.stringify({ userId })
//       });
//       if (!response.ok) throw new Error('Failed to block user');
//       const updatedSettings = await response.json();
//       setSettings(updatedSettings);
//       // Fetch username for the newly blocked user
//       const userResponse = await fetch(`/api/users?ids=${userId}`, {
//         headers: {
//           'Authorization': `Bearer ${getCookie('auth-token')}`
//         }
//       });
//       if (userResponse.ok) {
//         const [newUser] = await userResponse.json();
//         setBlockedUsers([...blockedUsers, newUser]);
//       }
//     } catch (error) {
//       console.error('Error blocking user:', error);
//       setError('Failed to block user. Please try again.');
//     }
//   };

//   const unblockUser = async (userId: string) => {
//     setError(null);
//     try {
//       const response = await fetch(`/api/settings/unblock-user/${userId}`, {
//         method: 'DELETE',
//         headers: {
//           'Authorization': `Bearer ${getCookie('auth-token')}`
//         }
//       });
//       if (!response.ok) throw new Error('Failed to unblock user');
//       const updatedSettings = await response.json();
//       setSettings(updatedSettings);
//       setBlockedUsers(blockedUsers.filter(user => user._id !== userId));
//     } catch (error) {
//       console.error('Error unblocking user:', error);
//       setError('Failed to unblock user. Please try again.');
//     }
//   };

//   const deactivateAccount = async () => {
//     if (confirm('Are you sure you want to deactivate your account?')) {
//       setError(null);
//       try {
//         const response = await fetch('/api/settings/deactivate', {
//           method: 'POST',
//           headers: {
//             'Authorization': `Bearer ${getCookie('auth-token')}`
//           }
//         });
//         if (!response.ok) throw new Error('Failed to deactivate account');
//         fetchSettings();
//       } catch (error) {
//         console.error('Error deactivating account:', error);
//         setError('Failed to deactivate account. Please try again.');
//       }
//     }
//   };

//   const cancelDeletion = async () => {
//     if (confirm('Are you sure you want to cancel account deletion?')) {
//       setError(null);
//       try {
//         const response = await fetch('/api/settings/cancel-delete', {
//           method: 'POST',
//           headers: {
//             'Authorization': `Bearer ${getCookie('auth-token')}`
//           }
//         });
//         if (!response.ok) throw new Error('Failed to cancel deletion');
//         fetchSettings();
//       } catch (error) {
//         console.error('Error canceling deletion:', error);
//         setError('Failed to cancel deletion. Please try again.');
//       }
//     }
//   };

//   const scheduleDelete = async () => {
//     if (confirm('Are you sure you want to schedule account deletion? This action cannot be undone after 30 days.')) {
//       setError(null);
//       try {
//         const response = await fetch('/api/settings/schedule-delete', {
//           method: 'POST',
//           headers: {
//             'Authorization': `Bearer ${getCookie('auth-token')}`
//           }
//         });
//         if (!response.ok) throw new Error('Failed to schedule deletion');
//         fetchSettings();
//       } catch (error) {
//         console.error('Error scheduling deletion:', error);
//         setError('Failed to schedule deletion. Please try again.');
//       }
//     }
//   };

//   const requestDataDownload = async () => {
//     try {
//       const response = await fetch('/api/settings/request-data', {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${getCookie('auth-token')}`
//         }
//       });
//       if (!response.ok) throw new Error('Failed to request data download');
//       alert('Data download request submitted. You will receive an email when ready.');
//     } catch (error) {
//       console.error('Error requesting data download:', error);
//       errorNotification('Failed to request data download. Please try again.');
//     }
//   };