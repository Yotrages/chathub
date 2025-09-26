import React, { useState, useEffect, useCallback, useMemo } from "react";
import { CommentItem } from "./CommentItem";
import { ReactionsModal } from "../post/LikesModal";
import { CommentListProps, IComment } from "@/types";
import { MessageCircle, Loader2 } from "lucide-react";
import { useGetComments } from "@/hooks/usePosts";
import { useSelector } from "react-redux";
import { selectPagination } from "@/libs/redux/postSlice";
import { selectReelPagination } from "@/libs/redux/reelsSlice";
import { useGetReelComments } from "@/hooks/useReels";

export const CommentList: React.FC<CommentListProps> = ({
  type,
  comments,
  dynamicId,
}) => {
  const [likesModal, setLikesModal] = useState<{
    isOpen: boolean;
    reactions: IComment["reactions"];
    type: string;
  }>({ isOpen: false, reactions: [], type: "comment" });

  const commentPagination = useSelector(selectPagination("comment", dynamicId));
  const reelCommentPagination = useSelector(
    selectReelPagination("comment", dynamicId)
  );

  const postCommentsHook = useGetComments(type === "post" ? dynamicId : "");
  const reelCommentsHook = useGetReelComments(type === "reel" ? dynamicId : "");

  const { isLoading, loadMoreComments } = type === "post" ? postCommentsHook : { isLoading: false, loadMoreComments: () => {} };
  const { isLoading: commentLoading, loadMoreComments: loadMore } = type === "reel" ? reelCommentsHook : { isLoading: false, loadMoreComments: () => {} };

  useEffect(() => {
    console.log(
      `CommentList rendered for dynamicId ${dynamicId}, comments:`,
      comments
    );
  }, [comments, dynamicId]);

  const handleShowLikes = useCallback((
    reactions: IComment["reactions"],
    type: string
  ): void => {
    console.log(`Showing reactions for ${type}:`, reactions);
    setLikesModal({ isOpen: true, reactions, type });
  }, []);

  const handleCloseLikes = useCallback((): void => {
    console.log("Closing reactions modal");
    setLikesModal({ isOpen: false, reactions: [], type: "comment" });
  }, []);

  const renderedComments = useMemo(() => {
    if (!comments || comments.length === 0) {
      return (
        <div className="text-center py-12">
          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No comments yet</p>
          <p className="text-gray-400 text-sm">
            Be the first to share your thoughts!
          </p>
        </div>
      );
    }

    return comments.map((comment) => (
      <CommentItem
        type={type}
        dynamicId={dynamicId}
        key={comment._id}
        comment={comment}
        onShowReactions={handleShowLikes}
      />
    ));
  }, [comments, type, dynamicId, handleShowLikes]);

  const loadMoreButton = useMemo(() => {
    if (type === "post") {
      return commentPagination?.hasNextPage ? (
        <div className="text-center mt-4">
          <button
            onClick={loadMoreComments}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load more comments"
            )}
          </button>
        </div>
      ) : null;
    } else {
      return reelCommentPagination?.hasNextPage ? (
        <div className="text-center mt-4">
          <button
            onClick={loadMore}
            disabled={commentLoading}
            className="flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            {commentLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load more comments"
            )}
          </button>
        </div>
      ) : null;
    }
  }, [
    type,
    commentPagination?.hasNextPage,
    reelCommentPagination?.hasNextPage,
    loadMoreComments,
    loadMore,
    isLoading,
    commentLoading
  ]);

  return (
    <div className="bg-white xs:p-4 py-4 px-1">
      <div className="space-y-4">
        {renderedComments}
        {loadMoreButton}
      </div>
      <ReactionsModal
        reactions={likesModal.reactions}
        isOpen={likesModal.isOpen}
        onClose={handleCloseLikes}
        type={likesModal.type}
      />
    </div>
  );
};