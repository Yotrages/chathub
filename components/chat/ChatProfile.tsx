'use client';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/libs/redux/store';
import { 
  X, 
  Edit, 
  Trash2, 
  LogOut, 
  UserPlus, 
  Users, 
  Bell, 
  BellOff,
  Image as ImageIcon,
  Camera,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
} from 'lucide-react';
import { useChat } from '@/hooks/useChat';

interface ChatProfileProps {
  onClose: () => void;
}

export const ChatProfile = ({ onClose }: ChatProfileProps) => {
  const { activeChat, chats } = useSelector((state: RootState) => state.chat);
  const { user } = useSelector((state: RootState) => state.auth);
  const { deleteChat, leaveChat } = useChat();
  const currentChat = chats.find((chat) => chat._id === activeChat);
  
  const [activeTab, setActiveTab] = useState<'info' | 'members' | 'media'>('info');
  const [isMuted, setIsMuted] = useState(currentChat?.isMuted || false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(currentChat?.name || '');
  const [editDescription, setEditDescription] = useState('');

  if (!currentChat) return null;

  const isGroup = currentChat.type === 'group';
  const isAdmin = currentChat.admins?.some((admin) => admin._id === user?._id);
  const memberCount = currentChat.participants?.length || 0;

  const otherParticipant = !isGroup 
    ? currentChat.participants.find(p => p._id !== user?._id)
    : null;

  const handleUpdate = () => {
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    // TODO: Implementation of API call to update group
    console.log('Updating group:', { name: editName, description: editDescription });
    setShowEditModal(false);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
      deleteChat(currentChat._id);
      onClose();
    }
  };

  const handleLeave = () => {
    if (confirm('Are you sure you want to leave this group?')) {
      leaveChat(currentChat._id);
      onClose();
    }
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    // TODO: Implement mute/unmute API call
  };

  const handleAddMember = () => {
    // TODO: Open add member modal
    console.log('Add member to group');
  };

  const handleRemoveMember = (memberId: string) => {
    if (confirm('Remove this member from the group?')) {
      // TODO: Implement remove member API call
      console.log('Remove member:', memberId);
    }
  };

  const displayName = isGroup 
    ? currentChat.name 
    : otherParticipant?.username || 'Unknown';

  const displayAvatar = isGroup 
    ? currentChat.avatar 
    : otherParticipant?.avatar;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="relative h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-colors"
            >
              <X size={20} className="text-white" />
            </button>
          </div>

          {/* Profile Picture */}
          <div className="px-6 -mt-16 relative">
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center ring-4 ring-white shadow-lg overflow-hidden">
                {displayAvatar ? (
                  <img 
                    src={displayAvatar} 
                    alt={displayName} 
                    className="w-full h-full text-center object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-4xl">
                    {displayName?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {isGroup && isAdmin && (
                <button className="absolute bottom-2 right-2 p-2 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg transition-colors">
                  <Camera size={16} className="text-white" />
                </button>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="px-6 mt-4 pb-4 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{displayName}</h2>
                {isGroup ? (
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                    <Users size={14} />
                    {memberCount} {memberCount === 1 ? 'member' : 'members'}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">
                    {otherParticipant?.online ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                        Online
                      </span>
                    ) : (
                      <span className="text-gray-400">Offline</span>
                    )}
                  </p>
                )}
              </div>
              <button
                onClick={handleMuteToggle}
                className={`p-3 rounded-full transition-colors ${
                  isMuted 
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}
              >
                {isMuted ? <BellOff size={20} /> : <Bell size={20} />}
              </button>
            </div>
            {editDescription && (
              <p className="text-sm text-gray-600 mt-3 p-3 bg-gray-50 rounded-lg">
                {editDescription}
              </p>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 px-6">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-3 font-medium text-sm transition-colors relative ${
                activeTab === 'info' 
                  ? 'text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Info
              {activeTab === 'info' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
            {isGroup && (
              <>
                <button
                  onClick={() => setActiveTab('members')}
                  className={`px-4 py-3 font-medium text-sm transition-colors relative ${
                    activeTab === 'members' 
                      ? 'text-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Members
                  {activeTab === 'members' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('media')}
                  className={`px-4 py-3 font-medium text-sm transition-colors relative ${
                    activeTab === 'media' 
                      ? 'text-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Media
                  {activeTab === 'media' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                  )}
                </button>
              </>
            )}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-400px)]">
            {/* Info Tab */}
            {activeTab === 'info' && (
              <div className="space-y-4">
                {!isGroup && otherParticipant && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Mail size={18} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm text-gray-900">{otherParticipant.email || 'Not available'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="p-2 bg-green-100 rounded-full">
                        <Phone size={18} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="text-sm text-gray-900">Not available</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="p-2 bg-purple-100 rounded-full">
                        <MapPin size={18} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Location</p>
                        <p className="text-sm text-gray-900">Not available</p>
                      </div>
                    </div>
                  </div>
                )}

                {isGroup && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Calendar size={18} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Created</p>
                        <p className="text-sm text-gray-900">
                          {new Date(currentChat.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <Shield size={18} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-blue-600 font-medium">You are an admin</p>
                          <p className="text-xs text-blue-500">You can manage this group</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2 pt-4 border-t border-gray-200">
                  {isGroup && isAdmin && (
                    <>
                      <button
                        onClick={handleUpdate}
                        className="flex items-center w-full px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit size={18} className="mr-3" />
                        <span className="font-medium">Edit Group Details</span>
                      </button>
                      <button
                        onClick={handleAddMember}
                        className="flex items-center w-full px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <UserPlus size={18} className="mr-3" />
                        <span className="font-medium">Add Members</span>
                      </button>
                    </>
                  )}
                  
                  {isGroup && (
                    <button
                      onClick={handleLeave}
                      className="flex items-center w-full px-4 py-3 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                    >
                      <LogOut size={18} className="mr-3" />
                      <span className="font-medium">Leave Group</span>
                    </button>
                  )}

                  {(isAdmin || !isGroup) && (
                    <button
                      onClick={handleDelete}
                      className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} className="mr-3" />
                      <span className="font-medium">Delete {isGroup ? 'Group' : 'Chat'}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && isGroup && (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">
                    Members ({memberCount})
                  </h3>
                  {isAdmin && (
                    <button
                      onClick={handleAddMember}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                    >
                      <UserPlus size={16} />
                      Add
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {currentChat.participants.map((participant) => {
                    const isParticipantAdmin = currentChat.admins?.some((admin) => admin._id === participant._id);
                    return (
                      <div 
                        key={participant._id} 
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden">
                              {participant.avatar ? (
                                <img 
                                  src={participant.avatar} 
                                  alt={participant.username} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-white font-semibold text-sm">
                                  {participant.username.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            {participant.online && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {participant.username}
                              {participant._id === user?._id && (
                                <span className="text-xs text-gray-500 ml-2">(You)</span>
                              )}
                            </p>
                            {isParticipantAdmin && (
                              <p className="text-xs text-blue-600 font-medium">Admin</p>
                            )}
                          </div>
                        </div>
                        {isAdmin && participant._id !== user?._id && (
                          <button
                            onClick={() => handleRemoveMember(participant._id)}
                            className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Media Tab */}
            {activeTab === 'media' && isGroup && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Shared Media</h3>
                <div className="grid grid-cols-3 gap-2">
                  {/* Placeholder for shared media */}
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <div 
                      key={item}
                      className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      <ImageIcon size={24} className="text-gray-400" />
                    </div>
                  ))}
                </div>
                <p className="text-center text-sm text-gray-500 mt-4">
                  Shared photos and videos will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Group Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit Group</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter group name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Enter group description"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};