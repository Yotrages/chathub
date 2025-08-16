'use client';
import { useSelector } from 'react-redux';
import { RootState } from '@/libs/redux/store';
import { X, Edit, Trash2, LogOut } from 'lucide-react';
import { useChat } from '@/hooks/useChat';

interface ChatProfileProps {
  onClose: () => void;
}

export const ChatProfile = ({ onClose }: ChatProfileProps) => {
  const { activeChat, chats } = useSelector((state: RootState) => state.chat);
  const { deleteChat, leaveChat } = useChat();
  const currentChat = chats.find((chat) => chat._id === activeChat);

  if (!currentChat) return null;

  const handleUpdate = () => {
    // Logic to open an edit modal for group name/description
    console.log('Edit chat:', currentChat);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this chat?')) {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">{currentChat.type === 'group' ? 'Group Details' : 'User Profile'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mr-4">
              <span className="text-white font-semibold">
                {currentChat.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-semibold">{currentChat.name || 'Unknown'}</h3>
              {currentChat.type === 'group' && (
                <p className="text-sm text-gray-500">{currentChat.participants.length} members</p>
              )}
            </div>
          </div>
          {currentChat.type === 'group' && (
            <>
              <div className="mb-4">
                <h4 className="font-medium">Participants</h4>
                <ul className="mt-2 space-y-2">
                  {currentChat.participants.map((participantId) => (
                    <li key={participantId._id} className="flex items-center">
                      <div className="w-8 h-8 bg-gray-200 rounded-full mr-2" />
                      <span className="text-sm">User {participantId.username}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <button
                  onClick={handleUpdate}
                  className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <Edit size={16} className="mr-2" />
                  Edit Group
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete Group
                </button>
                <button
                  onClick={handleLeave}
                  className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <LogOut size={16} className="mr-2" />
                  Leave Group
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};