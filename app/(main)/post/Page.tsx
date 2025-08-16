// import React, { useEffect, useState } from "react";
// import { useRouter } from "next/router";
// import { useSelector } from "react-redux";
// import { RootState } from "@/libs/redux/store";
// import { PostItem } from "@/components/post/PostItem";
// import { CommentList } from "@/components/comment/CommentList";
// import { Post } from "@/libs/redux/postSlice";

// export interface IComment {
//   _id: string;
//   authorId: {};
//   content: string;
//   createdAt: Date;
// }


// const PostPage: React.FC = () => {
//   const router = useRouter();
//   const { postId } = router.query;
//   const { isAuthenticated } = useSelector((state: RootState) => state.auth);
//   const [post] = useState<Post | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (!isAuthenticated) {
//       router.push("/login");
//       return;
//     }
//   }, [postId, isAuthenticated]);

  
//   if (!isAuthenticated) {
//     return null;
//   }

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
//       </div>
//     );
//   }

//   if (!post) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <h2 className="text-2xl font-semibold text-gray-900 mb-2">
//             Post not found
//           </h2>
//           <p className="text-gray-600 mb-4">
//             The post you're looking for doesn't exist.
//           </p>
//           <button
//             onClick={() => router.push("/")}
//             className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
//           >
//             Back to Feed
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <header className="bg-white shadow-sm border-b">
//         <div className="max-w-4xl mx-auto px-4 py-4">
//           <div className="flex items-center space-x-4">
//             <button
//               onClick={() => router.back()}
//               className="text-blue-500 hover:text-blue-600 font-medium"
//             >
//               ← Back
//             </button>
//             <h1 className="text-xl font-semibold text-gray-900">Post</h1>
//           </div>
//         </div>
//       </header>

//       {/* Main Content */}
//       <main className="max-w-4xl mx-auto px-4 py-6">
//         <div className="space-y-6">
//           {/* Post */}
//           <div className="bg-white rounded-lg shadow-sm">
//             <PostItem post={post} />
//           </div>

//           {/* Comments Section */}
//           <div className="bg-white rounded-lg shadow-sm p-6">
//             <h3 className="text-lg font-semibold text-gray-900 mb-4">
//               Comments
//             </h3>
//             <CommentList postId={post._id} />
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// };

// export default PostPage;
