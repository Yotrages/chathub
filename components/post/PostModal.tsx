'use client';
import { useEffect, useRef } from "react";
import { Post } from "@/types";
import { X } from "lucide-react";
import { PostItem } from "./PostItem";

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
}

export const PostModal: React.FC<PostModalProps> = ({
  isOpen,
  onClose,
  post,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-50 p-4 h-full">
      <div
        ref={modalRef}
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl"
        role="dialog"
        aria-labelledby="post-modal-title"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <h2 id="post-modal-title" className="text-lg font-semibold text-gray-900">
            Post and Comments
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>
        
        {/* Modal Content - Scrollable */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Pass isModal=true to show comments by default */}
          <PostItem key={post._id} post={post} isModal={true} />
        </div>
      </div>
    </div>
  );
};