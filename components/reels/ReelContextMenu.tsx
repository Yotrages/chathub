import { useDeleteReel, useSaveReel } from "@/hooks/useReels";
import { RootState } from "@/libs/redux/store";
import { Reel } from "@/types";
import React, { useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";

interface ReelContextProps {
  reel: Reel;
  onHide: () => void;
}

const ReelContextMenu = ({ reel, onHide }: ReelContextProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const { user } = useSelector((state: RootState) => state.auth);
  const { mutate: saveReel } = useSaveReel(reel._id);
  const { mutate: deleteReel } = useDeleteReel(reel._id);
  
  const isOwner = user?._id === reel.authorId._id;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onHide();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onHide]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onHide();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onHide]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reel.title || 'Untitled Reel');
      onHide();
      toast.success("Reel title copied successfully");
    } catch (error) {
      console.log(error)
      toast.error("Failed to copy title");
    }
  };

  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}/reels/${reel._id}`;
      await navigator.clipboard.writeText(url);
      onHide();
      toast.success("Link copied successfully");
    } catch (error) {
      console.log(error)
      toast.error("Failed to copy link");
    }
  };

  const handleSave = () => {
    saveReel();
    onHide();
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this reel?')) {
      deleteReel();
      onHide();
    }
  };

  const handleDownload = async () => {
    if (!reel?.fileUrl) {
      toast.error("Video URL not available");
      onHide();
      return;
    }

    try {
      const response = await fetch(reel.fileUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch video');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const filename = `reel_${reel._id || 'video'}.mp4`;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("Video downloaded successfully!");
    } catch (error) {
      console.error("Error downloading video:", error);
      toast.error("Failed to download video");
    } finally {
      onHide();
    }
  };

  return (
    <div
      ref={menuRef}
      className="bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[160px] z-50"
      style={{
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)'
      }}
    >
      <button
        onClick={handleCopy}
        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
      >
        <span className="mr-3">📋</span>
        Copy title
      </button>
      
      <button
        onClick={handleCopyLink}
        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
      >
        <span className="mr-3">🔗</span>
        Copy link
      </button>
      
      <button
        onClick={handleDownload}
        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
      >
        <span className="mr-3">⬇️</span>
        Download
      </button>
      
      <button
        onClick={handleSave}
        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
      >
        <span className="mr-3">💾</span>
        Save
      </button>
      
      {isOwner && (
        <>
          <hr className="my-1 border-gray-100" />
          <button
            onClick={handleDelete}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center"
          >
            <span className="mr-3">🗑️</span>
            Delete
          </button>
        </>
      )}
    </div>
  );
};

export default ReelContextMenu;