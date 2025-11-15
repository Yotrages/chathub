'use client';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/libs/redux/store';
import { Camera, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { useApiController } from '@/hooks/useFetch';
import { updateUserCredentials } from '@/libs/redux/authSlice';
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
      updateUserCredentials(data.user)
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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
            >
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Edit Profile</h1>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !hasChanges}
            className="flex items-center space-x-1.5 px-5 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-full font-semibold transition-all shadow-md hover:shadow-lg active:scale-95 text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      </div>

      <form className="pb-8">
        {/* Cover Image Section */}
        <div className="relative">
          <div className="h-40 bg-gradient-to-r from-purple-400 via-pink-400 to-red-400">
            {(currentUser?.coverImage || coverFile) && (
              <img
                src={coverFile ? URL.createObjectURL(coverFile) : currentUser?.coverImage}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <label className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white p-2.5 rounded-full cursor-pointer hover:bg-black/70 transition-all shadow-lg active:scale-95">
            <Camera size={18} />
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
            <div className="px-4 pt-2">
              <p className="text-red-500 text-xs flex items-center gap-1">
                <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                {errors.coverImage}
              </p>
            </div>
          )}
        </div>

        {/* Avatar Section */}
        <div className="px-4 -mt-14 mb-6">
          <div className="relative w-28 h-28">
            <div className="w-full h-full rounded-full ring-4 ring-white shadow-xl overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100">
              {(currentUser?.avatar || avatarFile) ? (
                <img
                  src={avatarFile ? URL.createObjectURL(avatarFile) : currentUser?.avatar}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                  {user.username && user.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <label className="absolute bottom-1 right-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-2 rounded-full cursor-pointer shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-blue-700 transition-all active:scale-95">
              <Camera size={14} />
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
            <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
              <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
              {errors.avatar}
            </p>
          )}
        </div>

        {/* Form Fields */}
        <div className="px-4 space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-4 py-3 text-base bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all duration-200 placeholder-gray-400"
              placeholder="Your full name"
            />
            <div className="flex justify-between items-center px-1">
              {errors.name ? (
                <p className="text-red-500 text-xs flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                  {errors.name}
                </p>
              ) : (
                <span></span>
              )}
              <span className="text-xs text-gray-400 font-medium">{formData.name.length}/50</span>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">Bio</label>
            <textarea
              rows={3}
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              className="w-full px-4 py-3 text-base bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all duration-200 resize-none placeholder-gray-400"
              placeholder="Tell people about yourself..."
            />
            <div className="flex justify-between items-center px-1">
              {errors.bio ? (
                <p className="text-red-500 text-xs flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                  {errors.bio}
                </p>
              ) : (
                <span></span>
              )}
              <span className="text-xs text-gray-400 font-medium">{formData.bio.length}/160</span>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full px-4 py-3 text-base bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all duration-200 placeholder-gray-400"
              placeholder="Where are you based?"
            />
            <div className="flex justify-between items-center px-1">
              {errors.location ? (
                <p className="text-red-500 text-xs flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                  {errors.location}
                </p>
              ) : (
                <span></span>
              )}
              <span className="text-xs text-gray-400 font-medium">{formData.location.length}/100</span>
            </div>
          </div>

          {/* Website */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">Website</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              className="w-full px-4 py-3 text-base bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all duration-200 placeholder-gray-400"
              placeholder="https://your-website.com"
            />
            {errors.website && (
              <p className="text-red-500 text-xs px-1 flex items-center gap-1">
                <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                {errors.website}
              </p>
            )}
          </div>

          {/* Privacy Toggle */}
          <div className="py-2">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-100 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900">Private Profile</h3>
                  <p className="text-xs text-gray-600 mt-1">Only approved followers can see your posts and stories</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={formData.isPrivate}
                    onChange={(e) => handleInputChange('isPrivate', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-md peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Additional Info Card */}
          <div className="bg-blue-50 border-2 border-blue-100 rounded-xl p-4 mt-6">
            <p className="text-xs text-gray-600 leading-relaxed">
              💡 <span className="font-semibold">Tip:</span> Keep your profile updated to help others connect with you. A complete profile gets more engagement!
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MobileEditProfilePage;