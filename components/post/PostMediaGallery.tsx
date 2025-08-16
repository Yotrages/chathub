import { FileText, Play, Pause, Volume2, VolumeX, Download, Music } from "lucide-react";

interface MediaFile {
  url: string;
  type: "image" | "video" | "document" | "audio";
  name?: string;
}

interface PostMediaGalleryProps {
  images: string[];
  currentMediaIndex: number;
  setCurrentMediaIndex: (index: number) => void;
  isVideoPlaying: boolean;
  setIsVideoPlaying: (playing: boolean) => void;
  isVideoMuted: boolean;
  setIsVideoMuted: (muted: boolean) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

const PostMediaGallery: React.FC<PostMediaGalleryProps> = ({
  images,
  currentMediaIndex,
  setCurrentMediaIndex,
  isVideoPlaying,
  setIsVideoPlaying,
  isVideoMuted,
  setIsVideoMuted,
  videoRef,
}) => {
  const mediaFiles: MediaFile[] = images.map((url) => {
    const extension = url.split(".").pop()?.toLowerCase();
    let type: "image" | "video" | "document" | "audio" = "image";
    if (["mp4", "webm", "ogg", "mov", "avi"].includes(extension || "")) {
      type = "video";
    } else if (["pdf", "doc", "docx", "txt"].includes(extension || "")) {
      type = "document";
    } else if (["mp3"].includes(extension || "")) {
        type = "audio"
    }
    return { url, type, name: url.split("/").pop() };
  });

  const toggleVideoPlay = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const toggleVideoMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isVideoMuted;
      setIsVideoMuted(!isVideoMuted);
    }
  };

  if (!mediaFiles.length) return null;

  const currentMedia = mediaFiles[currentMediaIndex];

  return (
    <div className="relative mb-4 bg-black rounded-xl overflow-hidden">
      {mediaFiles.length > 1 && (
        <div className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 backdrop-blur-sm rounded-full px-3 py-1">
          <span className="text-white text-sm font-medium">
            {currentMediaIndex + 1} / {mediaFiles.length}
          </span>
        </div>
      )}
      <div className="aspect-video bg-gray-900 flex items-center justify-center">
        {currentMedia.type === "image" && (
          <img
            src={currentMedia.url}
            alt={`Post media ${currentMediaIndex + 1}`}
            className="w-full h-full object-contain"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}
        {currentMedia.type === "audio" && (
          <audio
          loop
            src={currentMedia.url}
            className="w-full h-full object-contain"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
            controls
          />
        )}
        {currentMedia.type === "video" && (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              src={currentMedia.url}
              className="w-full h-full object-contain"
              muted={isVideoMuted}
              loop
              playsInline
              controls
              onPlay={() => setIsVideoPlaying(true)}
              onPause={() => setIsVideoPlaying(false)}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={toggleVideoPlay}
                className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-4 transition-all duration-200 transform hover:scale-110"
              >
                {isVideoPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
            </div>
            <div className="absolute bottom-4 right-4 flex space-x-2">
              <button
                onClick={toggleVideoMute}
                className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-colors"
              >
                {isVideoMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            </div>
          </div>
        )}
        {currentMedia.type === "document" && (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-gray-800 to-gray-900">
            <FileText size={64} className="text-white mb-4" />
            <h3 className="text-white text-lg font-semibold mb-2">
              {currentMedia.name || "Document"}
            </h3>
            <a
              href={currentMedia.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Download size={16} />
              <span>Download</span>
            </a>
          </div>
        )}
      </div>
      {mediaFiles.length > 1 && (
        <div className="absolute bottom-4 left-4 flex space-x-2">
          {mediaFiles.map((media, index) => (
            <button
              key={index}
              onClick={() => setCurrentMediaIndex(index)}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentMediaIndex
                  ? "border-white shadow-lg"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              {media.type === "image" && (
                <img
                  src={media.url}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
              {media.type === "video" && (
                <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                  <Play size={16} className="text-white" />
                </div>
              )}
              {media.type === "audio" && (
                <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                  <Music size={16} className="text-white" />
                </div>
              )}
              {media.type === "document" && (
                <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                  <FileText size={16} className="text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PostMediaGallery;
