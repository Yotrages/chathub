import { api } from "@/libs/axios/config";
import { AppDispatch, RootState } from "@/libs/redux/store";
import { deleteStory } from "@/libs/redux/storySlice";
import { X, Link as LinkIcon, Trash2, Flag } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";

interface StoryHeaderProps {
  authorId: {
    _id: string;
    username: string;
    name?: string;
    avatar?: string;
  };
  showDropdown: boolean;
  setShowDropdown: (showDropdown: boolean) => void;
  storyId: string;
}

export const StoriesContextMenu = ({
  authorId,
  storyId,
  showDropdown,
  setShowDropdown,
}: StoryHeaderProps) => {
  const dispatch: AppDispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [showReportModal, setShowReportModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [reportForm, setReportForm] = useState({
    reportType: "spam" as
      | "spam"
      | "harassment"
      | "inappropriate_content"
      | "fake_account"
      | "copyright"
      | "other",
    description: "",
    reportedUserId: "",
    reportedPostId: "",
    reportedCommentId: "",
  });
  const [error, setError] = useState<string | null>(null);
  
  const isOwner = user?._id === authorId._id;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown, setShowDropdown]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
    setShowDropdown(false);
  };

  const handleDeleteStory = () => {
    if (window.confirm("Are you sure you want to delete this story?")) {
      dispatch(deleteStory(storyId));
      toast.success("Story deleted successfully");
      setShowDropdown(false);
    }
  };

  const submitReport = async () => {
    if (!reportForm.description || reportForm.description.length < 10) {
      setError('Description must be at least 10 characters');
      return;
    }
    setError(null);
    try {
      const response = await api.post('/settings/report', {
        ...reportForm,
        reportedUserId: reportForm.reportedUserId || undefined,
        reportedPostId: reportForm.reportedPostId || undefined,
        reportedCommentId: reportForm.reportedCommentId || undefined,
      });
      if (response.status === 201) {
        toast.success("Report submitted successfully");
        setShowReportModal(false);
        setShowDropdown(false);
        setReportForm({ 
          reportType: 'spam', 
          description: '', 
          reportedUserId: '', 
          reportedPostId: '', 
          reportedCommentId: '' 
        });
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      setError('Failed to submit report. Please try again.');
    }
  };

  return (
    <>
      {showDropdown && (
        <div 
          ref={dropdownRef}
          className="absolute top-full right-0 mt-2 w-48 rounded-lg shadow-xl bg-white border border-gray-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="py-1">
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <LinkIcon size={16} className="text-gray-500" />
              <span>Copy link</span>
            </button>
            
            {isOwner && (
              <button
                onClick={handleDeleteStory}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={16} className="text-red-500" />
                <span>Delete story</span>
              </button>
            )}
            
            {!isOwner && (
              <button
                onClick={() => {
                  setShowReportModal(true);
                  setShowDropdown(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Flag size={16} className="text-gray-500" />
                <span>Report story</span>
              </button>
            )}
          </div>
        </div>
      )}

      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                Report Story
              </h3>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setError(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What&apos;s wrong with this story?
                </label>
                <select
                  value={reportForm.reportType}
                  onChange={(e) =>
                    setReportForm({
                      ...reportForm,
                      reportType: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="spam">Spam</option>
                  <option value="harassment">Harassment</option>
                  <option value="inappropriate_content">Inappropriate Content</option>
                  <option value="fake_account">Fake Account</option>
                  <option value="copyright">Copyright Violation</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Details (Optional)
                </label>
                <input
                  type="text"
                  placeholder="User ID"
                  value={reportForm.reportedUserId}
                  onChange={(e) =>
                    setReportForm({
                      ...reportForm,
                      reportedUserId: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
                />
                <input
                  type="text"
                  placeholder="Post ID"
                  value={reportForm.reportedPostId}
                  onChange={(e) =>
                    setReportForm({
                      ...reportForm,
                      reportedPostId: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
                />
                <input
                  type="text"
                  placeholder="Comment ID"
                  value={reportForm.reportedCommentId}
                  onChange={(e) =>
                    setReportForm({
                      ...reportForm,
                      reportedCommentId: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reportForm.description}
                  onChange={(e) =>
                    setReportForm({
                      ...reportForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Please provide details about why you're reporting this story..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                  maxLength={1000}
                ></textarea>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">
                    Minimum 10 characters required
                  </p>
                  <p className="text-xs text-gray-500">
                    {reportForm.description.length}/1000
                  </p>
                </div>
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
              
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setError(null);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={submitReport}
                  className="w-full sm:w-auto px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Submit Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};