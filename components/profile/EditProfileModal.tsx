'use client';
import { useState } from 'react';
import { Camera, X } from 'lucide-react';
import { useApiController } from '@/hooks/useFetch';
import { updateUserCredentials } from '@/libs/redux/authSlice';
import { User } from '@/types';
import { errorNotification } from '@/libs/feedback/notification';
import { AppDispatch } from '@/libs/redux/store';
import { useDispatch } from 'react-redux';

interface EditProfileModalProps {
  user: User;
  onClose: () => void;
  onSave: (user: User) => void;
}

const EditProfileModal = ({ user, onClose, onSave }: EditProfileModalProps) => {
  const [formData, setFormData] = useState({
    name: user.username || '',
    bio: user.bio || '',
    location: user.location || '',
    website: user.website || '',
    isPrivate: user.isPrivate || false,
  });
  const dispatch: AppDispatch = useDispatch()
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { mutate, isLoading } = useApiController({
    method: 'PATCH',
    url: `/auth/users/${user._id}`,
    successMessage: 'Profile updated successfully',
    onSuccess: (data) => {
      dispatch(updateUserCredentials(data.user))
      onSave({ ...user, ...formData, ...data.user });
      onClose();
    },
    onError: (err) => {
      errorNotification(err)
    }
  });

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (formData.name.length > 50) newErrors.name = 'Name cannot exceed 50 characters';
    if (formData.bio.length > 160) newErrors.bio = 'Bio cannot exceed 160 characters';
    if (formData.location.length > 100) newErrors.location = 'Location cannot exceed 100 characters';
    if (formData.website && !/^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/.test(formData.website)) {
      newErrors.website = 'Invalid website URL';
    }
    if (avatarFile && !['image/jpeg', 'image/png', 'image/gif'].includes(avatarFile.type)) {
      newErrors.avatar = 'Invalid avatar file type';
    }
    if (coverFile && !['image/jpeg', 'image/png', 'image/gif'].includes(coverFile.type)) {
      newErrors.coverImage = 'Invalid cover image file type';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const dataToSend: any = {
      name: formData.name,
      bio: formData.bio,
      location: formData.location,
      website: formData.website,
      isPrivate: formData.isPrivate,
    };
    
    if (avatarFile) {
      dataToSend.avatar = avatarFile;
    }
    if (coverFile) {
      dataToSend.coverImage = coverFile;
    }

    mutate(dataToSend);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-[9999] backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-xl dark:shadow-2xl w-full sm:max-w-md sm:w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto transition-colors duration-200">
        {/* Header - Sticky on mobile */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between z-10 transition-colors duration-200">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Profile</h2>
          <button 
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X size={20} className="sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400"/>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 sm:space-y-6 dark:bg-gray-800">
          {/* Avatar Section */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
              Profile Picture
            </label>
            <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 dark:from-blue-900 to-purple-100 dark:to-purple-900 flex-shrink-0 ring-4 ring-gray-100 dark:ring-gray-700">
                {user?.avatar || avatarFile ? (
                  <img 
                    src={avatarFile ? URL.createObjectURL(avatarFile) : user?.avatar} 
                    alt="Avatar" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl sm:text-2xl font-bold text-blue-600">
                    {user.username && user.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <label className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl cursor-pointer transition-all shadow-sm hover:shadow-md text-sm sm:text-base font-medium">
                <Camera size={16} className="sm:w-5 sm:h-5" />
                <span>Change Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
            {errors.avatar && <p className="text-red-500 text-xs sm:text-sm mt-1 flex items-center gap-1">
              <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
              {errors.avatar}
            </p>}
          </div>

          {/* Cover Image Section */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
              Cover Image
            </label>
            <div className="space-y-3">
              <div className="w-full h-28 sm:h-36 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 dark:from-gray-700 to-gray-200 dark:to-gray-800 ring-1 ring-gray-200 dark:ring-gray-600">
                {user?.coverImage || coverFile ? (
                  <img 
                    src={coverFile ? URL.createObjectURL(coverFile) : user?.coverImage} 
                    alt="Cover" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs sm:text-sm font-medium">
                    No Cover Image
                  </div>
                )}
              </div>
              <label className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 rounded-xl cursor-pointer transition-all text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200">
                <Camera size={16} className="sm:w-5 sm:h-5" />
                <span>Change Cover</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
            {errors.coverImage && <p className="text-red-500 dark:text-red-400 text-xs sm:text-sm mt-1 flex items-center gap-1">
              <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
              {errors.coverImage}
            </p>}
          </div>

          {/* Name Field */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl transition-all duration-200 text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-gray-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/30"
              placeholder="Your full name"
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400 dark:text-gray-500">{formData.name.length}/50 characters</span>
            </div>
            {errors.name && <p className="text-red-500 dark:text-red-400 text-xs sm:text-sm flex items-center gap-1">
              <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
              {errors.name}
            </p>}
          </div>

          {/* Bio Field */}
          <div className="space-y-2">
            <label htmlFor="bio" className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
              Bio
            </label>
            <textarea
              id="bio"
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl transition-all duration-200 resize-none text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-gray-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/30"
              placeholder="Tell people about yourself..."
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400 dark:text-gray-500">{formData.bio.length}/160 characters</span>
            </div>
            {errors.bio && <p className="text-red-500 dark:text-red-400 text-xs sm:text-sm flex items-center gap-1">
              <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
              {errors.bio}
            </p>}
          </div>

          {/* Location Field */}
          <div className="space-y-2">
            <label htmlFor="location" className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
              Location
            </label>
            <input
              type="text"
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl transition-all duration-200 text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-gray-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/30"
              placeholder="Where are you based?"
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400 dark:text-gray-500">{formData.location.length}/100 characters</span>
            </div>
            {errors.location && <p className="text-red-500 dark:text-red-400 text-xs sm:text-sm flex items-center gap-1">
              <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
              {errors.location}
            </p>}
          </div>

          {/* Website Field */}
          <div className="space-y-2">
            <label htmlFor="website" className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
              Website
            </label>
            <input
              type="url"
              id="website"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl transition-all duration-200 text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-gray-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/30"
              placeholder="https://your-website.com"
            />
            {errors.website && <p className="text-red-500 dark:text-red-400 text-xs sm:text-sm mt-2 flex items-center gap-1">
              <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
              {errors.website}
            </p>}
          </div>

          {/* Private Profile Toggle */}
          <div className="flex items-start space-x-3 p-4 bg-gradient-to-br from-blue-50 dark:from-blue-900/20 to-purple-50 dark:to-purple-900/20 border-2 border-blue-100 dark:border-blue-900/50 rounded-xl">
            <input
              type="checkbox"
              id="isPrivate"
              checked={formData.isPrivate}
              onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
              className="w-5 h-5 mt-0.5 rounded-md border-2 border-blue-300 dark:border-blue-700 text-blue-600 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:ring-offset-0 cursor-pointer transition-all"
            />
            <div className="flex-1">
              <label htmlFor="isPrivate" className="text-sm font-semibold text-gray-800 dark:text-gray-200 cursor-pointer block">
                Private Profile
              </label>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Only approved followers can see your posts and stories</p>
            </div>
          </div>

          {/* Action Buttons - Sticky on mobile */}
          <div className="sticky bottom-0 bg-white dark:bg-gray-800 pt-5 sm:pt-6 border-t-2 border-gray-100 dark:border-gray-700 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 px-4 sm:px-6 pb-4 sm:pb-6 transition-colors duration-200">
            <div className="flex flex-col-reverse sm:flex-row justify-end space-y-reverse space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 rounded-xl font-semibold transition-all text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-blue-300 disabled:to-blue-400 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl text-sm sm:text-base"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Saving...
                  </span>
                ) : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
export default EditProfileModal