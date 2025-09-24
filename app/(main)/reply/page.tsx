"use client";
import { ReplyItem } from '@/components/post/ReplyItem';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/libs/redux/store';
import React, { useState } from 'react';
import { IComment } from '@/types';
import { ReactionsModal } from '@/components/post/LikesModal';
import { CommentItem } from '@/components/comment/CommentItem';



const ReplyPage = () => {
  const searchParams = useSearchParams();
  const commentId = searchParams.get('commentId');
  const type = searchParams.get('type');
  const dynamicId = searchParams.get('dynamicId');
  const replyId = searchParams.get('replyId');
  const [likesModal, setLikesModal] = useState<{
      isOpen: boolean;
      reactions: IComment["reactions"];
      type: string;
    }>({ isOpen: false, reactions: [], type: "reply" });
  const router = useRouter();
  
  const postComments = useSelector((state: RootState) => state.post.comments);
  const reelComments= useSelector((state: RootState) => state.reels.comments)

  // const { data: commentsData, isLoading, error } = useGetSingleComment(dynamicId!, commentId!);
  // const {data: reelsCommentData, isLoading: reelsLoading, error: reelsError} = useGetSingleReelComment(dynamicId!, commentId!)

  // Early return if required parameters are missing
  if (!commentId || !dynamicId || !replyId || !type) {
    <div className='min-h-screen items-center justify-center'>Error: Missing required parameters</div>;
    return;
  };


  // Fetch comments if they don't exist in Redux
  const reduxPostComment = postComments[dynamicId].find((item) => item._id === commentId)
  const comment = reduxPostComment 
  const reduxReelComment = reelComments[dynamicId].find((item) => item._id === commentId)
  const reelComment = reduxReelComment 

  let originalComment: IComment | undefined;
  // let originalIsLoading;
  // let originalError;

  if (type === "post") {
   originalComment = comment
  //  originalIsLoading = isLoading
  //  originalError = error
  } else {
    originalComment = reelComment
    // originalIsLoading = reelsLoading
    // originalError = reelsError
  }
  // Show loading state
  // if (originalIsLoading) {
  //   return <div>Loading replies...</div>;
  // }
  
  // Show error state
  // if (originalError) {
  //   toast.error(originalError.message)
  //   return (
  //     <div className='flex flex-col items-center justify-center w-full min-h-screen'>
  //       <div className='text-3xl bg-gradient-to-r from-red-400 to-pink-300 bg-clip-text text-transparent'>No reply found for this comment</div>
  //       <button 
  //         onClick={() => router.back()}
  //         className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
  //       >
  //         Go Back
  //       </button>
  //     </div>
  //   )
  // }
  
  // Get comments from Redux or API response
  
  if (!originalComment || originalComment.replies?.length === 0) {
    return (
      <div>
        <div>Error: No comments found for this post</div>
        <button 
          onClick={() => router.back()}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  const handleReaction = (reactions: IComment["reactions"], type: string = 'reply') => {
      setLikesModal({ isOpen: true, reactions: reactions, type: type})
  }

  const handleCloseLikes = (): void => {
    setLikesModal({ isOpen: false, reactions: [], type: "reply" });
  };
 

  const replies = originalComment.replies
  

  return (
    <div className="p-4 min-h-screen">
      <CommentItem comment={originalComment} onShowReactions={handleReaction} type='post' dynamicId={originalComment.dynamicId}/>

      {replies?.map((reply, index) => (
        <div key={index} className="ml-8 mt-4">
        <ReplyItem
        key={index}
        type={type as any}
          commentId={commentId}
          dynamicId={dynamicId}
          reply={reply}
          depth={0}
          onShowReactions={handleReaction}
        />
      </div>
      ))}
      <ReactionsModal 
        reactions={likesModal.reactions}
        isOpen={likesModal.isOpen}
        onClose={handleCloseLikes}
        type={likesModal.type}
      />
    </div>
  );
};

export default ReplyPage;