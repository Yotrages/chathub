import { useState } from "react";

interface PostContentProps {
  content: string;
}

const PostContent: React.FC<PostContentProps> = ({ content }) => {
  const [showFullContent, setShowFullContent] = useState(false);
  const isContentLong = content.length > 200;
  const displayContent = isContentLong && !showFullContent
    ? content.substring(0, 200) + "..."
    : content;

  if (!content) return null;

  return (
    <div className="px-6 pb-4">
      <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">
        {displayContent}
      </p>
      {isContentLong && (
        <button
          onClick={() => setShowFullContent(!showFullContent)}
          className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 text-sm font-medium mt-2 transition-colors"
        >
          {showFullContent ? "Show less" : "Show more..."}
        </button>
      )}
    </div>
  );
};

export default PostContent;
