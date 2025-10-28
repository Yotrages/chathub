import { FilePreview } from "../post/Preview";

interface CommentHeaderProps {
  username: string;
  content: string;
  file?: string;
  onLongPress?: () => void;
  isMobile?: boolean;
}

export const CommentHeader: React.FC<CommentHeaderProps> = ({
  username,
  content,
  file,
  onLongPress,
  isMobile,
}) => {
  let longPressTimer: NodeJS.Timeout | null = null;
  let touchMoved = false;

  const handleTouchStart = () => {
    if (!isMobile || !onLongPress) return;
    touchMoved = false;
    longPressTimer = setTimeout(() => {
      if (!touchMoved) {
        onLongPress();
      }
    }, 500); 
  };

  const handleTouchMove = () => {
    touchMoved = true;
    if (longPressTimer) {
      clearTimeout(longPressTimer);
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
    }
  };

  return (
    <div 
      className={`bg-gray-50 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 hover:bg-gray-100 transition-colors ${
        isMobile ? 'active:bg-gray-200' : ''
      }`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="font-semibold text-sm text-gray-900">{username}</div>
      <div className="text-sm text-gray-800 mt-1 break-words leading-relaxed">{content}</div>
      {file && (
        <div className="mt-1">
          <FilePreview url={file} />
        </div>
      )}
    </div>
  );
};
