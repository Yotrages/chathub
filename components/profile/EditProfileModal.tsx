'use client';
import { useState } from 'react';
import { Camera, X } from 'lucide-react';
import { useApiController } from '@/hooks/useFetch';
import { setUserCredentials } from '@/libs/redux/authSlice';
import { User } from '@/types';

interface EditProfileModalProps {
  user: User;
  onClose: () => void;
  onSave: (user: User) => void;
}

const EditProfileModal = ({ user, onClose, onSave }: EditProfileModalProps) => {
  // const { user: currentUser } = useSelector((state: RootState) => state.auth);
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
    formDataToSend.append('name', formData.name);
    formDataToSend.append('bio', formData.bio);
    formDataToSend.append('location', formData.location);
    formDataToSend.append('website', formData.website);
    formDataToSend.append('isPrivate', formData.isPrivate.toString());
    if (avatarFile) formDataToSend.append('avatar', avatarFile);
    if (coverFile) formDataToSend.append('coverImage', coverFile);

    mutate(formDataToSend);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
          <button onClick={onClose}>
            <X size={16}/>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 mb-2">
              Profile Picture
            </label>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100">
                {formData.avatar ? (
                  <img src={avatarFile ? URL.createObjectURL(avatarFile) : formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-500">
                    {user.username && user.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <label className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer">
                <Camera size={16} />
                <span>Change Avatar</span>
                <input
                  type="file"
                  id="avatar"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
            {errors.avatar && <p className="text-red-500 text-sm mt-1">{errors.avatar}</p>}
          </div>

          <div>
            <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700 mb-2">
              Cover Image
            </label>
            <div className="flex items-center space-x-4">
              <div className="w-full h-32 rounded-lg overflow-hidden bg-gray-100">
                {formData.coverImage || coverFile ? (
                  <img src={coverFile ? URL.createObjectURL(coverFile) : formData.coverImage} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    No Cover Image
                  </div>
                )}
              </div>
              <label className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer">
                <Camera size={16} />
                <span>Change Cover</span>
                <input
                  type="file"
                  id="coverImage"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
            {errors.coverImage && <p className="text-red-500 text-sm mt-1">{errors.coverImage}</p>}
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Your full name"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              id="bio"
              rows={4}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Tell people about yourself..."
            />
            {errors.bio && <p className="text-red-500 text-sm mt-1">{errors.bio}</p>}
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Where are you based?"
            />
            {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
          </div>

          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
              Website
            </label>
            <input
              type="url"
              id="website"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://your-website.com"
            />
            {errors.website && <p className="text-red-500 text-sm mt-1">{errors.website}</p>}
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isPrivate}
                onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Private Profile</span>
            </label>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;