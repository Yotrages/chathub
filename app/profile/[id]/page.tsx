'use client';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/libs/redux/store';
import { UserPosts as UserPostsList } from '@/components/profile/UserProfile'; 
import { 
  MapPin, 
  Calendar, 
  Link as LinkIcon, 
  Mail, 
  Edit3, 
  Settings, 
  UserPlus, 
  UserCheck,
  MessageCircle,
  MoreHorizontal,
  Camera,
  Globe,
  Heart,
  Users,
  Grid3X3,
  Bookmark,
  Image as ImageIcon,
  Video,
  FileText
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useParams } from 'next/navigation';

interface ProfileUser {
  _id: string;
  username: string;
  name?: string;
  email?: string;
  avatar?: string;
  online?: boolean;
  lastSeen?: string;
  createdAt?: string;
  bio?: string;
  location?: string;
  website?: string;
  isFollowing?: boolean;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  isVerified?: boolean;
  coverImage?: string;
}

interface UserProfilePageProps {
  userId?: string;
}

export const UserProfilePage = () => {
    const params  = useParams()
    const userId = params.userId
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'media' | 'likes' | 'saved'>('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      
      try {
        if (!userId || userId === currentUser?.id) {
          const profile: ProfileUser = {
            _id: currentUser?.id || '',
            username: currentUser?.username || '',
            name: currentUser?.name || '',
            email: currentUser?.email || '',
            avatar: currentUser?.avatar || '',
            online: true, 
            lastSeen: new Date().toISOString(),
            createdAt: currentUser?.createdAt || new Date().toISOString(),
            bio: '',
            location: '',
            website: '',
            followersCount: 0,
            followingCount: 0,
            postsCount: 0,
            isVerified: false,
            coverImage: '',
          };
          
          setProfileUser(profile);
          setIsOwnProfile(true);
        } else {
          const response = await fetch(`/api/users/${userId}`);
          if (response.ok) {
            const userData = await response.json();
            
            const profile: ProfileUser = {
              _id: userData._id,
              username: userData.username,
              name: userData.name || '',
              email: userData.email,
              avatar: userData.avatar || '',
              online: userData.online || false,
              lastSeen: userData.lastSeen,
              createdAt: userData.createdAt,
              bio: userData.bio || '',
              location: userData.location || '',
              website: userData.website || '',
              followersCount: userData.followersCount || 0,
              followingCount: userData.followingCount || 0,
              postsCount: userData.postsCount || 0,
              isVerified: userData.isVerified || false,
              coverImage: userData.coverImage || '',
            };
            
            setProfileUser(profile);
            setIsOwnProfile(false);
          } else {
            setProfileUser(null);
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setProfileUser(null);
      }
      
      setIsLoading(false);
    };

    fetchUserProfile();
  }, [userId, currentUser]);

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    // Add API call to follow/unfollow user
  };

  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  const handleMessage = () => {
    // Navigate to messages or open chat
    console.log('Message user');
  };

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">User not found</h2>
          <p className="text-gray-600">The user you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover Image */}
      <div className="relative h-80 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500">
        {profileUser.coverImage && (
          <img
            src={profileUser.coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        
        {/* Cover Actions */}
        {isOwnProfile && (
          <button className="absolute bottom-4 right-4 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2">
            <Camera size={16} />
            <span>Edit Cover</span>
          </button>
        )}
      </div>

      {/* Profile Header */}
      <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-8">
            <div className="flex flex-col lg:flex-row lg:items-end lg:space-x-8">
              {/* Avatar */}
              <div className="relative flex-shrink-0 mb-6 lg:mb-0">
                <div className="w-32 h-32 rounded-full ring-4 ring-white shadow-xl overflow-hidden bg-gray-100">
                  {profileUser.avatar ? (
                    <img
                      src={profileUser.avatar}
                      alt={profileUser.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
                      {profileUser.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                
                {/* Online Status */}
                {profileUser.online && (
                  <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-white"></div>
                )}
                
                {/* Edit Avatar */}
                {isOwnProfile && (
                  <button className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg transition-colors">
                    <Camera size={16} />
                  </button>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <h1 className="text-3xl font-bold text-gray-900 truncate">
                        {profileUser.name || profileUser.username}
                      </h1>
                      {profileUser.isVerified && (
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2">@{profileUser.username}</p>
                    <p className="text-sm text-gray-500">
                      {profileUser.online ? (
                        <span className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Online now</span>
                        </span>
                      ) : profileUser.lastSeen ? (
                        `Last seen ${formatDistanceToNow(new Date(profileUser.lastSeen))} ago`
                      ) : (
                        'Offline'
                      )}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                    {isOwnProfile ? (
                      <>
                        <button
                          onClick={handleEditProfile}
                          className="flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-medium transition-colors"
                        >
                          <Edit3 size={16} />
                          <span>Edit Profile</span>
                        </button>
                        <button className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl transition-colors">
                          <Settings size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleFollow}
                          className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                            isFollowing
                              ? 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                              : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                          }`}
                        >
                          {isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
                          <span>{isFollowing ? 'Following' : 'Follow'}</span>
                        </button>
                        <button
                          onClick={handleMessage}
                          className="flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-medium transition-colors"
                        >
                          <MessageCircle size={16} />
                          <span>Message</span>
                        </button>
                        <button className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl transition-colors">
                          <MoreHorizontal size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center space-x-8 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{profileUser.postsCount?.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Posts</div>
                  </div>
                  <div className="text-center cursor-pointer hover:text-blue-500 transition-colors">
                    <div className="text-2xl font-bold text-gray-900">{profileUser.followersCount?.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Followers</div>
                  </div>
                  <div className="text-center cursor-pointer hover:text-blue-500 transition-colors">
                    <div className="text-2xl font-bold text-gray-900">{profileUser.followingCount?.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Following</div>
                  </div>
                </div>

                {/* Bio */}
                {profileUser.bio && (
                  <div className="mb-6">
                    <p className="text-gray-800 whitespace-pre-line leading-relaxed">
                      {profileUser.bio}
                    </p>
                  </div>
                )}

                {/* Additional Info */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  {profileUser.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin size={16} />
                      <span>{profileUser.location}</span>
                    </div>
                  )}
                  {profileUser.website && (
                    <a
                      href={profileUser.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-blue-500 hover:text-blue-600 transition-colors"
                    >
                      <LinkIcon size={16} />
                      <span>{profileUser.website.replace('https://', '')}</span>
                    </a>
                  )}
                  {profileUser.createdAt && (
                    <div className="flex items-center space-x-1">
                      <Calendar size={16} />
                      <span>Joined {new Date(profileUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Tabs */}
          <div className="border-t border-gray-100">
            <div className="flex">
              <button
                onClick={() => setActiveTab('posts')}
                className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 font-medium transition-colors ${
                  activeTab === 'posts'
                    ? 'text-blue-500 border-b-2 border-blue-500 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Grid3X3 size={18} />
                <span>Posts</span>
              </button>
              <button
                onClick={() => setActiveTab('media')}
                className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 font-medium transition-colors ${
                  activeTab === 'media'
                    ? 'text-blue-500 border-b-2 border-blue-500 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <ImageIcon size={18} />
                <span>Media</span>
              </button>
              <button
                onClick={() => setActiveTab('likes')}
                className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 font-medium transition-colors ${
                  activeTab === 'likes'
                    ? 'text-blue-500 border-b-2 border-blue-500 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Heart size={18} />
                <span>Likes</span>
              </button>
              {isOwnProfile && (
                <button
                  onClick={() => setActiveTab('saved')}
                  className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 font-medium transition-colors ${
                    activeTab === 'saved'
                      ? 'text-blue-500 border-b-2 border-blue-500 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Bookmark size={18} />
                  <span>Saved</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {activeTab === 'posts' && <UserPostsList />}
        {activeTab === 'media' && <MediaGrid />}
        {activeTab === 'likes' && <LikedPosts />}
        {activeTab === 'saved' && isOwnProfile && <SavedPosts />}
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfileModal
          user={profileUser}
          onClose={() => setShowEditModal(false)}
          onSave={(updatedUser) => {
            setProfileUser(updatedUser);
            setShowEditModal(false);
          }}
        />
      )}
    </div>
  );
};

// Profile Loading Skeleton
const ProfileSkeleton = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="h-80 bg-gray-200 animate-pulse"></div>
    <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-10">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:space-x-8">
            <div className="w-32 h-32 rounded-full bg-gray-200 animate-pulse mb-6 lg:mb-0"></div>
            <div className="flex-1 space-y-4">
              <div className="h-8 bg-gray-200 rounded animate-pulse w-64"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
              <div className="flex space-x-8">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-6 bg-gray-200 rounded animate-pulse w-12"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Media Grid Component
const MediaGrid = () => (
  <div className="grid grid-cols-3 gap-4">
    {[...Array(9)].map((_, i) => (
      <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
    ))}
  </div>
);

// Liked Posts Component
const LikedPosts = () => (
  <div className="text-center py-12">
    <Heart size={48} className="mx-auto text-gray-400 mb-4" />
    <h3 className="text-xl font-semibold text-gray-900 mb-2">No liked posts yet</h3>
    <p className="text-gray-600">Posts that this user likes will appear here.</p>
  </div>
);

// Saved Posts Component
const SavedPosts = () => (
  <div className="text-center py-12">
    <Bookmark size={48} className="mx-auto text-gray-400 mb-4" />
    <h3 className="text-xl font-semibold text-gray-900 mb-2">No saved posts</h3>
    <p className="text-gray-600">Posts you save will appear here.</p>
  </div>
);

// Edit Profile Modal Component
const EditProfileModal = ({ user, onClose, onSave }: {
  user: ProfileUser;
  onClose: () => void;
  onSave: (user: ProfileUser) => void;
}) => {
  const [formData, setFormData] = useState({
    name: user.name || '',
    bio: user.bio || '',
    location: user.location || '',
    website: user.website || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...user, ...formData });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};