'use client';
import { useState } from 'react';
import { Camera, X } from 'lucide-react';
import { useApiController } from '@/hooks/useFetch';
import { setUserCredentials } from '@/libs/redux/authSlice';
import { User } from '@/types';
import { errorMessageHandler } from '@/libs/feedback/error-handler';

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
    avatar: user.avatar || '',
    coverImage: user.coverImage || ''
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { mutate, isLoading } = useApiController({
    method: 'PATCH',
    url: `/auth/users/${user._id}`,
    successMessage: 'Profile updated successfully',
      onSuccess: (data) => {
        onSave({ ...user, ...formData, ...data });
        setUserCredentials(data.updatedUser)
        onClose();
      },
      onError: (err) => {
        errorMessageHandler(err)
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

  const formDataToSend = new FormData();
  
  if (formData.name) formDataToSend.append('name', formData.name);
  if (formData.bio) formDataToSend.append('bio', formData.bio);
  if (formData.location) formDataToSend.append('location', formData.location);
  if (formData.website) formDataToSend.append('website', formData.website);
  
  formDataToSend.append('isPrivate', formData.isPrivate.toString());
  
  if (avatarFile) {
    formDataToSend.append('avatar', avatarFile);
  }
  if (coverFile) {
    formDataToSend.append('coverImage', coverFile);
  }

  mutate(formDataToSend);
};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md sm:w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header - Sticky on mobile */}
        <div className="sticky top-0 bg-white p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between z-10">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Edit Profile</h2>
          <button 
            onClick={onClose}
            className="p-1 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="sm:w-6 sm:h-6"/>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Avatar Section */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Profile Picture
            </label>
            <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                {formData.avatar || avatarFile ? (
                  <img 
                    src={avatarFile ? URL.createObjectURL(avatarFile) : formData.avatar} 
                    alt="Avatar" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg sm:text-xl font-bold text-gray-500">
                    {user.username && user.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <label className="flex items-center space-x-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors text-sm sm:text-base">
                <Camera size={16} className="sm:w-5 sm:h-5" />
                <span>Change Avatar</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
            {errors.avatar && <p className="text-red-500 text-xs sm:text-sm">{errors.avatar}</p>}
          </div>

          {/* Cover Image Section */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Cover Image
            </label>
            <div className="space-y-3">
              <div className="w-full h-24 sm:h-32 rounded-lg overflow-hidden bg-gray-100">
                {formData.coverImage || coverFile ? (
                  <img 
                    src={coverFile ? URL.createObjectURL(coverFile) : formData.coverImage} 
                    alt="Cover" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs sm:text-sm">
                    No Cover Image
                  </div>
                )}
              </div>
              <label className="flex items-center justify-center space-x-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors text-sm sm:text-base">
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
            {errors.coverImage && <p className="text-red-500 text-xs sm:text-sm">{errors.coverImage}</p>}
          </div>

          {/* Name Field */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              placeholder="Your full name"
            />
            <div className="text-xs text-gray-500">{formData.name.length}/50</div>
            {errors.name && <p className="text-red-500 text-xs sm:text-sm">{errors.name}</p>}
          </div>

          {/* Bio Field */}
          <div className="space-y-2">
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
              Bio
            </label>
            <textarea
              id="bio"
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm sm:text-base"
              placeholder="Tell people about yourself..."
            />
            <div className="text-xs text-gray-500">{formData.bio.length}/160</div>
            {errors.bio && <p className="text-red-500 text-xs sm:text-sm">{errors.bio}</p>}
          </div>

          {/* Location Field */}
          <div className="space-y-2">
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Location
            </label>
            <input
              type="text"
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              placeholder="Where are you based?"
            />
            <div className="text-xs text-gray-500">{formData.location.length}/100</div>
            {errors.location && <p className="text-red-500 text-xs sm:text-sm">{errors.location}</p>}
          </div>

          {/* Website Field */}
          <div className="space-y-2">
            <label htmlFor="website" className="block text-sm font-medium text-gray-700">
              Website
            </label>
            <input
              type="url"
              id="website"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              placeholder="https://your-website.com"
            />
            {errors.website && <p className="text-red-500 text-xs sm:text-sm">{errors.website}</p>}
          </div>

          {/* Private Profile Toggle */}
          <div className="flex items-center space-x-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="isPrivate"
              checked={formData.isPrivate}
              onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
            />
            <div className="flex-1">
              <label htmlFor="isPrivate" className="text-sm font-medium text-gray-700 cursor-pointer">
                Private Profile
              </label>
              <p className="text-xs text-gray-500 mt-1">Only your followers can see your posts</p>
            </div>
          </div>

          {/* Action Buttons - Sticky on mobile */}
          <div className="sticky bottom-0 bg-white pt-4 sm:pt-6 border-t border-gray-100 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="flex flex-col-reverse sm:flex-row justify-end space-y-reverse space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 sm:px-6 sm:py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto px-4 py-2.5 sm:px-6 sm:py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
export default EditProfileModal