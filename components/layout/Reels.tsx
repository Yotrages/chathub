// import React, { useState, useEffect, useRef } from 'react';
// import { Play, Pause, Heart, MessageCircle, Share, MoreHorizontal, Eye, Volume2, VolumeX } from 'lucide-react';

// // Integration code for your HomePage component:
// // 1. Import this component: import ReelsSection from './ReelsSection';
// // 2. Add it to your homepage layout after the CreatePost section

// const ReelsSection = () => {
//   const [reels, setReels] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [currentPlayingIndex, setCurrentPlayingIndex] = useState(0);
//   const [showReactions, setShowReactions] = useState(null);
//   const [muted, setMuted] = useState(true);
//   const videoRefs = useRef<HTMLVideoElement>([]);

//   // Fetch reels from API
//   useEffect(() => {
//     const fetchReels = async () => {
//       try {
//         const response = await fetch('/api/reels');
//         const data = await response.json();
//         setReels(data);
//         setLoading(false);
//       } catch (error) {
//         console.error('Error fetching reels:', error);
//         setLoading(false);
//       }
//     };

//     fetchReels();
//   }, []);

//   // Long press handler for reactions
//   const useLongPress = (callback, duration = 800) => {
//     const timerRef = useRef<HTMLElement>(null);
    
//     const start = (e: any) => {
//       timerRef.current = setTimeout(() => callback(e), duration);
//     };
    
//     const clear = () => {
//       if (timerRef.current) {
//         clearTimeout(timerRef.current);
//         timerRef.current = null;
//       }
//     };
    
//     return {
//       onTouchStart: start,
//       onTouchEnd: clear,
//       onTouchCancel: clear,
//       onMouseDown: start,
//       onMouseUp: clear,
//       onMouseLeave: clear,
//     };
//   };

//   // Handle like functionality
//   const handleLike = async (reelId) => {
//     try {
//       const response = await fetch(`/api/reels/${reelId}/like`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       });
      
//       if (response.ok) {
//         const data = await response.json();
//         setReels(prev => prev.map(reel => 
//           reel._id === reelId 
//             ? { ...reel, likes: data.likes, isLiked: data.isLiked }
//             : reel
//         ));
//       }
//     } catch (error) {
//       console.error('Error liking reel:', error);
//     }
//   };

//   // Handle play/pause
//   const handlePlayPause = (index) => {
//     const video = videoRefs.current[index];
//     if (video) {
//       if (video.paused) {
//         video.play();
//         setCurrentPlayingIndex(index);
//       } else {
//         video.pause();
//         setCurrentPlayingIndex(null);
//       }
//     }
//   };

//   // Show reactions popup
//   const showReactionsPopup = (reelId) => {
//     setShowReactions(reelId);
//     setTimeout(() => setShowReactions(null), 3000);
//   };

//   const reactions = ['❤️', '😂', '😮', '😢', '😡', '👍'];

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="w-full max-w-6xl mx-auto p-4">
//       <div className="flex items-center justify-between mb-6">
//         <h2 className="text-2xl font-bold text-gray-800">Reels</h2>
//         <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300">
//           Create Reel
//         </button>
//       </div>

//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//         {reels.map((reel, index) => (
//           <div key={reel._id} className="relative bg-black rounded-2xl overflow-hidden shadow-xl group">
//             {/* Video/Image Container */}
//             <div className="relative aspect-[9/16] bg-gray-900">
//               {reel.fileType === 'Video' ? (
//                 <video
//                   ref={el => videoRefs.current[index] = el}
//                   src={reel.fileUrl}
//                   className="w-full h-full object-cover"
//                   loop
//                   muted={muted}
//                   playsInline
//                   {...useLongPress(() => showReactionsPopup(reel._id))}
//                 />
//               ) : (
//                 <img
//                   src={reel.fileUrl}
//                   alt="Reel"
//                   className="w-full h-full object-cover"
//                   {...useLongPress(() => showReactionsPopup(reel._id))}
//                 />
//               )}

//               {/* Play/Pause Overlay */}
//               {reel.fileType === 'Video' && (
//                 <div 
//                   className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 cursor-pointer"
//                   onClick={() => handlePlayPause(index)}
//                 >
//                   {currentPlayingIndex === index ? (
//                     <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
//                       <Pause size={48} className="text-white drop-shadow-lg" />
//                     </div>
//                   ) : (
//                     <Play size={48} className="text-white drop-shadow-lg opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
//                   )}
//                 </div>
//               )}

//               {/* Reactions Popup */}
//               {showReactions === reel._id && (
//                 <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
//                   <div className="bg-white rounded-full p-2 shadow-2xl animate-pulse">
//                     <div className="flex space-x-2">
//                       {reactions.map((reaction, i) => (
//                         <button
//                           key={i}
//                           className="text-2xl hover:scale-125 transition-transform duration-200"
//                           onClick={() => console.log(`Reacted with ${reaction}`)}
//                         >
//                           {reaction}
//                         </button>
//                       ))}
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* Gradient Overlay */}
//               <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>

//               {/* Controls */}
//               <div className="absolute bottom-4 left-4 right-4 z-10">
//                 {/* Author Info */}
//                 <div className="flex items-center space-x-2 mb-3">
//                   <img
//                     src={reel.authorId?.avatar || '/default-avatar.png'}
//                     alt="Author"
//                     className="w-8 h-8 rounded-full border-2 border-white"
//                   />
//                   <span className="text-white font-medium text-sm">
//                     {reel.authorId?.username || 'Unknown User'}
//                   </span>
//                 </div>

//                 {/* Description */}
//                 {reel.text && (
//                   <p className="text-white text-sm mb-3 line-clamp-2">
//                     {reel.text}
//                   </p>
//                 )}

//                 {/* Action Buttons */}
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center space-x-4">
//                     <button
//                       onClick={() => handleLike(reel._id)}
//                       className="flex items-center space-x-1 text-white hover:text-red-400 transition-colors"
//                     >
//                       <Heart 
//                         size={20} 
//                         className={reel.isLiked ? 'fill-red-500 text-red-500' : ''} 
//                       />
//                       <span className="text-xs">{reel.likes?.length || 0}</span>
//                     </button>
                    
//                     <button className="flex items-center space-x-1 text-white hover:text-blue-400 transition-colors">
//                       <MessageCircle size={20} />
//                       <span className="text-xs">0</span>
//                     </button>
                    
//                     <button className="text-white hover:text-green-400 transition-colors">
//                       <Share size={20} />
//                     </button>
//                   </div>

//                   <div className="flex items-center space-x-2">
//                     {reel.fileType === 'Video' && (
//                       <button
//                         onClick={() => setMuted(!muted)}
//                         className="text-white hover:text-yellow-400 transition-colors"
//                       >
//                         {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
//                       </button>
//                     )}
                    
//                     <button className="text-white hover:text-gray-300 transition-colors">
//                       <MoreHorizontal size={20} />
//                     </button>
//                   </div>
//                 </div>
//               </div>

//               {/* Views Counter */}
//               <div className="absolute top-4 right-4 bg-black bg-opacity-50 rounded-full px-2 py-1 flex items-center space-x-1">
//                 <Eye size={12} className="text-white" />
//                 <span className="text-white text-xs">{reel.viewers?.length || 0}</span>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Load More Button */}
//       {reels.length > 0 && (
//         <div className="text-center mt-8">
//           <button className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors duration-300">
//             Load More Reels
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ReelsSection;