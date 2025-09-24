import { api } from "@/libs/axios/config";
import { AppDispatch, RootState } from "@/libs/redux/store";
import { deleteStory } from "@/libs/redux/storySlice";
import { X } from "lucide-react";
import { useState } from "react";
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
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowDropdown(false);
  };
  const isOwner = user?._id === authorId._id;

  const handleDeleteStory = () => {
    dispatch(deleteStory(storyId));
    setShowDropdown(false);
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
          toast.success("Report sent successfully")
          setShowReportModal(false);
          setReportForm({ reportType: 'spam', description: '', reportedUserId: '', reportedPostId: '', reportedCommentId: '' });
        }
      } catch (error) {
        console.error('Error submitting report:', error);
        setError('Failed to submit report. Please try again.');
      }
    };

  return (
    <>
      {showDropdown && (
        <div className="absolute top-full flex z-30 rounded-md flex-col transition-all duration-300 ease-in bg-gradient-to-tl from-white via-warning-50 to-gray-100 py-2 px-2 text-black">
          <button
            onClick={handleCopyLink}
            className="hover:bg-gray-300 px-4 rounded-md py-2"
          >
            Copy link
          </button>
          {isOwner && (
            <button
              onClick={handleDeleteStory}
              className="hover:bg-gray-300 rounded-md px-4 py-2"
            >
              Delete
            </button>
          )}
          <button
            onClick={() => setShowReportModal(true)}
            className="hover:bg-gray-300 py-2 px-4 rounded-md w-full"
          >
            Report
          </button>
        </div>
      )}

      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Submit a Report
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Report Type
                </label>
                <select
                  value={reportForm.reportType}
                  onChange={(e) =>
                    setReportForm({
                      ...reportForm,
                      reportType: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="spam">Spam</option>
                  <option value="harassment">Harassment</option>
                  <option value="inappropriate_content">
                    Inappropriate Content
                  </option>
                  <option value="fake_account">Fake Account</option>
                  <option value="copyright">Copyright Violation</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reported Item
                </label>
                <input
                  type="text"
                  placeholder="User ID (optional)"
                  value={reportForm.reportedUserId}
                  onChange={(e) =>
                    setReportForm({
                      ...reportForm,
                      reportedUserId: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="Post ID (optional)"
                  value={reportForm.reportedPostId}
                  onChange={(e) =>
                    setReportForm({
                      ...reportForm,
                      reportedPostId: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mt-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="Comment ID (optional)"
                  value={reportForm.reportedCommentId}
                  onChange={(e) =>
                    setReportForm({
                      ...reportForm,
                      reportedCommentId: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mt-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={reportForm.description}
                  onChange={(e) =>
                    setReportForm({
                      ...reportForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  maxLength={1000}
                ></textarea>
                <p className="text-xs text-gray-500 mt-1">
                  {reportForm.description.length}/1000 characters
                </p>
              </div>
              {error && (
                <div className="p-2 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={submitReport}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
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
