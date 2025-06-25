import { Heart, MessageSquare, Shield, Star, Users, Zap } from "lucide-react";

interface Discovery {
    onDiscoverUsers: () => void
}

export const WelcomeScreen = ({ onDiscoverUsers } : Discovery) => {
  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-blue-200/30 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-200/30 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-pink-200/20 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="text-center z-10 max-w-md">
        <div className="mb-8 relative">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl transform hover:rotate-3 transition-transform duration-300">
            <MessageSquare className="text-white" size={40} />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
            <Heart className="text-white" size={16} />
          </div>
        </div>
        
        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Welcome to Chat
        </h2>
        
        <p className="text-gray-600 mb-8 text-lg leading-relaxed">
          Connect with friends, create groups, and share moments that matter. 
          Your conversations, elevated.
        </p>

        <div className="space-y-4">
          <button
            onClick={onDiscoverUsers}
            className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-8 py-4 rounded-2xl font-semibold hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            <Users className="inline mr-3" size={20} />
            Discover People
          </button>
          
          <div className="flex space-x-3">
            <div className="flex-1 text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50">
              <Zap className="mx-auto mb-2 text-blue-500" size={24} />
              <p className="text-sm font-medium text-gray-700">Instant</p>
            </div>
            <div className="flex-1 text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50">
              <Shield className="mx-auto mb-2 text-green-500" size={24} />
              <p className="text-sm font-medium text-gray-700">Secure</p>
            </div>
            <div className="flex-1 text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50">
              <Star className="mx-auto mb-2 text-yellow-500" size={24} />
              <p className="text-sm font-medium text-gray-700">Beautiful</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};