import { Download, FileText, Play, Video} from "lucide-react";

export const FilePreview = ({url} : {url: string}) => {
    const extension = url.split(".").pop()?.toLowerCase();
    let type: "image" | "video" | "document" | "audio" = "image";
    if (["mp4", "webm", "ogg", "mov", "avi"].includes(extension || "")) {
      type = "video";
    } else if (["pdf", "doc", "docx", "txt"].includes(extension || "")) {
      type = "document";
    } else if (["mp3"].includes(extension || "")) {
        type = "audio"
    }
    const name = url.split("/").pop()
    return (
      <div className="px-12 relative group">
        <div className="relative w-36 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
          <div className="aspect-square">
            {type === "image" && url && (
              <img src={url} alt="New url" className="w-full h-full object-cover" />
            )}
            {type === "video" && (
              <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
                {url ? (
                  <video src={url} loop controls className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <Video size={32} className="text-gray-400" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                  <div className="bg-white bg-opacity-90 rounded-full p-2">
                    <Play size={16} className="text-gray-800 ml-0.5" />
                  </div>
                </div>
              </div>
            )}
            {type === "audio" && (
              <audio
          loop
            src={url}
            className="w-full h-full object-contain"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
            controls
          />
            )}
            {type === "document" && (
               <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-gray-800 to-gray-900">
                <h3 className="text-white text-lg font-semibold mb-2">
              {name || "Document"}
            </h3>
            <a
              href={url}
              target="_blank"
              download={url}
              rel="noopener noreferrer"
              className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
            <FileText size={64} className="text-white mb-4" />
              <Download size={16} />
            </a>
          </div>
            )}
          </div>
        </div>
      </div>
    );
  };