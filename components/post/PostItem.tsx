'use client';
import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/libs/redux/store";
import { Post } from "@/types";
import PostHeader from "./PostHeader";
import PostContent from "./PostContent";
import PostMediaGallery from "./PostMediaGallery";
import PostEngagement from "./PostEngagement";
import PostComments from "./PostComments";
import EditModal from "./Editmodal";
import { ReactionsModal } from "./LikesModal";
import { removePost, selectComments, selectPagination } from "@/libs/redux/postSlice";
import { useRouter } from "next/navigation";
import { useGetComments } from "@/hooks/usePosts";

interface PostItemProps {
  post: Post;
}

export const PostItem = ({ post }: PostItemProps) => {
  const [showComments, setShowComments] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [showReactions, setShowReactions] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showLikes, setShowLikes] = useState(false);
  const [hide, setHide] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch: AppDispatch = useDispatch();
  const router = useRouter();
  const comments = useSelector(selectComments(post._id));
  const commentPagination = useSelector(selectPagination('comment', post._id));
  const { trigger: fetchComments, isLoading: isFetchingComments } = useGetComments(post._id);

  useEffect(() => {
    console.log(`PostItem mounted for postId ${post._id}, comments:`, comments); // Debug log
    console.log(`Fetching comments for postId ${post._id}`); // Debug log
    fetchComments();
  }, [fetchComments, post._id]);

  useEffect(() => {
    console.log(`Comments updated for postId ${post._id}:`, comments); // Debug log
  }, [comments, post._id]);

  const toggleComments = () => {
    if (window.innerWidth <= 768 && !window.location.href.includes('/post/')) {
      console.log(`Redirecting to /post/${post._id} for mobile view`); // Debug log
      router.push(`/post/${post._id}`);
      setShowComments(true);
    } else {
      console.log(`Toggling comments for postId ${post._id}, showComments: ${!showComments}`); // Debug log
      setShowComments(!showComments);
    }
  };

  const hidePost = () => {
    console.log(`Hiding post ${post._id}`); // Debug log
    setHide(true);
    dispatch(removePost(post._id));
  };

  if (hide) return null;

  return (
    <article className="bg-white rounded-2xl flex flex-col shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
      <PostHeader
        authorId={post.authorId}
        createdAt={post.createdAt}
        postId={post._id}
        content={post.content}
        onEdit={() => setIsOpen(true)}
        onHide={hidePost}
      />
      <PostContent content={post.content} />
      <PostMediaGallery
        images={post.images || []}
        currentMediaIndex={currentMediaIndex}
        setCurrentMediaIndex={setCurrentMediaIndex}
        isVideoPlaying={isVideoPlaying}
        setIsVideoPlaying={setIsVideoPlaying}
        isVideoMuted={isVideoMuted}
        setIsVideoMuted={setIsVideoMuted}
        videoRef={videoRef}
      />
      <PostEngagement
        postId={post._id}
        reactions={post.reactions || []}
        comments={comments || []}
        images={post.images || []}
        user={user}
        showReactions={showReactions}
        setShowReactions={setShowReactions}
        onShowComments={toggleComments}
        showComments={showComments}
        setShowLikes={setShowLikes}
        post={post}
      />
      {showComments && (
        <div className="p-2">
          {isFetchingComments ? (
            <p className="text-gray-500 text-center">Loading comments...</p>
          ) : (
            <PostComments
              type="post"
              dynamicId={post._id}
              comments={comments}
              user={user}
              commentContent={commentContent}
              setCommentContent={setCommentContent}
            />
          )}
          {commentPagination?.hasNextPage && (
            <button
              onClick={() => fetchComments()}
              className="text-blue-500 mt-2 text-center"
              disabled={isFetchingComments}
            >
              Load more comments
            </button>
          )}
        </div>
      )}
      {isOpen && (
        <EditModal onClose={() => setIsOpen(false)} postId={post._id} />
      )}
      {showLikes && (
        <ReactionsModal
          reactions={post.reactions}
          isOpen={showLikes}
          onClose={() => setShowLikes(false)}
          type="Post"
        />
      )}
    </article>
  );
};