import { useState, useEffect } from 'react';

interface DebugPanel {
    localStream: MediaStream | null
    remoteStream: MediaStream | null
    peerConnection: RTCPeerConnection | null
    callState: string
}
const MobileDebugPanel = ({ localStream, remoteStream, peerConnection, callState }: DebugPanel) => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    const interval = setInterval(() => {
      const newStats = {
        callState,
        localStreamActive: localStream?.active || false,
        localTracks: localStream?.getTracks().map(t => ({
          kind: t.kind,
          enabled: t.enabled,
          muted: t.muted,
          readyState: t.readyState
        })) || [],
        remoteStreamActive: remoteStream?.active || false,
        remoteTracks: remoteStream?.getTracks().map(t => ({
          kind: t.kind,
          enabled: t.enabled,
          muted: t.muted,
          readyState: t.readyState
        })) || [],
        connectionState: peerConnection?.connectionState || 'none',
        iceConnectionState: peerConnection?.iceConnectionState || 'none',
        timestamp: new Date().toLocaleTimeString()
      };
      setStats(newStats);
    }, 1000);

    return () => clearInterval(interval);
  }, [localStream, remoteStream, peerConnection, callState]);

  const addLog = (message: any) => {
    setLogs(prev => [...prev.slice(-20), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testLocalAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      addLog(`Local Audio: ${audioTrack ? `enabled=${audioTrack.enabled}, muted=${audioTrack.muted}, state=${audioTrack.readyState}` : 'NOT FOUND'}`);
    } else {
      addLog('No local stream');
    }
  };

  const testRemoteAudio = () => {
    if (remoteStream) {
      const audioTrack = remoteStream.getAudioTracks()[0];
      addLog(`Remote Audio: ${audioTrack ? `enabled=${audioTrack.enabled}, muted=${audioTrack.muted}, state=${audioTrack.readyState}` : 'NOT FOUND'}`);
    } else {
      addLog('No remote stream');
    }
  };

  const forceEnableAudio = () => {
    if (remoteStream) {
      const audioTrack = remoteStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = true;
        addLog('✅ Remote audio force enabled');
      } else {
        addLog('❌ No remote audio track found');
      }
    }
  };

  const testAudioOutput = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYHGGS17+GZUhMNUKXh8LZkHQc5ktbx0IEsAwAA');
    audio.play()
      .then(() => addLog('✅ Audio output test playing'))
      .catch(err => addLog(`❌ Audio test failed: ${err.message}`));
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-[10000] bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium"
      >
        🐛 Debug
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[10000] bg-black bg-opacity-90 overflow-auto">
      <div className="p-4 text-white text-xs">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">🐛 Debug Panel</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="bg-red-500 px-3 py-1 rounded"
          >
            Close
          </button>
        </div>

        {/* Stats */}
        <div className="bg-gray-800 p-3 rounded mb-4">
          <h3 className="font-bold mb-2">📊 Real-time Stats</h3>
          <div className="space-y-1">
            <div>Call State: <span className="text-yellow-400">{stats.callState}</span></div>
            <div>Connection: <span className="text-yellow-400">{stats.connectionState}</span></div>
            <div>ICE: <span className="text-yellow-400">{stats.iceConnectionState}</span></div>
            <div>Updated: {stats.timestamp}</div>
          </div>
        </div>

        {/* Local Stream */}
        <div className="bg-gray-800 p-3 rounded mb-4">
          <h3 className="font-bold mb-2">📹 Local Stream (Your Media)</h3>
          <div>Active: {stats.localStreamActive ? '✅' : '❌'}</div>
          {stats.localTracks?.map((track: any, i: any) => (
            <div key={i} className="ml-4 mt-1">
              <div className="font-semibold">{track.kind} Track:</div>
              <div className="ml-2">
                Enabled: {track.enabled ? '✅' : '❌'} |
                Muted: {track.muted ? '🔇' : '🔊'} |
                State: {track.readyState}
              </div>
            </div>
          ))}
          {stats.localTracks?.length === 0 && <div className="text-red-400">No tracks</div>}
        </div>

        {/* Remote Stream */}
        <div className="bg-gray-800 p-3 rounded mb-4">
          <h3 className="font-bold mb-2">📡 Remote Stream (Other Person)</h3>
          <div>Active: {stats.remoteStreamActive ? '✅' : '❌'}</div>
          {stats.remoteTracks?.map((track: any, i: any) => (
            <div key={i} className="ml-4 mt-1">
              <div className="font-semibold">{track.kind} Track:</div>
              <div className="ml-2">
                Enabled: {track.enabled ? '✅' : '❌'} |
                Muted: {track.muted ? '🔇' : '🔊'} |
                State: {track.readyState}
              </div>
            </div>
          ))}
          {stats.remoteTracks?.length === 0 && <div className="text-red-400">No tracks</div>}
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-800 p-3 rounded mb-4">
          <h3 className="font-bold mb-2">🔧 Quick Fixes</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={testLocalAudio}
              className="bg-blue-600 px-3 py-2 rounded"
            >
              Test Local Audio
            </button>
            <button
              onClick={testRemoteAudio}
              className="bg-blue-600 px-3 py-2 rounded"
            >
              Test Remote Audio
            </button>
            <button
              onClick={forceEnableAudio}
              className="bg-green-600 px-3 py-2 rounded"
            >
              Force Enable Audio
            </button>
            <button
              onClick={testAudioOutput}
              className="bg-purple-600 px-3 py-2 rounded"
            >
              Test Speaker
            </button>
          </div>
        </div>

        {/* Logs */}
        <div className="bg-gray-800 p-3 rounded">
          <h3 className="font-bold mb-2">📝 Logs</h3>
          <div className="space-y-1 max-h-40 overflow-auto">
            {logs.length === 0 ? (
              <div className="text-gray-400">No logs yet. Click test buttons above.</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="text-xs">{log}</div>
              ))
            )}
          </div>
        </div>

        {/* Device Info */}
        <div className="bg-gray-800 p-3 rounded mt-4">
          <h3 className="font-bold mb-2">📱 Device Info</h3>
          <div className="text-xs break-all">
            <div>UA: {navigator.userAgent}</div>
            <div>Platform: {navigator.platform}</div>
            <div>Screen: {window.screen.width}x{window.screen.height}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileDebugPanel;