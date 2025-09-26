import { useRef, useEffect } from "react";
import { Smile, Reply, Copy, Trash, Edit } from "lucide-react";
import toast from "react-hot-toast";
import { useDeleteComment } from "@/hooks/usePosts";
import { useDeleteReelComment } from "@/hooks/useReels";

interface ContextMenuProps {
  show: boolean;
  position: { x: number; y: number };
  commentContent: string;
  onClose: () => void;
  onReact: () => void;
  onReply: () => void;
  dynamicId: string;
  commentId: string;
  setIsEditing: (isEditing: boolean) => void;
  type: "post" | "reel";
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  show,
  position,
  commentContent,
  onClose,
  onReact,
  onReply,
  dynamicId,
  commentId,
  type,
  setIsEditing,
}) => {
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const { mutate: deleteComment } = useDeleteComment(dynamicId, commentId);
  const { mutate: deleteReelComment } = useDeleteReelComment(dynamicId, commentId);

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this comment?")) {
      if (type === "post") {
        deleteComment();
      } else {
        deleteReelComment();
      }
      toast.success("Comment deleted successfully");
      onClose();
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    onClose();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleScroll = () => {
      onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("scroll", handleScroll);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("scroll", handleScroll);
    };
  }, [onClose]);

  if (!show) return null;

  const adjustedPosition = {
    left: Math.min(position.x, window.innerWidth - (window.innerWidth > 768 ? 110 : 130)),
    top: Math.max(position.y - 180, 10),
  };

  return (
    <div
      ref={contextMenuRef}
      className="fixed z-50 bg-white rounded-lg shadow-lg border py-1 min-w-[160px] sm:min-w-[180px]"
      style={{
        left: adjustedPosition.left,
        top: adjustedPosition.top,
        transform: "translateX(-50%)",
      }}
    >
      <button
        onClick={onReact}
        className="w-full px-3 sm:px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-sm transition-colors"
      >
        <Smile size={14} className="sm:w-4 sm:h-4" />
        <span>React</span>
      </button>
      <button
        onClick={handleEdit}
        className="w-full px-3 sm:px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-sm transition-colors"
      >
        <Edit size={14} className="sm:w-4 sm:h-4" />
        <span>Edit</span>
      </button>
      <button
        onClick={onReply}
        className="w-full px-3 sm:px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-sm transition-colors"
      >
        <Reply size={14} className="sm:w-4 sm:h-4" />
        <span>Reply</span>
      </button>
      <button
        onClick={() => {
          navigator.clipboard.writeText(commentContent);
          onClose();
          toast.success("Comment copied successfully");
        }}
        className="w-full px-3 sm:px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-sm transition-colors"
      >
        <Copy size={14} className="sm:w-4 sm:h-4" />
        <span>Copy</span>
      </button>
      <button
        onClick={handleDelete}
        className="w-full px-3 sm:px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-sm text-red-500 transition-colors"
      >
        <Trash size={14} className="sm:w-4 sm:h-4" />
        <span>Delete</span>
      </button>
    </div>
  );
};
