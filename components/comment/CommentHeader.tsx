import { FilePreview } from "../post/Preview";

interface CommentHeaderProps {
  username: string;
  content: string;
  file?: string;
}

export const CommentHeader: React.FC<CommentHeaderProps> = ({
  username,
  content,
  file,
}) => (
  <div className="bg-gray-50 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 hover:bg-gray-100 transition-colors">
    <div className="font-semibold text-sm text-gray-900">{username}</div>
    <div className="text-sm text-gray-800 mt-1 break-words leading-relaxed">{content}</div>
    {file && (
      <div className="mt-2">
        <FilePreview url={file} />
      </div>
    )}
  </div>
);
