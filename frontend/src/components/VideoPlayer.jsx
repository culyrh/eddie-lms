import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  SkipBack, 
  SkipForward, 
  Maximize, 
  Minimize
} from 'lucide-react';
import progressTrackingService from '../services/progressTrackingService';

// 유틸리티 함수들
const formatTime = (time) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const calculateProgress = (currentTime, duration) => {
  if (duration === 0) return 0;
  return Math.min(100, (currentTime / duration) * 100);
};

// 비디오 플레이어 훅
const useVideoPlayer = (videoUrl, initialProgress = 0, autoPlay = false) => {
  const videoRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);

  // 비디오 이벤트 설정
  const setupVideoEvents = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setLoading(false);
      
      if (initialProgress > 0) {
        const startTime = (initialProgress / 100) * video.duration;
        video.currentTime = startTime;
        setCurrentTime(startTime);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    const handleRateChange = () => {
      if (video.playbackRate > 2) {
        video.playbackRate = 2;
        setPlaybackRate(2);
      } else {
        setPlaybackRate(video.playbackRate);
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('ratechange', handleRateChange);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('ratechange', handleRateChange);
    };
  }, [initialProgress]);

  useEffect(() => {
    const cleanup = setupVideoEvents();
    return cleanup;
  }, [videoUrl, setupVideoEvents]);

  // 컨트롤 함수들
  const togglePlayPause = () => {
    const video = videoRef.current;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const changeVolume = (newVolume) => {
    const video = videoRef.current;
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const skipBackward = () => {
    const video = videoRef.current;
    const newTime = Math.max(0, video.currentTime - 10);
    video.currentTime = newTime;
  };

  const skipForward = () => {
    const video = videoRef.current;
    const newTime = Math.min(duration, video.currentTime + 10);
    video.currentTime = newTime;
  };

  const changePlaybackRate = (rate) => {
    const video = videoRef.current;
    const limitedRate = Math.min(rate, 2);
    video.playbackRate = limitedRate;
    setPlaybackRate(limitedRate);
  };

  const seekTo = (time) => {
    const video = videoRef.current;
    video.currentTime = parseFloat(time);
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      videoRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return {
    videoRef,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackRate,
    isFullscreen,
    loading,
    togglePlayPause,
    changeVolume,
    toggleMute,
    skipBackward,
    skipForward,
    changePlaybackRate,
    seekTo,
    toggleFullscreen
  };
};

// 진도율 관리 훅
const useProgressTracking = (
  videoRef, 
  currentTime, 
  duration, 
  isPlaying, 
  lessonId, 
  userId, 
  token, 
  onProgressUpdate
) => {
  const [progress, setProgress] = useState(0);
  const progressUpdateIntervalRef = useRef(null);
  const completionRequestRef = useRef(false); // 완료 요청 중복 방지
  const lastProgressRef = useRef(0); // 이전 진도율 저장

  const updateProgress = useCallback(() => {
    if (!videoRef.current || duration === 0) return;
    
    const newProgress = calculateProgress(currentTime, duration);
    setProgress(newProgress);
    
    // 진도율이 실제로 변경되었을 때만 부모에 알림 (1% 이상 차이)
    if (Math.abs(newProgress - lastProgressRef.current) >= 1) {
      lastProgressRef.current = newProgress;
      
      // 90% 이상이고 아직 완료 요청을 하지 않았을 때만 onProgressUpdate 호출
      if (newProgress >= 90 && !completionRequestRef.current) {
        completionRequestRef.current = true;
        if (onProgressUpdate) {
          onProgressUpdate(newProgress);
        }
        
        // 5초 후 다시 완료 요청 가능하도록 (실패 시 재시도용)
        setTimeout(() => {
          completionRequestRef.current = false;
        }, 5000);
      } else if (newProgress < 90 && onProgressUpdate) {
        // 90% 미만일 때는 정상적으로 진도율만 업데이트
        onProgressUpdate(newProgress);
      }
    }
  }, [videoRef, currentTime, duration, onProgressUpdate]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateProgress();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [currentTime, updateProgress]);

  useEffect(() => {
    if (isPlaying && lessonId && userId && token) {
      progressUpdateIntervalRef.current = setInterval(async () => {
        try {
          const video = videoRef.current;
          if (video) {
            await progressTrackingService.updateProgress(
              lessonId, 
              userId, 
              video.currentTime,
              video.duration, 
              token
            );
            
            console.log(`진도율 자동 저장: ${calculateProgress(video.currentTime, video.duration).toFixed(1)}%`);
          }
        } catch (error) {
          console.error('자동 진도율 저장 오류:', error);
        }
      }, 30000);

      return () => {
        if (progressUpdateIntervalRef.current) {
          clearInterval(progressUpdateIntervalRef.current);
        }
      };
    }
  }, [isPlaying, lessonId, userId, token, videoRef]);

  useEffect(() => {
    return () => {
      if (progressUpdateIntervalRef.current) {
        clearInterval(progressUpdateIntervalRef.current);
      }
      
      if (lessonId && userId && token && videoRef.current) {
        const video = videoRef.current;
        if (video.currentTime > 0) {
          progressTrackingService.updateProgress(
            lessonId, 
            userId, 
            video.currentTime,
            video.duration, 
            token
          ).catch(console.error);
        }
      }
    };
  }, [lessonId, userId, token, videoRef]);

  return { progress };
};

// 컨트롤 UI 관리 훅
const useVideoControls = (isPlaying) => {
  const [showControls, setShowControls] = useState(true);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    let hideControlsTimeout;

    const showControlsTemporarily = () => {
      setShowControls(true);
      clearTimeout(hideControlsTimeout);
      hideControlsTimeout = setTimeout(() => {
        if (isPlayingRef.current) {
          setShowControls(false);
        }
      }, 3000);
    };

    const handleMouseMove = () => {
      showControlsTemporarily();
    };

    const handleMouseLeave = () => {
      if (isPlayingRef.current) {
        setShowControls(false);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      clearTimeout(hideControlsTimeout);
    };
  }, []);

  return { showControls };
};

// 컴포넌트들
const LoadingSpinner = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
  </div>
);

const PlayButton = ({ onClick }) => (
  <div className="absolute inset-0 flex items-center justify-center">
    <button
      onClick={onClick}
      className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-4 transition-all duration-200"
    >
      <Play className="h-12 w-12 text-white ml-1" />
    </button>
  </div>
);

const ProgressDisplay = ({ progress }) => (
  <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
    진도율: {Math.round(progress)}%
  </div>
);

const VideoControls = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  playbackRate,
  isFullscreen,
  showControls,
  onTogglePlayPause,
  onVolumeChange,
  onToggleMute,
  onSkipBackward,
  onSkipForward,
  onPlaybackRateChange,
  onSeek,
  onToggleFullscreen
}) => {
  const handleVolumeChange = (e) => {
    onVolumeChange(parseFloat(e.target.value));
  };

  const handlePlaybackRateChange = (e) => {
    onPlaybackRateChange(parseFloat(e.target.value));
  };

  const handleSeek = (e) => {
    onSeek(e.target.value);
  };

  return (
    <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black to-transparent p-4 transition-opacity duration-300 ${
      showControls ? 'opacity-100' : 'opacity-0'
    }`}>
      <div className="mb-4">
        <input
          type="range"
          min="0"
          max={duration}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / duration) * 100}%, #4b5563 ${(currentTime / duration) * 100}%, #4b5563 100%)`
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onTogglePlayPause}
            className="text-white hover:text-blue-400 transition-colors duration-200"
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          </button>

          <button
            onClick={onSkipBackward}
            className="text-white hover:text-blue-400 transition-colors duration-200"
          >
            <SkipBack className="h-5 w-5" />
          </button>

          <button
            onClick={onSkipForward}
            className="text-white hover:text-blue-400 transition-colors duration-200"
          >
            <SkipForward className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleMute}
              className="text-white hover:text-blue-400 transition-colors duration-200"
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <span className="text-white text-sm">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={playbackRate}
            onChange={handlePlaybackRateChange}
            className="bg-gray-800 text-white text-sm rounded px-2 py-1"
          >
            <option value={0.5}>0.5x</option>
            <option value={0.75}>0.75x</option>
            <option value={1}>1x</option>
            <option value={1.25}>1.25x</option>
            <option value={1.5}>1.5x</option>
            <option value={2}>2x</option>
          </select>

          <button
            onClick={onToggleFullscreen}
            className="text-white hover:text-blue-400 transition-colors duration-200"
          >
            {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

// 메인 VideoPlayer 컴포넌트
const VideoPlayer = ({ 
  videoUrl, 
  lessonId, 
  userId, 
  token,
  onProgressUpdate,
  initialProgress = 0,
  autoPlay = false 
}) => {
  const videoPlayer = useVideoPlayer(videoUrl, initialProgress, autoPlay);
  const { showControls } = useVideoControls(videoPlayer.isPlaying);
  const { progress } = useProgressTracking(
    videoPlayer.videoRef,
    videoPlayer.currentTime,
    videoPlayer.duration,
    videoPlayer.isPlaying,
    lessonId,
    userId,
    token,
    onProgressUpdate
  );

  return (
    <div className="relative bg-black rounded-lg overflow-hidden group">
      <video
        ref={videoPlayer.videoRef}
        src={videoUrl}
        className="w-full h-auto max-h-[70vh]"
        autoPlay={autoPlay}
        onClick={videoPlayer.togglePlayPause}
        onDoubleClick={videoPlayer.toggleFullscreen}
        controlsList="nodownload nofullscreen noremoteplayback"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
      />

      {videoPlayer.loading && <LoadingSpinner />}

      {!videoPlayer.isPlaying && !videoPlayer.loading && (
        <PlayButton onClick={videoPlayer.togglePlayPause} />
      )}

      <ProgressDisplay progress={progress} />

      <VideoControls
        isPlaying={videoPlayer.isPlaying}
        currentTime={videoPlayer.currentTime}
        duration={videoPlayer.duration}
        volume={videoPlayer.volume}
        isMuted={videoPlayer.isMuted}
        playbackRate={videoPlayer.playbackRate}
        isFullscreen={videoPlayer.isFullscreen}
        showControls={showControls}
        onTogglePlayPause={videoPlayer.togglePlayPause}
        onVolumeChange={videoPlayer.changeVolume}
        onToggleMute={videoPlayer.toggleMute}
        onSkipBackward={videoPlayer.skipBackward}
        onSkipForward={videoPlayer.skipForward}
        onPlaybackRateChange={videoPlayer.changePlaybackRate}
        onSeek={videoPlayer.seekTo}
        onToggleFullscreen={videoPlayer.toggleFullscreen}
      />
    </div>
  );
};

export default VideoPlayer;