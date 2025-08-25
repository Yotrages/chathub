"use client"
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Post, User } from "@/types";
import { PostItem } from "@/components/post/PostItem";

interface SearchResult {
  posts: Post[];
  reels: Array<{
    _id: string;
    fileUrl: string;
    authorId: { _id: string; username: string; name: string; avatar?: string };
    createdAt: string;
  }>;
  users: Array<User>;
  stories: Array<{
    _id: string;
    fileUrl: string;
    text?: string;
    authorId: { _id: string; username: string; name: string; avatar?: string };
    createdAt: string;
  }>;
}

const SearchPage: React.FC = () => {
  const params = useParams();
  const { query } = params;
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query && typeof query === "string") {
      setLoading(true);
      fetch(`/api/search?query=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setSearchResults(data.results);
          } else {
            setError(data.error || "Failed to fetch search results");
          }
          setLoading(false);
        })
        .catch(() => {
          setError("Failed to fetch search results");
          setLoading(false);
        });
    }
  }, [query]);

  return (
    <div className="container mx-auto px-4 py-6 min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Search Results for &apos;{query}&apos;
      </h1>

      {loading && <p className="text-center text-gray-600">Loading...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {!loading && !error && searchResults && (
        <div className="space-y-8">
          {/* Users Section */}
          {searchResults.users.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Users</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {searchResults.users.map((user) => (
                  <Link
                    key={user._id}
                    href={`/profile/${user._id}`}
                    className="flex items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition"
                  >
                    <Image
                      src={user.avatar || ""}
                      alt={user?.username || ""}
                      width={48}
                      height={48}
                      className="rounded-full mr-4"
                    />
                    <div>
                      <p className="font-semibold">{user.username}</p>
                      <p className="text-sm text-gray-600">{user.username}</p>
                      {user.bio && (
                        <p className="text-sm text-gray-500 truncate">
                          {user.bio}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        {user.postsCount || 0} posts •{" "}
                        {user.followersCount || 0} followers
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Posts Section */}
          {searchResults.posts.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Posts</h2>
              <div className="space-y-4">
                {searchResults.posts.map((post, index) => (
                  <PostItem key={index} post={post} />
                ))}
              </div>
            </div>
          )}

          {/* Reels Section */}
          {searchResults.reels.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Reels</h2>
              <div className="flex space-x-4 overflow-x-auto snap-x snap-mandatory pb-4">
                {searchResults.reels.map((reel) => (
                  <Link
                    key={reel._id}
                    href={`/reel/${reel._id}`}
                    className="flex-none w-32 p-2 bg-white rounded-lg shadow hover:shadow-md transition snap-center"
                  >
                    <Image
                      src={reel.fileUrl}
                      alt="Reel"
                      width={128}
                      height={192}
                      className="rounded object-cover"
                    />
                    <p className="text-sm font-semibold mt-2 truncate">
                      {reel.authorId.username}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(reel.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Stories Section */}
          {searchResults.stories.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Stories</h2>
              <div className="flex space-x-4 overflow-x-auto snap-x snap-mandatory pb-4">
                {searchResults.stories.map((story) => (
                  <Link
                    key={story._id}
                    href={`/story/${story._id}`}
                    className="flex-none w-32 p-2 bg-white rounded-lg shadow hover:shadow-md transition snap-center"
                  >
                    <Image
                      src={story.fileUrl}
                      alt="Story"
                      width={128}
                      height={192}
                      className="rounded object-cover"
                    />
                    {story.text && (
                      <p className="text-sm text-gray-700 truncate mt-2">
                        {story.text}
                      </p>
                    )}
                    <p className="text-sm font-semibold mt-2 truncate">
                      {story.authorId.username}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(story.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {searchResults.posts.length === 0 &&
            searchResults.reels.length === 0 &&
            searchResults.users.length === 0 &&
            searchResults.stories.length === 0 && (
              <p className="text-center text-gray-600">No results found</p>
            )}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
