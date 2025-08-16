import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/redux/store";
import { IComment } from "@/types";
import { useRouter } from "next/navigation";
import { UserAvatar } from "../constant/UserAvatar";
import { CommentHeader } from "./CommentHeader";
import { CommentActions } from "./CommentActions";
import { ReplyForm } from "./ReplyForm";
import { RepliesSection } from "./RepliesSection";
import { ContextMenu } from "./ContextMenu";
import { formatTimeAgo } from "@/utils/formatter";
import { useScreenSize } from "@/hooks/useScreenSize";

interface CommentItemProps {
  type: "post" | "reel";
  comment: IComment;
  onShowReactions: (reactions: IComment["reactions"], type: string) => void;
  dynamicId: string;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  type,
  comment,
  onShowReactions,
  dynamicId,
}) => {
  const [showReplies, setShowReplies] = useState<boolean>(false);
  const [showReplyForm, setShowReplyForm] = useState<boolean>(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [showReactions, setShowReactions] = useState(false);
  const isSmallScreen  = useScreenSize(); // Use hook to determine screen size
  const { user } = useSelector((state: RootState) => state.auth);
  const router = useRouter();

  const handleContextMenu = (e: React.MouseEvent): void => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleViewReplies = () => {
    if (isSmallScreen && comment.replies?.length) {
      router.push(
        `/reply?commentId=${comment._id}&dynamicId=${dynamicId}&type=${type}&replyId=${comment.replies[0]._id}`
      );
    } else {
      setShowReplies(!showReplies);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowContextMenu(false);
      setShowReactions(false);
    };
    document.addEventListener("scroll", handleScroll);
    return () => document.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="group relative">
      <div className="flex gap-3 relative">
        <UserAvatar
          username={comment.authorId.username}
          avatar={comment.authorId.avatar}
          className="w-10 h-10 flex-shrink-0 relative z-10"
          onClick={() => router.push(`/profile/${comment.authorId._id}`)}
        />
        <div className="flex-1 min-w-0">
          <CommentHeader
            username={comment.authorId.username}
            content={comment.content}
            file={comment.file}
          />
          <CommentActions
            type={type}
            comment={comment}
            dynamicId={dynamicId}
            showReactions={showReactions}
            setShowReactions={setShowReactions}
            setShowReplyForm={setShowReplyForm}
            onShowReactions={onShowReactions}
            handleContextMenu={handleContextMenu}
            createdAt={formatTimeAgo(comment.createdAt)}
          />
          {showReplyForm && (
            <div className="relative">
              <div className="absolute left-[-1.25rem] top-0 bottom-0 w-0.5 bg-gray-200"></div>
              <ReplyForm
                type={type}
                dynamicId={dynamicId}
                commentId={comment._id}
                username={user?.username || ""}
                avatar={user?.avatar || ""}
                onClose={() => setShowReplyForm(false)}
                parentCommentId={comment._id}
              />
            </div>
          )}
          {comment.replies && comment.replies.length > 0 && (
            <RepliesSection
              type={type}
              replies={comment.replies}
              dynamicId={dynamicId}
              commentId={comment._id}
              showReplies={showReplies}
              isSmallScreen={isSmallScreen}
              onViewReplies={handleViewReplies}
              onShowReactions={onShowReactions}
            />
          )}
        </div>
      </div>
      <ContextMenu
      type={type}
        dynamicId={dynamicId}
        commentId={comment._id}
        show={showContextMenu}
        position={contextMenuPosition}
        commentContent={comment.content}
        onClose={() => setShowContextMenu(false)}
        onReact={() => {
          setShowReactions(true);
          setShowContextMenu(false);
        }}
        onReply={() => {
          setShowReplyForm(true);
          setShowContextMenu(false);
        }}
      />
    </div>
  );
};