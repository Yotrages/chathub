'use client';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/libs/redux/store';
import { Camera, ArrowLeft, Check } from 'lucide-react';
import { useApiController } from '@/hooks/useFetch';
import { setUserCredentials } from '@/libs/redux/authSlice';
import { User } from '@/types';
import { useRouter } from 'next/navigation';
import { useGetUser } from '@/hooks/useUser';

const MobileEditProfilePage = () => {
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const id = currentUser?._id
  const router = useRouter();
  const { data: profileData } = useGetUser(id as string);
  
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    website: '',
    isPrivate: false,
    avatar: '',
    coverImage: ''
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { mutate, isLoading } = useApiController({
    method: 'PATCH',
    url: `/auth/users/${id}`,
    successMessage: 'Profile updated successfully',
    onSuccess: (data) => {
      setUserCredentials(data.updatedUser);
      router.back();
    }
  });

  useEffect(() => {
    let userData: User | null = null;
    if (id === currentUser?._id) {
      userData = currentUser;
    } else if (profileData) {
      userData = profileData;
    }
    
    if (userData) {
      setUser(userData);
      setFormData({
        name: userData.username || '',
        bio: userData.bio || '',
        location: userData.location || '',
        website: userData.website || '',
        isPrivate: userData.isPrivate || false,
        avatar: userData.avatar || '',
        coverImage: userData.coverImage || ''
      });
    }
  }, [id, currentUser, profileData]);

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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Edit Profile</h1>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !hasChanges}
            className="flex items-center space-x-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-full font-medium transition-colors text-sm"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Check size={16} />
            )}
            <span>Save</span>
          </button>
        </div>
      </div>

      <form className="pb-8">
        {/* Cover Image Section */}
        <div className="relative">
          <div className="h-32 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500">
            {(formData.coverImage || coverFile) && (
              <img
                src={coverFile ? URL.createObjectURL(coverFile) : formData.coverImage}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <label className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full cursor-pointer">
            <Camera size={16} />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                setCoverFile(e.target.files?.[0] || null);
                setHasChanges(true);
              }}
            />
          </label>
          {errors.coverImage && (
            <p className="text-red-500 text-xs px-4 mt-1">{errors.coverImage}</p>
          )}
        </div>

        {/* Avatar Section */}
        <div className="px-4 -mt-12 mb-4">
          <div className="relative w-24 h-24">
            <div className="w-full h-full rounded-full ring-4 ring-white shadow-lg overflow-hidden bg-gray-100">
              {(formData.avatar || avatarFile) ? (
                <img
                  src={avatarFile ? URL.createObjectURL(avatarFile) : formData.avatar}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                  {user.username && user.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-blue-500 text-white p-1.5 rounded-full cursor-pointer shadow-lg">
              <Camera size={12} />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  setAvatarFile(e.target.files?.[0] || null);
                  setHasChanges(true);
                }}
              />
            </label>
          </div>
          {errors.avatar && (
            <p className="text-red-500 text-xs mt-1">{errors.avatar}</p>
          )}
        </div>

        {/* Form Fields */}
        <div className="px-4 space-y-6">
          {/* Name */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-0 py-2 text-base border-0 border-b border-gray-200 focus:border-blue-500 focus:ring-0 bg-transparent"
              placeholder="Your full name"
            />
            <div className="flex justify-between items-center">
              {errors.name ? (
                <p className="text-red-500 text-xs">{errors.name}</p>
              ) : (
                <span></span>
              )}
              <span className="text-xs text-gray-400">{formData.name.length}/50</span>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Bio</label>
            <textarea
              rows={3}
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              className="w-full px-0 py-2 text-base border-0 border-b border-gray-200 focus:border-blue-500 focus:ring-0 bg-transparent resize-none"
              placeholder="Tell people about yourself..."
            />
            <div className="flex justify-between items-center">
              {errors.bio ? (
                <p className="text-red-500 text-xs">{errors.bio}</p>
              ) : (
                <span></span>
              )}
              <span className="text-xs text-gray-400">{formData.bio.length}/160</span>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full px-0 py-2 text-base border-0 border-b border-gray-200 focus:border-blue-500 focus:ring-0 bg-transparent"
              placeholder="Where are you based?"
            />
            <div className="flex justify-between items-center">
              {errors.location ? (
                <p className="text-red-500 text-xs">{errors.location}</p>
              ) : (
                <span></span>
              )}
              <span className="text-xs text-gray-400">{formData.location.length}/100</span>
            </div>
          </div>

          {/* Website */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Website</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              className="w-full px-0 py-2 text-base border-0 border-b border-gray-200 focus:border-blue-500 focus:ring-0 bg-transparent"
              placeholder="https://your-website.com"
            />
            {errors.website && (
              <p className="text-red-500 text-xs">{errors.website}</p>
            )}
          </div>

          {/* Privacy Toggle */}
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-medium text-gray-900">Private Profile</h3>
                <p className="text-sm text-gray-500">Only your followers can see your posts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPrivate}
                  onChange={(e) => handleInputChange('isPrivate', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MobileEditProfilePage;