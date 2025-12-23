'use client';

interface VideoPlayerProps {
  url: string;
  onProgress?: (progress: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => void;
  onEnded?: () => void;
}

export default function VideoPlayer({ url }: VideoPlayerProps) {
  // Extract video ID from Streamable URL
  // Supports: https://streamable.com/VIDEO_ID or https://streamable.com/e/VIDEO_ID
  const getStreamableId = (url: string) => {
    const match = url.match(/streamable\.com\/(?:e\/)?([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  const videoId = getStreamableId(url);
  const embedUrl = 'https://streamable.com/60z1kt';

  return (
    <div className="relative bg-black rounded-xl overflow-hidden">
      <div className="relative aspect-video">
        <iframe
          src={embedUrl}
          width="100%"
          height="100%"
          allowFullScreen
          allow="autoplay; fullscreen"
          className="absolute inset-0 w-full h-full border-0"
          title="Video player"
        />
      </div>
    </div>
  );
}
