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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  if (!show) return null;

  return (
    <div
      ref={contextMenuRef}
      className="fixed z-50 bg-white rounded-lg shadow-lg border py-2 min-w-48"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -100%)",
      }}
    >
      <button
        onClick={onReact}
        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
      >
        <Smile size={16} />
        <span>React</span>
      </button>
      <button
        onClick={() => setIsEditing(true)}
        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
      >
        <Edit size={16} />
        <span>Edit</span>
      </button>
      <button
        onClick={onReply}
        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
      >
        <Reply size={16} />
        <span>Reply</span>
      </button>
      <button
        onClick={() => {
          navigator.clipboard.writeText(commentContent);
          onClose();
          toast.success("Comment copied successfully");
        }}
        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
      >
        <Copy size={16} />
        <span>Copy</span>
      </button>
      <button
        onClick={handleDelete}
        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 text-red-500"
      >
        <Trash size={16} />
        <span>Delete</span>
      </button>
    </div>
  );
};