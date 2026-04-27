/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { Scene, TransitionEffect, ProductionSettings } from '../types';
import { Play, Pause, SkipForward, SkipBack, Maximize2, Volume2, VolumeX, Zap, Timer, Repeat, Hourglass, ArrowUpRight, Mic, Sliders, PlayCircle, Loader2, Download, Film, Move, ChevronRight, Captions, Settings2, ArrowUp, ArrowDown } from 'lucide-react';
import { generateTTS } from '../services/ttsService';

interface CinematicPreviewProps {
  scenes: Scene[];
  aspectRatio: string;
  settings: ProductionSettings;
  onUpdateScene: (sceneId: string, updates: Partial<Scene>) => void;
  onReorderScenes: (newScenes: Scene[]) => void;
  onAddScene?: () => void;
}

export const CinematicPreview: React.FC<CinematicPreviewProps> = ({ scenes, aspectRatio, settings, onUpdateScene, onReorderScenes, onAddScene }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [activeDuration, setActiveDuration] = useState(4);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [subtitleSize, setSubtitleSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [subtitlePosition, setSubtitlePosition] = useState<'bottom' | 'top'>('bottom');
  const [showSubtitleSettings, setShowSubtitleSettings] = useState(false);
  const [isControlsHovered, setIsControlsHovered] = useState(false);
  
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const settingsRef = React.useRef<HTMLDivElement>(null);
  
  const currentScene = scenes[currentIndex];

  const isArabicText = (text: string): boolean => {
    return /[\u0600-\u06FF]/.test(text);
  };

  const handleGenerateVoiceover = async () => {
    if (!currentScene?.narration) return;
    
    setIsGeneratingVoice(true);
    try {
      const url = await generateTTS(
        currentScene.narration,
        currentScene.voiceProfile || 'en-US-GuyNeural',
        currentScene.voiceSpeed || 1.0,
        currentScene.voicePitch || 0
      );
      onUpdateScene(currentScene.id, { voiceoverUrl: url });
    } catch (error) {
      console.error("Voiceover generation failed", error);
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  const handleExport = async () => {
    if (!containerRef.current || !audioRef.current) return;
    
    setIsRecording(true);
    setRenderProgress(0);
    
    // Setup Audio Context for mixing
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioDestination = audioContext.createMediaStreamDestination();
    const audioSource = audioContext.createMediaElementSource(audioRef.current);
    audioSource.connect(audioDestination);
    audioSource.connect(audioContext.destination);

    // Capture Video Stream
    const videoStream = (containerRef.current.querySelector('img') as any)?.captureStream?.(30) || 
                        (containerRef.current as any).captureStream?.(30);
    
    if (!videoStream) {
      alert("Browser does not support direct stream capture.");
      setIsRecording(false);
      return;
    }

    // Mix Video and Audio
    const combinedStream = new MediaStream([
      ...videoStream.getVideoTracks(),
      ...audioDestination.stream.getAudioTracks()
    ]);
    
    const mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType: 'video/webm;codecs=vp9,opus',
      bitsPerSecond: 25000000 // Ultra-high bitrate for Master Quality
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BOOKMOTION_MASTER_RENDER_${Date.now()}.webm`;
      a.click();
      setIsRecording(false);
      audioContext.close();
    };

    // Start production from beginning
    setCurrentIndex(0);
    setIsPlaying(true);
    mediaRecorder.start();

    // Progress Simulation based on scenes
    const interval = setInterval(() => {
      setRenderProgress((prev) => {
        const next = prev + (100 / (scenes.length * 20)); // Approximate steps
        if (next >= 100) {
          clearInterval(interval);
          return 100;
        }
        return next;
      });
    }, 500);

    // Stop recording when last scene ends
    const checkEnd = setInterval(() => {
      if (currentIndex === scenes.length - 1 && !isPlaying) {
        mediaRecorder.stop();
        clearInterval(checkEnd);
        clearInterval(interval);
      }
    }, 1000);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSubtitleSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (audioRef.current && currentScene?.voiceoverUrl) {
      const handleLoadedMetadata = () => {
        const audioLen = audioRef.current?.duration || 0;
        const baseHold = currentScene.holdDuration || 4;
        setActiveDuration(Math.max(baseHold, audioLen));
      };
      
      if (audioRef.current.duration) handleLoadedMetadata();
      audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => audioRef.current?.removeEventListener('loadedmetadata', handleLoadedMetadata);
    } else {
      setActiveDuration(currentScene?.holdDuration || 4);
    }
  }, [currentScene?.id, currentScene?.voiceoverUrl, currentScene?.holdDuration]);

  useEffect(() => {
    let timer: number;
    const startTime = Date.now();

    if (isPlaying) {
      const handleNext = () => {
        if (currentIndex === scenes.length - 1) {
          if (isLooping) {
            setCurrentIndex(0);
          } else {
            setIsPlaying(false);
          }
        } else {
          setCurrentIndex((prev) => (prev + 1) % scenes.length);
        }
      };

      if (currentScene?.voiceoverUrl && audioRef.current) {
        audioRef.current.src = currentScene.voiceoverUrl;
        audioRef.current.volume = volume;
        audioRef.current.play().catch(console.error);

        audioRef.current.onended = () => {
          const elapsed = Date.now() - startTime;
          const remainingHold = Math.max(0, (currentScene.holdDuration || 4) * 1000 - elapsed);
          timer = window.setTimeout(handleNext, remainingHold + 500);
        };
      } else {
        const totalWait = ((currentScene?.holdDuration || 4.0) + (currentScene?.transitionDuration || 1)) * 1000;
        timer = window.setTimeout(handleNext, totalWait);
      }
    }
    return () => {
      window.clearTimeout(timer);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.onended = null;
      }
    };
  }, [isPlaying, currentIndex, scenes.length, isLooping, currentScene, volume]);

  const getImageAnimation = (type: Scene['animationType']) => {
    const d = activeDuration + (currentScene?.transitionDuration || 1) + 1;
    const intensity = (settings.zoomIntensity || 5) / 10;
    const scaleFactor = 1 + (0.4 * intensity); // Range 1.04 to 1.4
    const panFactor = 12 * intensity; // Range 1.2% to 12%

    switch (type) {
      case 'pan-right':
        return {
          animate: { x: [`-${panFactor}%`, `${panFactor}%`], scale: scaleFactor },
          transition: { duration: d, ease: "linear" }
        };
      case 'pan-left':
        return {
          animate: { x: [`${panFactor}%`, `-${panFactor}%`], scale: scaleFactor },
          transition: { duration: d, ease: "linear" }
        };
      case 'zoom-in':
        return {
          animate: { scale: [1, scaleFactor], rotate: [0, 2 * intensity] },
          transition: { duration: d, ease: "linear" }
        };
      case 'zoom-out':
        return {
          animate: { scale: [scaleFactor, 1], rotate: [2 * intensity, 0] },
          transition: { duration: d, ease: "linear" }
        };
      default:
        return {
          animate: { scale: 1 + (0.05 * intensity) },
          transition: { duration: d, ease: "linear" }
        };
    }
  };

  const getTransitionVariants = (effect: TransitionEffect = 'Fade', duration: number = 1) => {
    switch (effect) {
      case 'Cut':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          transition: { duration: 0 }
        };
      case 'Wipe':
        return {
          initial: { clipPath: 'inset(0 100% 0 0)' },
          animate: { clipPath: 'inset(0 0% 0 0)' },
          exit: { clipPath: 'inset(0 0 0 100%)', opacity: 0 },
          transition: { duration, ease: [0.4, 0, 0.2, 1] }
        };
      case 'Dissolve':
        return {
          initial: { opacity: 0, scale: 1.1, filter: 'blur(10px)' },
          animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
          exit: { opacity: 0, filter: 'blur(10px)' },
          transition: { duration, ease: "linear" }
        };
      case 'Zoom':
        return {
          initial: { opacity: 0, scale: 1.4, filter: 'brightness(2)' },
          animate: { opacity: 1, scale: 1, filter: 'brightness(1)' },
          exit: { opacity: 0, scale: 0.8, filter: 'brightness(0.5)' },
          transition: { duration, ease: [0.22, 1, 0.36, 1] }
        };
      case 'Cross':
        return {
          initial: { opacity: 0, x: '100%', rotate: 2 },
          animate: { opacity: 1, x: 0, rotate: 0 },
          exit: { opacity: 0, x: '-100%', rotate: -2 },
          transition: { duration, ease: "circOut" }
        };
      case 'Fade':
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          transition: { duration, ease: "easeInOut" }
        };
    }
  };

  const variants = getTransitionVariants(currentScene?.transitionEffect, currentScene?.transitionDuration);

  // Helper to determine aspect class
  const getAspectClass = () => {
    switch (aspectRatio) {
      case '9:16': return 'aspect-[9/16] max-h-[70vh]';
      case '1:1': return 'aspect-square max-h-[70vh]';
      default: return 'aspect-video';
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic">Cinematic Playback</h3>
          <p className="text-[10px] text-gray-500 mt-2 font-mono uppercase tracking-[0.2em]">Neural Sequence Rendering Engine v4.0</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleExport}
            disabled={isRecording}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-2xl ${
              isRecording 
                ? 'bg-red-600/20 text-red-500 animate-pulse border border-red-500/30' 
                : 'bg-white text-black hover:bg-gray-200'
            }`}
          >
            {isRecording ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
            {isRecording ? 'Capturing High-Fidelity...' : 'Export Master'}
          </button>
          <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 text-[10px] font-mono text-gray-400 font-bold tracking-widest uppercase italic">
            Sequence {currentIndex + 1} // {scenes.length}
          </div>
        </div>
      </div>

      <div className="relative group" ref={containerRef}>
        <div className={`w-full overflow-hidden rounded-[3rem] bg-black border border-white/5 shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative ${getAspectClass()} flex items-center justify-center mx-auto`}>
          <AnimatePresence>
            {!currentScene?.imageUrl ? (
              <motion.div 
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-gray-700 flex flex-col items-center gap-6"
              >
                <div className="w-20 h-20 border-4 border-gray-900 border-t-red-600 rounded-full animate-spin shadow-[0_0_20px_rgba(220,38,38,0.2)]" />
                <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-gray-600">Syncing Assets...</span>
              </motion.div>
            ) : (
              <motion.div
                key={currentScene.id}
                initial={variants.initial}
                animate={variants.animate}
                exit={variants.exit}
                transition={variants.transition}
                className="absolute inset-0 w-full h-full"
              >
                <motion.img
                  src={currentScene.imageUrl}
                  {...getImageAnimation(currentScene.animationType)}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Professional Subtitle Overlay */}
          <AnimatePresence>
            {showSubtitles && currentScene?.narration && (
              <motion.div
                key={currentScene.id}
                initial={{ opacity: 0, y: subtitlePosition === 'bottom' ? 20 : -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: subtitlePosition === 'bottom' ? 20 : -20 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className={`absolute left-0 right-0 px-12 py-10 z-30 transition-opacity duration-300 pointer-events-none ${
                  subtitlePosition === 'bottom' 
                    ? 'bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent' 
                    : 'top-0 bg-gradient-to-b from-black/85 via-black/40 to-transparent'
                } ${isControlsHovered ? 'opacity-0' : 'opacity-100'}`}
              >
                <div 
                  className={`max-w-5xl mx-auto drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] font-semibold text-white leading-relaxed ${
                    subtitleSize === 'sm' ? 'text-sm' : subtitleSize === 'md' ? 'text-lg' : 'text-3xl'
                  }`}
                  style={{ 
                    direction: isArabicText(currentScene.narration) ? 'rtl' : 'ltr',
                    textAlign: isArabicText(currentScene.narration) ? 'right' : 'left'
                  }}
                >
                  {currentScene.narration}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Render Progress Overlay */}
          <AnimatePresence>
            {isRecording && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-8"
              >
                <div className="relative">
                  <div className="w-32 h-32 border-2 border-red-600/20 rounded-full flex items-center justify-center">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border-t-2 border-red-600 rounded-full"
                    />
                    <span className="text-2xl font-black text-white italic">{Math.round(renderProgress)}%</span>
                  </div>
                </div>
                <div className="text-center">
                  <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">Master Rendering in Progress</h4>
                  <p className="text-[9px] text-red-500 font-mono uppercase tracking-[0.4em] mt-2">Merging Neural Sequences & Audio Tracks</p>
                </div>
                <div className="w-64 h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-red-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${renderProgress}%` }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Player Overlays */}
          <div 
            onMouseEnter={() => setIsControlsHovered(true)}
            onMouseLeave={() => setIsControlsHovered(false)}
            className="absolute inset-x-0 bottom-0 p-12 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col gap-8"
          >
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentScene?.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 max-w-4xl"
              >
                <h4 className="text-white font-black text-2xl italic leading-tight" dir="rtl">{currentScene?.narration}</h4>
                <div className="flex gap-4">
                   <span className="px-3 py-1 bg-red-600/20 text-red-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-red-500/30">
                     {currentScene?.transitionEffect} Transition
                   </span>
                   <span className="px-3 py-1 bg-white/5 text-gray-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/10">
                     {currentScene?.animationType === 'none' ? 'Static Frame' : currentScene?.animationType?.replace('-', ' ')}
                   </span>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center gap-8">
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.2)]"
              >
                {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current translate-x-1" />}
              </button>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setCurrentIndex((prev) => (prev - 1 + scenes.length) % scenes.length)}
                  className="p-5 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/10 transition-all"
                >
                  <SkipBack className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => setCurrentIndex((prev) => (prev + 1) % scenes.length)}
                  className="p-5 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/10 transition-all"
                >
                  <SkipForward className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden relative">
                <motion.div 
                   className="absolute inset-y-0 left-0 bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.8)]"
                   initial={{ width: "0%" }}
                   animate={{ width: `${((currentIndex + 1) / scenes.length) * 100}%` }}
                />
              </div>

              <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-2.5 px-5 rounded-2xl relative">
                <button 
                  onClick={() => setIsLooping(!isLooping)}
                  className={`p-2.5 rounded-xl transition-all ${isLooping ? 'bg-red-600/20 text-red-500 border border-red-500/30 shadow-[0_0_15px_rgba(220,38,38,0.2)]' : 'text-gray-500 hover:text-white'}`}
                >
                  <Repeat className="w-5 h-5" />
                </button>
                <div className="w-px h-6 bg-white/10" />
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setShowSubtitles(!showSubtitles)}
                    title="Toggle Subtitles"
                    className={`p-2.5 rounded-xl transition-all ${showSubtitles ? 'bg-red-600/20 text-red-500 border border-red-500/30 shadow-[0_0_15px_rgba(220,38,38,0.2)]' : 'text-gray-500 hover:text-white'}`}
                  >
                    <Captions className="w-5 h-5" />
                  </button>
                  <div className="relative" ref={settingsRef}>
                    <button 
                      onClick={() => setShowSubtitleSettings(!showSubtitleSettings)}
                      className={`p-1.5 rounded-lg transition-all ${showSubtitleSettings ? 'text-white bg-white/10' : 'text-gray-600 hover:text-white'}`}
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                    </button>
                    <AnimatePresence>
                      {showSubtitleSettings && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute bottom-full mb-4 right-0 w-56 bg-[#0a0a0b] border border-white/10 rounded-2xl p-4 shadow-2xl z-50 space-y-5"
                        >
                          <div className="space-y-3">
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 px-1">Subtitle Size</span>
                            <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                              {(['sm', 'md', 'lg'] as const).map((size) => (
                                <button
                                  key={size}
                                  onClick={() => setSubtitleSize(size)}
                                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${subtitleSize === size ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                                >
                                  {size === 'sm' ? 'S' : size === 'md' ? 'M' : 'L'}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-3">
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 px-1">Screen Position</span>
                            <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                              <button
                                onClick={() => setSubtitlePosition('top')}
                                className={`flex-1 py-1.5 flex justify-center items-center rounded-lg transition-all ${subtitlePosition === 'top' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                              >
                                <ArrowUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setSubtitlePosition('bottom')}
                                className={`flex-1 py-1.5 flex justify-center items-center rounded-lg transition-all ${subtitlePosition === 'bottom' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                              >
                                <ArrowDown className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-2.5 px-6 rounded-2xl group/volume transition-all hover:bg-white/10">
                <button onClick={() => setVolume(volume === 0 ? 0.8 : 0)}>
                  {volume === 0 ? <VolumeX className="w-6 h-6 text-gray-500" /> : <Volume2 className="w-6 h-6 text-white" />}
                </button>
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="custom-slider w-0 group-hover/volume:w-32 transition-all cursor-pointer"
                />
              </div>

              <button className="p-5 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/10 transition-all">
                <Maximize2 className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Scene Editor Sidebar */}
        <div className="absolute right-0 top-0 bottom-0 w-80 translate-x-full group-hover:translate-x-0 transition-transform duration-500 z-40 p-6 flex flex-col gap-6">
          <div className="glass-panel h-full rounded-3xl p-6 flex flex-col gap-6 border-white/10 shadow-2xl overflow-y-auto custom-scrollbar">
            <h5 className="text-[10px] font-black uppercase tracking-widest text-red-500 italic">Sequence Metadata</h5>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest px-1">Visual Prompt</label>
                <textarea 
                  value={currentScene?.visualPrompt}
                  onChange={(e) => onUpdateScene(currentScene.id, { visualPrompt: e.target.value })}
                  className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-[10px] text-gray-300 focus:ring-1 focus:ring-red-500 outline-none h-32 resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest px-1">Narration Script</label>
                <textarea 
                  value={currentScene?.narration}
                  onChange={(e) => onUpdateScene(currentScene.id, { narration: e.target.value })}
                  className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-[10px] text-gray-300 focus:ring-1 focus:ring-red-500 outline-none h-32 resize-none leading-relaxed italic"
                  dir="rtl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest px-1">Hold Time</label>
                  <input 
                    type="number"
                    value={currentScene?.holdDuration || 4}
                    onChange={(e) => onUpdateScene(currentScene.id, { holdDuration: parseFloat(e.target.value) })}
                    className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-[10px] text-white focus:ring-1 focus:ring-red-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest px-1">Motion</label>
                  <select 
                    value={currentScene?.animationType || 'none'}
                    onChange={(e) => onUpdateScene(currentScene.id, { animationType: e.target.value as any })}
                    className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-[10px] text-white focus:ring-1 focus:ring-red-500 outline-none"
                  >
                    {['none', 'pan-right', 'pan-left', 'zoom-in', 'zoom-out'].map(type => (
                      <option key={type} value={type}>{type.replace('-', ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="mt-auto">
              <button 
                onClick={handleGenerateVoiceover}
                className="w-full bg-white text-black py-4 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-gray-200 transition-all shadow-lg italic"
              >
                Regenerate Audio
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8 px-10 py-6 bg-[#0a0a0b] border border-white/5 rounded-[3rem] shadow-2xl overflow-x-auto no-scrollbar">
        {/* Transition Engine */}
        <div className="flex items-center gap-8 min-w-[250px]">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Zap className="w-4 h-4 text-red-500" />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">Sequence Transition</span>
            </div>
            <select 
              value={currentScene?.transitionEffect || 'Fade'}
              onChange={(e) => onUpdateScene(currentScene.id, { transitionEffect: e.target.value as any })}
              className="bg-transparent text-sm font-black text-white outline-none cursor-pointer uppercase tracking-tighter"
            >
              {['Fade', 'Wipe', 'Dissolve', 'Cut', 'Zoom', 'Cross'].map(effect => (
                <option key={effect} value={effect} className="bg-[#0a0a0b]">{effect}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 flex flex-col gap-3">
            <div className="flex justify-between text-[9px] font-black text-gray-600 uppercase tracking-tighter">
              <span>Duration</span>
              <span className="text-red-500 font-mono">{(currentScene?.transitionDuration || 1.0).toFixed(1)}s</span>
            </div>
            <input 
              type="range"
              min="0.1"
              max="4.0"
              step="0.1"
              value={currentScene?.transitionDuration || 1.0}
              onChange={(e) => onUpdateScene(currentScene.id, { transitionDuration: parseFloat(e.target.value) })}
              className="custom-slider w-full"
            />
          </div>
        </div>

        <div className="w-px h-12 bg-white/5" />

        {/* Voice Engine */}
        <div className="flex items-center gap-8 flex-1 min-w-[300px]">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Mic className="w-4 h-4 text-orange-500" />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">Neural Voice Engine</span>
            </div>
            <select 
              value={currentScene?.voiceProfile || 'en-US-GuyNeural'}
              onChange={(e) => onUpdateScene(currentScene.id, { voiceProfile: e.target.value as any })}
              className="bg-transparent text-sm font-black text-white outline-none cursor-pointer uppercase tracking-tighter"
            >
              {['en-US-GuyNeural', 'en-US-AriaNeural', 'ar-EG-SalmaNeural', 'ar-SA-ZariNeural'].map(voice => (
                <option key={voice} value={voice} className="bg-[#0a0a0b]">{voice.split('-').slice(1).join(' ')}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 flex flex-col gap-3">
            <div className="flex justify-between text-[9px] font-black text-gray-600 uppercase tracking-tighter">
              <span>Playback Velocity</span>
              <span className="text-orange-500 font-mono">{currentScene?.voiceSpeed || 1.0}x</span>
            </div>
            <input 
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={currentScene?.voiceSpeed || 1.0}
              onChange={(e) => onUpdateScene(currentScene.id, { voiceSpeed: parseFloat(e.target.value) })}
              className="custom-slider w-full"
            />
          </div>
        </div>

        <div className="w-px h-12 bg-white/5" />

        <button 
          onClick={handleGenerateVoiceover}
          disabled={isGeneratingVoice || !currentScene?.narration}
          className={`flex items-center gap-4 px-8 py-4 rounded-2xl transition-all ${
            isGeneratingVoice 
              ? 'bg-red-600/10 text-red-500 animate-pulse border border-red-500/20' 
              : 'bg-red-600 text-white hover:scale-105 hover:bg-red-500 active:scale-95 shadow-xl shadow-red-600/20'
          } disabled:opacity-50 font-black text-[10px] uppercase tracking-widest italic`}
        >
          {isGeneratingVoice ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <PlayCircle className="w-4 h-4" />
          )}
          {currentScene?.voiceoverUrl ? 'Refine Vocal Synthesis' : 'Synthesize Audio'}
        </button>
      </div>

      <Reorder.Group 
        axis="x" 
        values={scenes} 
        onReorder={onReorderScenes} 
        className="grid grid-cols-6 gap-6"
      >
        {scenes.map((scene, idx) => (
          <Reorder.Item
            key={scene.id}
            value={scene}
            initial={false}
            animate={{ 
              scale: currentIndex === idx ? 1.1 : 1,
              zIndex: currentIndex === idx ? 20 : 1,
              border: currentIndex === idx ? "2px solid #dc2626" : "1px solid rgba(255,255,255,0.05)"
            }}
            transition={{ type: "spring", stiffness: 500, damping: 35, mass: 1 }}
            whileHover={{ scale: currentIndex === idx ? 1.12 : 1.05 }}
            whileTap={{ scale: 1.02 }}
            onClick={() => {
              setCurrentIndex(idx);
              setIsPlaying(false);
            }}
            className={`relative aspect-video rounded-2xl overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing transition-opacity duration-300 ${
              currentIndex === idx 
                ? "shadow-[0_20px_40px_rgba(220,38,38,0.2)] opacity-100" 
                : "opacity-40 hover:opacity-100"
            }`}
          >
            {/* Playback Indicator */}
            <AnimatePresence>
              {currentIndex === idx && isPlaying && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 bg-red-600/10 z-20 pointer-events-none flex items-center justify-center"
                >
                  <div className="bg-red-600 text-white p-2 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.6)] scale-110">
                    <Play className="w-4 h-4 fill-current" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {currentIndex === idx && (
              <div className="absolute top-3 left-3 z-30">
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-2 border backdrop-blur-xl ${
                    isPlaying 
                      ? "bg-red-600/20 border-red-500/50 text-red-400 animate-pulse" 
                      : "bg-white/10 border-white/20 text-white"
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? "bg-red-400 shadow-[0_0_8px_#f87171]" : "bg-white shadow-[0_0_8px_#fff]"}`} />
                  <span className="text-[8px] font-black uppercase tracking-widest italic">
                    {isPlaying ? "Live" : "Active"}
                  </span>
                </motion.div>
              </div>
            )}
            
            <AnimatePresence mode="wait">
              <motion.div
                key={scene.imageUrl || "empty"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full"
              >
                {scene.imageUrl ? (
                  <img 
                    src={scene.imageUrl} 
                    className={`w-full h-full object-cover pointer-events-none transition-transform duration-[2000ms] ease-out ${
                      currentIndex === idx && isPlaying ? "scale-125" : "scale-100"
                    }`} 
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-900 flex flex-col items-center justify-center text-[10px] font-black uppercase text-gray-700 pointer-events-none tracking-[0.2em] italic">
                    <Film className="w-6 h-6 mb-2 opacity-10" />
                    Seq {idx + 1}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Subtitle Activity Indicator */}
            {showSubtitles && currentIndex === idx && (
              <motion.div 
                layoutId="subtitle-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 z-30" 
              />
            )}
          </Reorder.Item>
        ))}
        {onAddScene && (
          <button
            onClick={onAddScene}
            className="relative aspect-video rounded-2xl overflow-hidden border-2 border-dashed border-white/5 opacity-40 hover:opacity-100 hover:border-red-500/40 hover:bg-red-600/[0.02] transition-all flex flex-col items-center justify-center gap-3 group/add"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover/add:bg-red-600 group-hover/add:text-white transition-all shadow-inner group-hover/add:shadow-[0_0_20px_rgba(220,38,38,0.4)]">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 group-hover/add:text-red-400 transition-colors italic">New Sequence</span>
          </button>
        )}
      </Reorder.Group>
    </div>
  );
};
