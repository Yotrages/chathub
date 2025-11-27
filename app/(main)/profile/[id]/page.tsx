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
  Users,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';
import { useGetUser, useFollowUser, useUnFollowUser } from '@/hooks/useUser';
import { useChat } from '@/hooks/useChat';
import EditProfileModal from '@/components/profile/EditProfileModal';
import Link from 'next/link';
import { User } from '@/types';
import UserReelsComponent from '@/components/reels/UserReels';
import { setActiveChat } from '@/libs/redux/chatSlice';
import { useDispatch } from 'react-redux';

const UserProfilePage = () => {
  const { id } = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const { chats } = useSelector((state: RootState) => state.chat);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'likes' | 'saved'>('posts');
  const [showEditModal, setShowEditModal] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const [mounted, setMounted] = useState(false);
  
  const { data: profileData, isLoading: profileLoading, error: profileError } = useGetUser(id as string);
  const { mutate: followUser, isLoading: followLoading } = useFollowUser(id as string, () => {
     setProfileUser(prev => prev ? { ...prev, isFollowing: true } : null)
  });
  const { mutate: unfollowUser, isLoading: unfollowLoading } = useUnFollowUser(id as string, () => {
    setProfileUser(prev => prev ? { ...prev, isFollowing: false } : null)
  });
  const { createChat } = useChat();

  useEffect(() => {
    setMounted(true);
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    console.log('📍 Profile effect running:', {
      id,
      currentUserId: currentUser?._id,
      hasCurrentUser: !!currentUser,
      hasProfileData: !!profileData,
      profileLoading
    });

    const fetchUserProfile = async () => {
      setIsLoading(true);
      try {
        if (id && id === currentUser?._id) {
          console.log('✅ Viewing own profile, using currentUser from Redux');
          setProfileUser({
            _id: currentUser._id,
            username: currentUser.username,
            email: currentUser.email,
            avatar: currentUser.avatar,
            coverImage: currentUser.coverImage,
            online: currentUser.online,
            lastSeen: currentUser.lastSeen,
            createdAt: currentUser.createdAt,
            bio: currentUser.bio,
            location: currentUser.location,
            website: currentUser.website,
            isVerified: currentUser.isVerified,
            isPrivate: currentUser.isPrivate,
            followersCount: currentUser.followersCount,
            followingCount: currentUser.followingCount,
            postsCount: currentUser.postsCount,
            followers: currentUser.followers,
            following: currentUser.following
          });
          setIsOwnProfile(true);
        } else if (profileData && !profileLoading) {
          console.log('✅ Viewing other user profile');
          setProfileUser(profileData);
          setIsOwnProfile(false);
        } else if (!profileData && !profileLoading) {
          console.log('❌ No profile data found');
          setProfileUser(null);
        }
      } catch (error) {
        console.error('❌ Error fetching user profile:', error);
        setProfileUser(null);
      }
      setIsLoading(false);
    };

    fetchUserProfile();
  }, [id, currentUser, profileData, profileLoading, mounted]);

  const handleFollow = () => {
    if (isFollowing) {
      unfollowUser(undefined);
    } else {
      followUser(undefined);
    }
  };

  const handleEditProfile = () => {
    if (windowWidth < 640) {
      router.push(`/profile/${currentUser?._id}/edit`);
    } else {
      setShowEditModal(true);
    }
  };

  const handleMessage = async () => {
    if (!currentUser || !profileUser) return;
    
    const matchedChat = chats.find((c) => {
      return c.participants.some((u) => u._id === profileUser._id) && c.type === 'direct'
    });
    
    if (matchedChat) {
      dispatch(setActiveChat(matchedChat._id));
      router.push('/chat');
    } else {
      try {
        const result = await createChat([profileUser._id], "direct");
        if (result.isSuccess) {
          router.push('/chat');
        }
      } catch (error) {
        console.error('Failed to create chat:', error);
      }
    }
  };

  if (!mounted || isLoading || profileLoading) {
    return <ProfileSkeleton />;
  }

  if (!profileUser || profileError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors duration-200">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">Failed to load user</h2>
          <button onClick={() => window.location.reload()} className="text-gray-600 dark:text-gray-400 text-sm bg-black dark:bg-gray-800 rounded-md py-3 px-4 sm:text-base">Try again</button>
        </div>
      </div>
    );
  }

  const isFollowing = profileUser.followers?.some((follower) => {
    return follower._id === currentUser?._id
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="relative h-48 sm:h-64 md:h-80 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500">
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
            className="absolute top-2 right-2 bg-white dark:bg-gray-700 bg-opacity-90 dark:bg-opacity-70 hover:bg-opacity-100 dark:hover:bg-opacity-100 text-gray-800 dark:text-white px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm shadow-md dark:shadow-lg"
          >
            <Camera size={14} className="sm:w-4 sm:h-4" />
            <span>Edit Cover</span>
          </button>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-0.5 xs:px-2 sm:px-4 -mt-16 sm:-mt-20 relative z-10">
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg dark:shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-200">
          <div className="p-4 sm:p-6 md:p-8">
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-4 md:space-x-8">
                <div className="relative flex-shrink-0 self-center sm:self-auto mb-4 sm:mb-0">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full ring-4 ring-white shadow-xl overflow-hidden bg-gray-100">
                    {profileUser.avatar ? (
                      <img
                        src={profileUser.avatar}
                        alt={profileUser.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl sm:text-3xl md:text-4xl font-bold">
                        {profileUser.username && profileUser?.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  {profileUser.online && (
                    <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-green-500 rounded-full border-2 sm:border-4 border-white"></div>
                  )}
                  {isOwnProfile && (
                    <button 
                      onClick={handleEditProfile}
                      className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white p-1.5 sm:p-2 rounded-full shadow-lg transition-colors"
                    >
                      <Camera size={12} className="sm:w-4 sm:h-4" />
                    </button>
                  )}
                </div>

                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4">
                    <div className="mb-3 sm:mb-0">
                      <div className="flex items-center justify-center sm:justify-start space-x-2 mb-1 sm:mb-2">
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 truncate max-w-[200px] sm:max-w-none">
                          {profileUser.username && profileUser.username}
                        </h1>
                        {profileUser.isVerified && (
                          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <p className="text-gray-600 mb-1 sm:mb-2 text-sm sm:text-base">@{profileUser.username}</p>
                      <span className="text-xs sm:text-sm text-gray-500">
                        {profileUser.online ? (
                          <span className="flex items-center justify-center sm:justify-start space-x-1">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
                            <span>Online now</span>
                          </span>
                        ) : profileUser.lastSeen ? (
                          `Last seen ${formatDistanceToNow(new Date(profileUser.lastSeen))} ago`
                        ) : (
                          'Offline'
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-center sm:justify-end space-x-2 sm:space-x-3">
                      {isOwnProfile ? (
                        <>
                          <button
                            onClick={handleEditProfile}
                            className="flex items-center space-x-1 sm:space-x-2 px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg sm:rounded-xl font-medium transition-colors text-xs sm:text-sm"
                          >
                            <Edit3 size={14} className="sm:w-4 sm:h-4" />
                            <span className="hidden xs:inline">Edit Profile</span>
                            <span className="xs:hidden">Edit</span>
                          </button>
                          <Link href={`/settings`} className="p-2 sm:p-2.5 md:p-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg sm:rounded-xl transition-colors">
                            <Settings size={14} className="sm:w-4 sm:h-4" />
                          </Link>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={handleFollow}
                            disabled={followLoading || unfollowLoading}
                            className={`flex items-center space-x-1 sm:space-x-2 px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 rounded-lg sm:rounded-xl font-medium transition-all duration-200 text-xs sm:text-sm ${
                              isFollowing
                                ? 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                                : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                            }`}
                          >
                            {isFollowing ? <UserCheck size={14} className="sm:w-4 sm:h-4" /> : <UserPlus size={14} className="sm:w-4 sm:h-4" />}
                            <span>{isFollowing ? 'Following' : 'Follow'}</span>
                          </button>
                          <button
                            onClick={handleMessage}
                            className="flex items-center space-x-1 sm:space-x-2 px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg sm:rounded-xl font-medium transition-colors text-xs sm:text-sm"
                          >
                            <MessageCircle size={14} className="sm:w-4 sm:h-4" />
                            <span className="hidden xs:inline">Message</span>
                            <span className="xs:hidden">Chat</span>
                          </button>
                          <Link href={`/profile/${id}/connections`} className="p-2 sm:p-2.5 md:p-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg sm:rounded-xl transition-colors">
                            <Users size={14} className="sm:w-4 sm:h-4" />
                          </Link>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 sm:gap-8 mb-4 sm:mb-6 max-w-sm mx-auto sm:max-w-none sm:mx-0">
                    <div className="text-center">
                      <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{profileUser.postsCount?.toLocaleString()}</div>
                      <div className="text-xs sm:text-sm text-gray-600">Posts</div>
                    </div>
                    <Link href={`/profile/${id}/connections?tab=followers`} className="text-center hover:text-blue-500 transition-colors">
                      <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{profileUser.followersCount?.toLocaleString()}</div>
                      <div className="text-xs sm:text-sm text-gray-600">Followers</div>
                    </Link>
                    <Link href={`/profile/${id}/connections?tab=following`} className="text-center hover:text-blue-500 transition-colors">
                      <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{profileUser.followingCount?.toLocaleString()}</div>
                      <div className="text-xs sm:text-sm text-gray-600">Following</div>
                    </Link>
                  </div>

                  {profileUser.bio && (
                    <div className="mb-4 sm:mb-6">
                      <p className="text-gray-800 whitespace-pre-line leading-relaxed text-sm sm:text-base text-center sm:text-left">
                        {profileUser.bio}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:flex-wrap items-center sm:items-start justify-center sm:justify-start gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                    {profileUser.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate max-w-[150px] sm:max-w-none">{profileUser.location}</span>
                      </div>
                    )}
                    {profileUser.website && (
                      <a
                        href={profileUser.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-blue-500 hover:text-blue-600 transition-colors"
                      >
                        <LinkIcon size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate max-w-[120px] sm:max-w-none">{profileUser.website.replace('https://', '')}</span>
                      </a>
                    )}
                    {profileUser.createdAt && (
                      <div className="flex items-center space-x-1">
                        <Calendar size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                        <span>Joined {new Date(profileUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100">
            <div className="flex overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab('posts')}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 sm:py-4 px-4 sm:px-6 font-medium transition-colors text-sm sm:text-base min-w-[80px] ${
                  activeTab === 'posts'
                    ? 'text-blue-500 border-b-2 border-blue-500 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <span>Posts</span>
              </button>
              <button
                onClick={() => setActiveTab('reels')}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 sm:py-4 px-4 sm:px-6 font-medium transition-colors text-sm sm:text-base min-w-[80px] ${
                  activeTab === 'reels'
                    ? 'text-blue-500 border-b-2 border-blue-500 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <span>Reels</span>
              </button>
              <button
                onClick={() => setActiveTab('likes')}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 sm:py-4 px-4 sm:px-6 font-medium transition-colors text-sm sm:text-base min-w-[80px] ${
                  activeTab === 'likes'
                   ? 'text-blue-500 border-b-2 border-blue-500 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}>
                    <span>Likes</span>
              </button>
              {isOwnProfile && (
                <button
                  onClick={() => setActiveTab('saved')}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 sm:py-4 px-4 sm:px-6 font-medium transition-colors text-sm sm:text-base min-w-[80px] ${
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

        <div className="px-0.5 xs:px-2 sm:px-4 py-4 sm:py-8">
          {activeTab === 'posts' && <UserPostsList username={profileUser.username as string} userId={id as string}/>}
          {activeTab === 'reels' && <UserReelsComponent username={profileUser.username as string} userId={id as string} activeTab='reels'/>}
          {activeTab === 'likes' && <UserPostsList username={profileUser.username as string} userId={id as string} type="likes" />}
          {activeTab === 'saved' && isOwnProfile && <UserPostsList username={profileUser.username as string} userId={id as string} type="saved" />}
        </div>

        {showEditModal && windowWidth >= 640 && (
          <EditProfileModal
            user={profileUser}
            onClose={() => setShowEditModal(false)}
            onSave={(updatedUser) => {
              console.log('📝 Profile updated from modal:', updatedUser);
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
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <div className="h-48 sm:h-64 md:h-80 bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
    <div className="max-w-4xl mx-auto px-2 sm:px-4 -mt-16 sm:-mt-20 relative z-10">
      <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg dark:shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 sm:p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-8">
            <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse mb-4 sm:mb-0 self-center sm:self-auto"></div>
            <div className="flex-1 space-y-3 sm:space-y-4">
              <div className="h-6 sm:h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-48 sm:w-64 mx-auto sm:mx-0"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24 sm:w-32 mx-auto sm:mx-0"></div>
              <div className="flex justify-center sm:justify-start space-x-8">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-5 sm:h-6 bg-gray-200 rounded animate-pulse w-8 sm:w-12"></div>
                    <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-12 sm:w-16"></div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mx-auto sm:mx-0"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default UserProfilePage;