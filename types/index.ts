import { PaginationInfo } from "@/libs/redux/postSlice";

export interface User {
  _id: string;
  email: string;
  avatar?: string;
  username?: string;
  createdAt?: string;
  online: boolean;
  lastSeen?: Date;
  updatedAt?: Date;
  isPrivate?: boolean;
  bio?: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  followers?: User[];
  following?: User[];
  location?: string;
  website?: string;
  isVerified?: boolean;
  coverImage?: string;
  savedPost?: Post[];
  likedPost?: Post[];
}

export interface AuthState {
  background: string;
  user: User | null;
  isAuthenticated: boolean;
  pagination: PaginationInfo | null
  isLoading: boolean;
  suggestedUsers: User[] | null
}

export interface IComment {
  _id: string;
  dynamicId: string; 
  parentCommentId?: string | null;
  authorId: {
    _id: string;
    username: string;
    avatar: string;
  };
  content: string;
  file?: string;
  reactions: ReactedUser[];
  replies?: IComment[];
  repliesCount?: number;
  isDeleted?: boolean;
  isEdited?: boolean;
  editedAt?: string;
  createdAt: Date;
}

export interface ReactedUser {
  userId: {
    _id: string;
    username: string;
    avatar: string;
  };
  emoji: {
    category: string;
    name: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

// export interface IReply {
//   _id: string;
//   authorId: {
//     _id: string;
//     username: string;
//     avatar: string;
//   };
//   content: string;
//   reactions: Array<{
//     userId: {
//       _id: string;
//       username: string;
//       avatar: string;
//     };
//     emoji: {
//       category: string;
//       name: string;
//     };
//   }>;
//   replies?: IReply[];
//   createdAt?: Date;
//   updatedAt?: Date;
// }

export interface Post {
  _id: string;
   authorId: {
    _id: string;
    username: string;
    avatar: string | null;
  };
  content: string;
  images?: string[];
  reactions: ReactedUser[];
  isDeleted?: boolean;
  commentsCount: number
  createdAt: string | Date;
  updatedAt?: string | Date;
  shareCount: number;
  savedAt?: string | Date;
}

export interface Sender {
  _id: string;
  username: string;
  avatar?: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: Sender | string;
  content: string;
  messageType: "text" | "image" | "file" | "audio" | "video" | "post";
  edited: boolean;
  readBy: Array<{
    userId: {
      _id: string;
      username: string;
      avatar?: string;
    };
    readAt: string;
  }>
  reactions: Array<{
    userId: { _id: string; username: string; avatar: string };
    emoji: {
      category: string;
      name: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
  __v?: number;
  fileUrl?: string;
  fileName?: string;
  editedAt?: string;
  postId?: string;
  replyTo?: {
    _id: string;
    content: string;
    senderId: Sender | string;
    messageType: "text" | "image" | "file" | "audio" | "video" | "post";
    fileUrl?: string;
    fileName?: string;
  };
}

export interface Chat {
  _id: string;
  name?: string;
  type: "direct" | "group";
  participants: Array<{
    _id: string;
    username: string;
    avatar?: string;
  }>;
  lastMessage?: Message;
  lastMessageTime?: string;
  unreadCount: number;
  avatar?: string;
  isPinned?: boolean;
  isMuted?: boolean;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
  pinnedMessages?: string[];
}

// API Response interfaces
export interface SendMessageResponse {
  success: boolean;
  message: Message;
}

export interface ConversationResponse {
  success: boolean;
  conversations: Chat[];
}

export interface MessagesResponse {
  success: boolean;
  messages: Message[];
}

export interface CommentListProps {
  type: "post" | "reel";
  comments: IComment[];
  dynamicId: string;
}

export interface ReactionModalProps {
  reactions: Array<{
    userId: {
      _id: string;
      username: string;
      avatar: string;
    };
    emoji: {
      category: string;
      name: string;
    };
  }>;
  isOpen: boolean;
  onClose: () => void;
  type?: string;
}

export interface ReplyItemProps {
  type: "post" | "reel";
  reply: IComment;
  onShowReactions: (reactions: IComment["reactions"], type: string) => void;
  dynamicId: string;
  commentId: string;
  isLast?: boolean;
  depth?: number;
}

export interface CommentItemProps {
  type: "post" | "reel";
  comment: IComment;
  dynamicId: string;
  onShowReactions: (
    reactions: Array<{
      userId: {
        _id: string;
        username: string;
        avatar: string;
      };
      emoji: {
        category: string;
        name: string;
      };
    }>,
    type: string
  ) => void;
}

export interface Notification {
  _id: string;
  recipientId: string;
  senderId: User;
  type:
    | "follow"
    | "like_post"
    | "like_reel"
    | "comment"
    | "reply"
    | "message"
    | "mention"
    | "tag";
  message: string;
  entityType: "post" | "reel" | "comment" | "message" | "user";
  entityId: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  success: boolean;
  data: {
    notifications: Notification[];
    totalCount: number;
    unreadCount: number;
    hasMore: boolean;
  };
}

export interface Story {
  _id: string;
  fileType: "image" | "video";
  text?: string;
  fileUrl: string;
  textStyle?: string;
  reactions: Array<{
    userId: {
      _id: string;
      username?: string;
      avatar?: string;
    };
    emoji: string;
  }>;
  isLiked: boolean;
  viewers: Array<{ _id: string; username: string; avatar?: string }>;
  authorId: {
    _id: string;
    username: string;
    name?: string;
    avatar?: string;
  };
  viewedAt?: Date;
  textPosition?: { x: number; y: number };
  background?: string;
  createdAt: string;
}

export interface StoryResponse {
  success: boolean;
  data: Story[];
  message?: string;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface CreateStoryPayload {
  text: string;
  file?: File;
  fileType: "image" | "video";
  background?: string;
  textPosition: { x: number; y: number };
  textStyle: string;
}

export interface Reel {
  _id: string;
  authorId: {
    _id: string;
    username: string;
    avatar: string;
  };
  viewedAt: string;
  viewers: Array<{ _id: string; username: string; avatar?: string }>;
  createdAt: Date;
  shareCount: number;
  updatedAt: Date;
  reactions: Array<{
    userId: {
      _id: string;
      username: string;
      avatar: string;
    };
    emoji: {
      category: string;
      name: string;
    };
  }>;
  commentsCount: number;
  fileUrl: string;
  title: string;
  __v?: number;
}

export interface MemoryThread {
  _id: string;
  participants: string[];
  keywords: string[];
  relatedPosts: string[];
  lastActivity: string;
  context: string;
  relevanceScore: number;
  createdAt: string;
}

export interface MemoryContextData {
  postId: string;
  content: string;
  authorUsername: string;
  createdAt: string;
  type: 'post' | 'comment' | 'reel';
}


export interface UserSettings {
  _id: string;
  userId: string;
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    allowMessagesFrom: 'everyone' | 'friends' | 'none';
    showOnlineStatus: boolean;
    allowTagging: boolean;
    showEmail: boolean;
    showPhoneNumber: boolean;
  };
  notifications: {
    email: {
      newFollower: boolean;
      messageReceived: boolean;
      postLiked: boolean;
      postCommented: boolean;
      mentioned: boolean;
      systemUpdates: boolean;
    };
    push: {
      newFollower: boolean;
      messageReceived: boolean;
      postLiked: boolean;
      postCommented: boolean;
      mentioned: boolean;
      systemUpdates: boolean;
    };
    inApp: {
      newFollower: boolean;
      messageReceived: boolean;
      postLiked: boolean;
      postCommented: boolean;
      mentioned: boolean;
      systemUpdates: boolean;
      onlineStatus: boolean;
    };
  };
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    fontSize: 'small' | 'medium' | 'large';
    backgroundImage: string;
    accentColor: string;
  };
  security: {
    twoFactorAuth: boolean;
    loginAlerts: boolean;
    sessionTimeout: number;
    blockedUsers: string[];
    trustedDevices: {
      deviceId: string;
      deviceName: string;
      lastUsed: string;
      trusted: boolean;
    }[];
  };
  content: {
    autoPlayVideos: boolean;
    showSensitiveContent: boolean;
    contentLanguages: string[];
    blockedKeywords: string[];
  };
  account: {
    isDeactivated: boolean;
    deactivatedAt?: string;
    deleteScheduledAt?: string;
    dataDownloadRequests: {
      requestedAt: string;
      status: 'pending' | 'processing' | 'completed' | 'failed';
      downloadUrl?: string;
      expiresAt?: string;
    }[];
  };
}

export interface Report {
  _id: string;
  reportType: string;
  description: string;
  status: string;
  createdAt: string;
  reportedUserId?: string;
  reportedPostId?: string;
  reportedCommentId?: string;
}

export interface UserStatus {
  isOnline: boolean;
  username: string;
}

export interface IncomingCall {
  from: string;
  isVideo: boolean;
}

export type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended' | 'failed';
export type ConnectionState = 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';