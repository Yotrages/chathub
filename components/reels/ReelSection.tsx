// 'use client';

// import React, { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { useRouter } from 'next/navigation';
// import { fetchReels, addViewToReel } from '@/libs/redux/storySlice';
// import { PlusCircleIcon } from '@heroicons/react/24/outline';
// import { AppDispatch, RootState } from '@/libs/redux/store';
// import CreateReelModal from './createReelModal';
// import ReelCard from './ReelCard';

// const ReelsSection: React.FC = () => {
//   const dispatch: AppDispatch = useDispatch();
//   const router = useRouter();
//   const { reels } = useSelector((state: RootState) => state.reels);
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   useEffect(() => {
//     // Fetch reels when component mounts
//     dispatch(fetchReels({ page: 1, limit: 50 }));
//   }, [dispatch]);


//   const handleReelClick = (reelId: string) => {
//     // Call API to add view when reel is clicked
//     // dispatch(addViewToReel(reelId));
//     // Navigate to full reel view
//     router.push(`/reels/${reelId}`);
//   };

//   const handleCreateReel = () => {
//     setIsModalOpen(true);
//   };

//   return (
//     <div className="bg-white rounded-lg shadow-sm p-4">
//       <div className="flex items-center justify-between mb-4">
//         <h2 className="text-lg font-semibold text-gray-900">Reels</h2>
//       </div>
      
//       {/* Horizontal scrollable reels */}
//       <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
//         {/* Create Reel Button - Always first */}
//         <div className="flex-shrink-0">
//           <button
//             onClick={handleCreateReel}
//             className="w-32 h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex flex-col items-center justify-center text-white hover:opacity-90 transition-opacity"
//           >
//             <PlusCircleIcon className="h-8 w-8 mb-2" />
//             <span className="text-sm font-medium">Create Reel</span>
//           </button>
//         </div>
        
//         {/* Reels */}
//         {reels.map((reel) => (
//           <div key={reel._id} className="flex-shrink-0">
//             <div
//               onClick={() => handleReelClick(reel._id)}
//               className="cursor-pointer transform hover:scale-105 transition-transform"
//             >
//               <ReelCard reel={reel} isCompact={true} />
//             </div>
//           </div>
//         ))}
//       </div>
      
//       {/* Create Reel Modal */}
//       <CreateReelModal 
//         isOpen={isModalOpen} 
//         onClose={() => setIsModalOpen(false)} 
//       />
//     </div>
//   );
// };

// export default ReelsSection;