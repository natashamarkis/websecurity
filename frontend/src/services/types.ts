export interface User {
  id: number;
  username: string;
  email: string;
  bio?: string;
  avatar?: string;
  role: string;
  created_at?: string;
  postsCount?: number;
}

export interface Post {
  id: number;
  user_id: number;
  title: string;
  content: string;
  created_at: string;
  username: string;
  avatar?: string;
}

export interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  text: string;
  created_at: string;
  username: string;
  avatar?: string;
}

export interface Message {
  id: number;
  from_user_id: number;
  to_user_id: number;
  text: string;
  created_at: string;
  sender_username?: string;
  sender_avatar?: string;
}

export interface DemoLog {
  id: number;
  type: string;
  description: string;
  payload?: string;
  created_at: string;
}
