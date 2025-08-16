import React, { useState, useEffect } from "react";
import { CommentItem } from "./CommentItem";
import { ReactionsModal } from "../post/LikesModal";
import { CommentListProps, IComment } from "@/types";
import { MessageCircle, Loader2 } from "lucide-react";
import { useGetComments } from "@/hooks/usePosts";
import { useSelector } from "react-redux";
import { selectPagination } from "@/libs/redux/postSlice";

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
  const commentPagination = useSelector(selectPagination('comment', dynamicId));
  const { isLoading, loadMoreComments } = useGetComments(dynamicId);

  useEffect(() => {
    console.log(`CommentList rendered for dynamicId ${dynamicId}, comments:`, comments); // Debug log
  }, [comments, dynamicId]);

  const handleShowLikes = (reactions: IComment["reactions"], type: string): void => {
    console.log(`Showing reactions for ${type}:`, reactions); // Debug log
    setLikesModal({ isOpen: true, reactions, type });
  };

  const handleCloseLikes = (): void => {
    console.log("Closing reactions modal"); // Debug log
    setLikesModal({ isOpen: false, reactions: [], type: "comment" });
  };

  return (
    <div className="bg-white p-4">
      <div className="space-y-4">
        {comments && comments.length > 0 ? (
          <>
            {comments.map((comment) => (
              <CommentItem
                type={type}
                dynamicId={dynamicId}
                key={comment._id}
                comment={comment}
                onShowReactions={handleShowLikes}
              />
            ))}
            {commentPagination?.hasNextPage && (
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
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No comments yet</p>
            <p className="text-gray-400 text-sm">
              Be the first to share your thoughts!
            </p>
          </div>
        )}
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
