'use client';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/libs/redux/store';
import { UserPosts as UserPostsList } from '@/components/profile/UserProfile';
import { 
  MapPin, 
  Calendar, 
  Link as LinkIcon, 
  Edit3, 
  Settings, 
  UserPlus, 
  UserCheck,
  MessageCircle,
  Camera,
  Users
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';
import { useGetUser, useFollowUser, useUnFollowUser } from '@/hooks/useUser';
import { useChat } from '@/hooks/useChat';
import EditProfileModal from '@/components/profile/EditProfileModal';
import Link from 'next/link';
import { User } from '@/types';
import UserReelsComponent from '@/components/reels/UserReels';

// interface ProfileUser {
//   _id: string;
//   username: string;
//   email?: string;
//   avatar?: string;
//   coverImage?: string;
//   bio?: string;
//   location?: string;
//   website?: string;
//   online?: boolean;
//   lastSeen?: string;
//   createdAt?: string;
//   isVerified?: boolean;
//   followers?: User[];
//   following?: User[]
//   isPrivate?: boolean;
//   followersCount?: number;
//   followingCount?: number;
//   postsCount?: number;
//   isFollowing?: boolean;
// }

const UserProfilePage = () => {
  const { id } = useParams();
  const router = useRouter();
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'likes' | 'saved'>('posts');
  const [showEditModal, setShowEditModal] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  
  const { data: profileData, isLoading: profileLoading } = useGetUser(id as string);
  const { mutate: followUser, isLoading: followLoading } = useFollowUser(id as string, () => {
     setProfileUser(prev => prev ? { ...prev, isFollowing: true } : null)
  });
  const { mutate: unfollowUser, isLoading: unfollowLoading } = useUnFollowUser(id as string, () => {
    setProfileUser(prev => prev ? { ...prev, isFollowing: false } : null)
  });
  const { createChat } = useChat();

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      try {
        if (id && id === currentUser?._id) {
          setProfileUser({
            _id: currentUser?._id || '',
            username: currentUser?.username || '',
            email: currentUser?.email || '',
            avatar: currentUser?.avatar || '',
            coverImage: currentUser?.coverImage || '',
            online: currentUser.online,
            lastSeen: currentUser.lastSeen,
            createdAt: currentUser?.createdAt,
            bio: currentUser?.bio || '',
            location: currentUser?.location || '',
            website: currentUser?.website || '',
            isVerified: currentUser?.isVerified || false,
            isPrivate: currentUser?.isPrivate || false,
            followersCount: currentUser?.followersCount || 0,
            followingCount: currentUser?.followingCount || 0,
            postsCount: currentUser?.postsCount || 0,
            followers: currentUser.followers,
            following: currentUser.following
          });
          setIsOwnProfile(true);
        } else if (profileData) {
          setProfileUser({
            ...profileData
          });
          setIsOwnProfile(false);
        } else {
          setProfileUser(null);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setProfileUser(null);
      }
      setIsLoading(false);
    };

    fetchUserProfile();
  }, [id, currentUser, profileData]);

  const handleFollow = () => {
    if (isFollowing) {
      unfollowUser(undefined);
    } else {
      followUser(undefined);
    }
  };

  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  const handleMessage = async () => {
    if (!currentUser || !profileUser) return;
    await createChat([currentUser?._id, profileUser?._id], "direct");
    router.push(window.innerWidth < 768 ? '/message' : '/chat');
  };

  if (isLoading || profileLoading) {
    return <ProfileSkeleton />;
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">User not found</h2>
          <p className="text-gray-600">The user you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  const isFollowing = profileUser.followers?.some((follower) => {
    return follower._id === currentUser?._id
  })
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
        
        {isOwnProfile && (
          <button 
            onClick={handleEditProfile}
            className="absolute bottom-4 right-4 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
          >
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
                      {profileUser.username && profileUser?.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                {profileUser.online && (
                  <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-white"></div>
                )}
                {isOwnProfile && (
                  <button 
                    onClick={handleEditProfile}
                    className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg transition-colors"
                  >
                    <Camera size={16} />
                  </button>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <h1 className="text-3xl font-bold text-gray-900 truncate">
                        {profileUser.username && profileUser.username}
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
                          disabled={followLoading || unfollowLoading}
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
                        <Link href={`/profile/${id}/connections`} className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl transition-colors">
                          <Users size={16} />
                        </Link>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-8 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{profileUser.postsCount?.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Posts</div>
                  </div>
                  <Link href={`/profile/${id}/connections?tab=followers`} className="text-center hover:text-blue-500 transition-colors">
                    <div className="text-2xl font-bold text-gray-900">{profileUser.followersCount?.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Followers</div>
                  </Link>
                  <Link href={`/profile/${id}/connections?tab=following`} className="text-center hover:text-blue-500 transition-colors">
                    <div className="text-2xl font-bold text-gray-900">{profileUser.followingCount?.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Following</div>
                  </Link>
                </div>

                {profileUser.bio && (
                  <div className="mb-6">
                    <p className="text-gray-800 whitespace-pre-line leading-relaxed">
                      {profileUser.bio}
                    </p>
                  </div>
                )}

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

          <div className="border-t border-gray-100 overflow-auto">
            <div className="flex">
              <button
                onClick={() => setActiveTab('posts')}
                className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 font-medium transition-colors ${
                  activeTab === 'posts'
                    ? 'text-blue-500 border-b-2 border-blue-500 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <span>Posts</span>
              </button>
              <button
                onClick={() => setActiveTab('reels')}
                className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 font-medium transition-colors ${
                  activeTab === 'reels'
                    ? 'text-blue-500 border-b-2 border-blue-500 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <span>Reels</span>
              </button>
              <button
                onClick={() => setActiveTab('likes')}
                className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 font-medium transition-colors ${
                  activeTab === 'likes'
                   ? 'text-blue-500 border-b-2 border-blue-500 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}>
                    <span>
                      Likes
                    </span>
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
                  <span>Saved</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {activeTab === 'posts' && <UserPostsList userId={id as string}/>}
          {activeTab === 'reels' && <UserReelsComponent userId={id as string} activeTab='reels'/>}
          {activeTab === 'likes' && <UserPostsList userId={id as string} type="likes" />}
          {activeTab === 'saved' && isOwnProfile && <UserPostsList userId={id as string} type="saved" />}
        </div>

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
    </div>
  );
};

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


export default UserProfilePage;