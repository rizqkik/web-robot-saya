import { Video, VideoOff, Signal } from 'lucide-react';

interface VideoFeedProps {
  isActive?: boolean;
  streamUrl?: string; // URL for video stream from backend
}

const VideoFeed = ({ isActive = false, streamUrl }: VideoFeedProps) => {
  return (
    <div className="relative aspect-video bg-card rounded-lg border border-border overflow-hidden">
      {/* Video element if active and stream available */}
      {isActive && streamUrl ? (
        <video
          src={streamUrl}
          autoPlay
          muted
          className="w-full h-full object-cover"
          onError={() => console.error('Video stream failed to load')}
        />
      ) : (
        <>
          {/* Scan lines effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent opacity-50 pointer-events-none" />
          
          {/* Corner brackets */}
          <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-primary/50" />
          <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-primary/50" />
          <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-primary/50" />
          <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-primary/50" />

          {/* Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            {isActive ? (
              <>
                <Video className="w-12 h-12 text-primary" />
                <span className="text-muted-foreground text-sm">Live Feed Active</span>
              </>
            ) : (
              <>
                <VideoOff className="w-12 h-12 text-muted-foreground" />
                <span className="text-muted-foreground text-sm font-medium">Camera POV (No Signal)</span>
              </>
            )}
          </div>
        </>
      )}

      {/* Status indicator */}
      <div className="absolute top-3 right-3 flex items-center gap-2 px-2 py-1 rounded bg-card/80 backdrop-blur-sm border border-border">
        <Signal className={`w-4 h-4 ${isActive ? 'text-success' : 'text-destructive'}`} />
        <span className="text-xs font-mono">{isActive ? 'CONNECTED' : 'NO SIGNAL'}</span>
      </div>

      {/* Recording indicator */}
      <div className="absolute top-3 left-3 flex items-center gap-2 px-2 py-1 rounded bg-card/80 backdrop-blur-sm border border-border">
        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-destructive animate-pulse' : 'bg-muted-foreground'}`} />
        <span className="text-xs font-mono">REC</span>
      </div>
    </div>
  );
};

export default VideoFeed;
