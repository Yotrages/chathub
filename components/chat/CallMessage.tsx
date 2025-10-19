import { Message } from '@/types';
import { Phone, Video, PhoneMissed, PhoneOff } from 'lucide-react';

interface CallMessageProps {
  message: Message;
  isOwnMessage: boolean;
}

const CallMessage = ({ message, isOwnMessage }: CallMessageProps) => {
  const isVideo = message.content?.toLowerCase().includes("video");
  const status = message.callStatus;
  
  // Extract duration from content if available
  const durationMatch = message.content?.match(/\((\d+:\d+)\)/) || 
                        message.content?.match(/(\d+:\d+)/);
  const duration = durationMatch ? durationMatch[1] : null;

  // Determine the actual message and styling based on status
  const getCallInfo = () => {
    // if (!status || status === 'ongoing') {
    //   // Should not happen for ended calls, but handle it
    //   return {
    //     icon: isVideo ? Video : Phone,
    //     text: isVideo ? "Video call" : "Voice call",
    //     subtext: "In progress...",
    //     bgColor: "bg-blue-100 dark:bg-blue-900/40",
    //     iconColor: "text-blue-600 dark:text-blue-400",
    //     textColor: "text-blue-900 dark:text-blue-100",
    //   };
    // }

    switch (status) {
      case 'missed':
        return {
          icon: PhoneMissed,
          text: isOwnMessage 
            ? `Missed ${isVideo ? 'video' : 'voice'} call`
            : `You missed a ${isVideo ? 'video' : 'voice'} call`,
          subtext: "Not answered",
          bgColor: "bg-red-100 dark:bg-red-900/40",
          iconColor: "text-red-600 dark:text-red-400",
          textColor: "text-red-900 dark:text-red-100",
          showDot: true,
          dotColor: "bg-red-500",
        };

      case 'ended':
        return {
          icon: isVideo ? Video : Phone,
          text: isVideo ? "Video call" : "Voice call",
          subtext: duration ? `Call duration: ${duration}` : "Call ended",
          bgColor: "bg-gray-100 dark:bg-gray-800",
          iconColor: "text-gray-600 dark:text-gray-400",
          textColor: "text-gray-900 dark:text-gray-100",
        };

      case 'declined':
        return {
          icon: PhoneOff,
          text: isOwnMessage
            ? `You declined a ${isVideo ? 'video' : 'voice'} call`
            : `${isVideo ? 'Video' : 'Voice'} call declined`,
          subtext: "Not answered",
          bgColor: "bg-orange-100 dark:bg-orange-900/40",
          iconColor: "text-orange-600 dark:text-orange-400",
          textColor: "text-orange-900 dark:text-orange-100",
        };

      case 'failed':
        return {
          icon: PhoneOff,
          text: `${isVideo ? 'Video' : 'Voice'} call failed`,
          subtext: "Connection error",
          bgColor: "bg-gray-100 dark:bg-gray-800",
          iconColor: "text-gray-500 dark:text-gray-400",
          textColor: "text-gray-700 dark:text-gray-300",
        };

      default:
        return {
          icon: isVideo ? Video : Phone,
          text: isVideo ? "Video call" : "Voice call",
          subtext: "",
          bgColor: "bg-gray-100 dark:bg-gray-800",
          iconColor: "text-gray-600 dark:text-gray-400",
          textColor: "text-gray-900 dark:text-gray-100",
        };
    }
  };

  const callInfo = getCallInfo();
  const Icon = callInfo.icon;

  return (
    <div 
      className={`${callInfo.bgColor} rounded-xl px-3 py-2.5 max-w-[280px] shadow-sm relative`}
    >
      <div className="flex items-start gap-2.5">
        {/* Icon */}
        <div className={`${callInfo.iconColor} flex-shrink-0 mt-0.5`}>
          <Icon className="w-5 h-5" strokeWidth={2} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium ${callInfo.textColor} leading-snug`}>
            {callInfo.text}
          </div>
          
          {callInfo.subtext && (
            <div className={`text-xs ${callInfo.textColor} opacity-70 mt-0.5`}>
              {callInfo.subtext}
            </div>
          )}
        </div>

        {/* Status indicator for missed calls */}
        {callInfo.showDot && (
          <div className="flex-shrink-0 mt-1.5">
            <div className={`w-2 h-2 rounded-full ${callInfo.dotColor} animate-pulse`}></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CallMessage;