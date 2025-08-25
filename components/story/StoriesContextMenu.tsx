import { api } from "@/libs/axios/config";
import { errorMessageHandler } from "@/libs/feedback/error-handler";
import { successNotification } from "@/libs/feedback/notification";
import { AppDispatch, RootState } from "@/libs/redux/store";
import { deleteStory } from "@/libs/redux/storySlice";
import { useDispatch, useSelector } from "react-redux";

interface StoryHeaderProps {
  authorId: {
    _id: string;
    username: string;
    name?: string
    avatar?: string;
  };
  showDropdown: boolean;
  setShowDropdown: (showDropdown: boolean) => void
  storyId: string;
}


export const StoriesContextMenu = ({authorId, storyId, showDropdown, setShowDropdown} : StoryHeaderProps) => {
    const dispatch: AppDispatch = useDispatch()
    const { user } = useSelector((state: RootState) => state.auth)

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setShowDropdown(false)
    }
    const isOwner = user?._id === authorId._id

    const handleDeleteStory = () => {
        dispatch(deleteStory(storyId))
        setShowDropdown(false)
    }

    const handleReportStory = async () => {
        try {
            const response = await api.post(`settings/report`)
             successNotification(response.data.message)
        } catch (error : any) {
            console.log(error)
            errorMessageHandler(error)
        } finally {
            setShowDropdown(false)
        }
    }

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
                onClick={() => {
                    handleReportStory();
                }}
                className="hover:bg-gray-300 py-2 px-4 rounded-md w-full"
              >
                Report
              </button>
            </div>
          )}
        </>
    )
}