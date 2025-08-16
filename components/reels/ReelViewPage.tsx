// 'use client';

// import React, { useEffect } from 'react';
// import { useRouter, useParams } from 'next/navigation';
// import { useDispatch, useSelector } from 'react-redux';
// import { fetchReels, likeReel, setReelViewers, addReactionToReel } from '@/libs/redux/reelsSlice';
// import { RootState, AppDispatch } from '@/libs/redux/store';
// import ReelCard from './ReelCard';
// import { ArrowRightIcon, XCircleIcon } from '@heroicons/react/24/outline';
// import Link from 'next/link';

// const ReelViewPage: React.FC = () => {
//   const router = useRouter();
//   const { reelId } = useParams();
//   const dispatch: AppDispatch = useDispatch();
//   const { reels, loading, error } = useSelector((state: RootState) => state.reels);

//   useEffect(() => {
//     // Fetch reels if not loaded
//     if (reels.length === 0) {
//       dispatch(fetchReels({ page: 1, limit: 100 }));
//     }
    
//     // Set viewers when reel is viewed (this is where we call the API)
//     if (reelId) {
//       dispatch(setReelViewers(reelId as string));
//     }
//   }, [dispatch, reelId, reels.length]);

//   const currentReel = reels.find((reel) => reel._id === reelId);
//   const currentIndex = reels.findIndex((reel) => reel._id === reelId);
//   const nextReelId = currentIndex + 1 < reels.length ? reels[currentIndex + 1]._id : null;
//   const previousReelId = currentIndex > 0 ? reels[currentIndex - 1]._id : null;

//   const handleLike = (reelId: string) => {
//     dispatch(likeReel(reelId));
//   };

//   const handleReaction = (reelId: string, reactionType: string) => {
//     dispatch(addReactionToReel({ reelId, reactionType }));
//   };

//   const handleNext = () => {
//     if (nextReelId) {
//       router.push(`/reels/${nextReelId}`);
//     }
//   };

//   const handlePrevious = () => {
//     if (previousReelId) {
//       router.push(`/reels/${previousReelId}`);
//     }
//   };

//   // Handle swipe gestures for mobile
//   useEffect(() => {
//     let startY = 0;
//     let startX = 0;

//     const handleTouchStart = (e: TouchEvent) => {
//       startY = e.touches[0].clientY;
//       startX = e.touches[0].clientX;
//     };

//     const handleTouchEnd = (e: TouchEvent) => {
//       const endY = e.changedTouches[0].clientY;
//       const endX = e.changedTouches[0].clientX;
//       const deltaY = startY - endY;
//       const deltaX = startX - endX;

//       // Vertical swipe (up/down)
//       if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50) {
//         if (deltaY > 0 && nextReelId) {
//           // Swipe up - next reel
//           handleNext();
//         } else if (deltaY < 0 && previousReelId) {
//           // Swipe down - previous reel
//           handlePrevious();
//         }
//       }
//     };

//     document.addEventListener('touchstart', handleTouchStart);
//     document.addEventListener('touchend', handleTouchEnd);

//     return () => {
//       document.removeEventListener('touchstart', handleTouchStart);
//       document.removeEventListener('touchend', handleTouchEnd);
//     };
//   }, [nextReelId, previousReelId]);

//   if (loading && reels.length === 0) {
//     return (
//       <div className="min-h-screen bg-black flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
//           <p className="mt-4 text-white">Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error || !currentReel) {
//     return (
//       <div className="min-h-screen bg-black flex items-center justify-center">
//         <div className="text-center">
//           <p className="text-white mb-4">{error || 'Reel not found'}</p>
//           <Link href="/" className="text-blue-400 hover:text-blue-300">
//             Go back to home
//           </Link>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-black flex flex-col items-center justify-center relative">
//       {/* Close button */}
//       <Link href="/" className="absolute top-4 right-4 z-10">
//         <XCircleIcon className="h-8 w-8 text-white hover:text-gray-300" />
//       </Link>

//       {/* Reel counter */}
//       <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-50 rounded-full px-3 py-1">
//         <span className="text-white text-sm">
//           {currentIndex + 1} / {reels.length}
//         </span>
//       </div>

//       {/* Main reel display */}
//       <div className="w-full max-w-md h-screen flex items-center justify-center">
//         <ReelCard 
//           reel={currentReel} 
//           onLike={handleLike} 
//         //   onReaction={handleReaction}
//           isCompact={false} 
//         />
//       </div>

//       {/* Navigation buttons */}
//       <div className="absolute bottom-8 right-8 flex flex-col space-y-2">
//         {previousReelId && (
//           <button
//             onClick={handlePrevious}
//             className="bg-white bg-opacity-20 text-white rounded-full p-3 hover:bg-opacity-30 transition-all"
//           >
//             <ArrowRightIcon className="h-6 w-6 transform rotate-180" />
//           </button>
//         )}
//         {nextReelId && (
//           <button
//             onClick={handleNext}
//             className="bg-white bg-opacity-20 text-white rounded-full p-3 hover:bg-opacity-30 transition-all"
//           >
//             <ArrowRightIcon className="h-6 w-6" />
//           </button>
//         )}
//       </div>

//       {/* Reel info overlay */}
//       <div className="absolute bottom-4 left-4 right-4 z-10">
//         <div className="bg-black bg-opacity-50 rounded-lg p-4">
//           <div className="flex items-center space-x-3 mb-2">
//             <img
//               src={currentReel.authorId.avatar || '/default-avatar.png'}
//               alt={currentReel.authorId.username || currentReel.authorId.name}
//               className="w-10 h-10 rounded-full"
//             />
//             <div>
//               <p className="text-white font-semibold">{currentReel.authorId.username}</p>
//               <p className="text-gray-300 text-sm">
//                 {new Date(currentReel.createdAt).toLocaleDateString()}
//               </p>
//             </div>
//           </div>
//           {currentReel.text && (
//             <p className="text-white text-sm">{currentReel.text}</p>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ReelViewPage;