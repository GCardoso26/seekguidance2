export type CommunityPost = {
  id: string;
  communityId: string;
  title: string;
  content: string;
  imageUrl?: string | null;
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
