export interface User {
    id: string;
    email: string;
    avatar?: string;
    username?: string;
    name?: string
    createdAt?: string;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean
}

export interface IComment {
  _id: string;
  authorId: {
    username: string;
    avatar: string
  };
  likes: Array<{
    _id: string;
    username?: string;
    avatar?: string;
  }>;
  replies?: IReply[];
  content: string;
  createdAt: Date;
}

export interface IReply {
  _id: string;
  authorId: {
    username: string;
    avatar: string
  };
  content: string;
  likes: Array<{
    _id: string;
    username?: string;
    avatar?: string;
  }>;
  replies?: IReply[]; 
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Post {
  _id: string;
  content: string;
  authorId: {
    _id: string;
    username: string;
    avatar: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
  likes:Array<{
    _id: string;
    username?: string;
    avatar?: string;
  }>;
  comments: IComment[];
  images: string[];
  __v?: number; 
}