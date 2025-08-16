// import {Preview } from '@/components/post/Preview'

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
  <div className="bg-gray-50 rounded-2xl px-4 py-3 hover:bg-gray-100 transition-colors">
    <div className="font-semibold text-sm text-gray-900">{username}</div>
    <div className="text-sm text-gray-800 mt-1 break-words">{content}</div>
    {file && (
      <FilePreview url={file}/>
    )}{" "}
  </div>
);
