export type CommunityPost = {
  id: string;
  communityId: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  imageUrls?: string[];
  tags?: string[];
  isPinned?: boolean;
  voteCount: number;
  commentCount: number;
  authorId: string;
  authorHandle?: string | null;
  authorName?: string | null;
  createdAt?: string | null;
};

export type PostComment = {
  id: string;
  postId: string;
  parentId?: string | null;
  content: string;
  authorId: string;
  authorHandle?: string | null;
  authorName?: string | null;
  createdAt?: string | null;
};

export type PostSort = "hot" | "new" | "top";
export type TopPeriod = "week" | "month" | "year" | "all";

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  content?: string | null;
  link?: string | null;
  readAt?: string | null;
  createdAt?: string | null;
  source?: "social" | "marketplace";
};

export type FeedbackItem = {
  id: string;
  type: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  createdAt?: string | null;
};

export type NewsletterEdition = {
  id: string;
  title: string;
  content: string;
  sentAt?: string | null;
  createdAt?: string | null;
};
