import { Phone, Video, PhoneMissed, PhoneOff, PhoneIncoming, PhoneOutgoing, Clock } from 'lucide-react';

export const CallMessage = ({ message, isOwnMessage }: { message: any; isOwnMessage: boolean }) => {
  const isVideo = message.content.includes("Video");
  const callStatus = message.callStatus;
  
  const getCallDetails = () => {
    switch (callStatus) {
      case "missed":
        return {
          icon: PhoneMissed,
          bgColor: isOwnMessage 
            ? "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700" 
            : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
          iconColor: "text-red-600 dark:text-red-400",
          textColor: "text-red-900 dark:text-red-200",
          label: "Missed Call",
        };
      case "ended":
        return {
          icon: isOwnMessage ? PhoneOutgoing : PhoneIncoming,
          bgColor: isOwnMessage
            ? "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700"
            : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
          iconColor: "text-green-600 dark:text-green-400",
          textColor: "text-green-900 dark:text-green-200",
          label: isOwnMessage ? "Outgoing Call" : "Incoming Call",
        };
      case "declined":
        return {
          icon: PhoneOff,
          bgColor: isOwnMessage
            ? "bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700"
            : "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
          iconColor: "text-orange-600 dark:text-orange-400",
          textColor: "text-orange-900 dark:text-orange-200",
          label: "Declined",
        };
      case "failed":
        return {
          icon: PhoneOff,
          bgColor: isOwnMessage
            ? "bg-gray-200 dark:bg-gray-700 border-gray-400 dark:border-gray-600"
            : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700",
          iconColor: "text-gray-600 dark:text-gray-400",
          textColor: "text-gray-900 dark:text-gray-200",
          label: "Failed",
        };
      default:
        return {
          icon: isVideo ? Video : Phone,
          bgColor: isOwnMessage
            ? "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700"
            : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
          iconColor: "text-blue-600 dark:text-blue-400",
          textColor: "text-blue-900 dark:text-blue-200",
          label: "Call",
        };
    }
  };

  const details = getCallDetails();
  const Icon = details.icon;
  const VideoIcon = Video;

  const durationMatch = message.content.match(/\((\d+:\d+)\)/);
  const duration = durationMatch ? durationMatch[1] : null;

  return (
    <div 
      className={`${details.bgColor} border rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 max-w-xs shadow-sm`}
    >
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Icon Container */}
        <div className={`${details.iconColor} flex-shrink-0 relative`}>
          <div className="relative">
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2} />
            {isVideo && (
              <VideoIcon 
                className="w-3 h-3 absolute -bottom-0.5 -right-0.5 bg-white dark:bg-gray-900 rounded-full p-0.5" 
                strokeWidth={2.5}
              />
            )}
          </div>
        </div>

        {/* Call Info */}
        <div className="flex-1 min-w-0">
          <div className={`font-semibold text-xs sm:text-sm ${details.textColor}`}>
            {isVideo ? "Video Call" : "Voice Call"}
          </div>
          <div className={`text-xs ${details.textColor} opacity-80 mt-0.5`}>
            {details.label}
          </div>
          {duration && (
            <div className="flex items-center gap-1 mt-1">
              <Clock className={`w-3 h-3 ${details.iconColor}`} />
              <span className={`text-xs ${details.textColor} opacity-70 font-medium`}>
                {duration}
              </span>
            </div>
          )}
        </div>

        {/* Status Indicator */}
        {callStatus === "missed" && (
          <div className="flex-shrink-0">
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-red-500 animate-pulse"></div>
          </div>
        )}
        {callStatus === "ended" && (
          <div className="flex-shrink-0">
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-green-500"></div>
          </div>
        )}
      </div>
    </div>
  );
};


