import { ReplyItem } from "../post/ReplyItem";
import { MessageCircle, ChevronUp, ChevronDown } from "lucide-react";
import { IComment } from "@/types";

interface RepliesSectionProps {
  type: "post" | "reel";
  replies: IComment[];
  dynamicId: string;
  commentId: string;
  showReplies: boolean;
  isSmallScreen: boolean;
  onViewReplies: () => void;
  onShowReactions: (reactions: IComment["reactions"], type: string) => void;
}

export const RepliesSection: React.FC<RepliesSectionProps> = ({
  type,
  dynamicId,
  replies,
  commentId,
  showReplies,
  isSmallScreen,
  onViewReplies,
  onShowReactions,
}) => (
  <div className="mt-3 relative">
    {showReplies && !isSmallScreen && (
      <div className="absolute left-[-1.25rem] top-8 bottom-0 w-0.5 bg-gray-200"></div>
    )}
    <button
      onClick={onViewReplies}
      className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors ml-4 relative z-10"
    >
      <MessageCircle className="w-4 h-4" />
      {!isSmallScreen && (showReplies ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
      {!isSmallScreen && showReplies ? "Hide" : "View"} {replies.length} {replies.length === 1 ? "reply" : "replies"}
    </button>
    {!isSmallScreen && showReplies && (
      <div className="mt-2 relative">
        {replies.map((reply, index) => (
          <div key={index} className="relative">
            <div className="absolute left-[-1.25rem] top-6 w-6 h-0.5 bg-gray-200"></div>
            <ReplyItem
              type={type}
              commentId={commentId}
              dynamicId={dynamicId}
              reply={reply}
              onShowReactions={onShowReactions}
              isLast={index === replies.length - 1}
              depth={1}
            />
          </div>
        ))}
      </div>
    )}
  </div>
);