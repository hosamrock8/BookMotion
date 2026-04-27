/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Scene, SceneStatus } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Image as ImageIcon, CheckCircle2, AlertCircle, Loader2, Music, Volume2, Video, Zap, Timer, Play, Pause, Mic, Sliders, Film, Hourglass, Trash2, Move, ChevronRight, RefreshCw } from 'lucide-react';
import { generateTTS } from '../services/ttsService';

interface SceneCardProps {
  scene: Scene;
  aspectRatio?: string;
  onGenerateImage: (sceneId: string) => void;
  onUpdateScene: (sceneId: string, updates: Partial<Scene>) => void;
  onDeleteScene: (sceneId: string) => void;
  onRegenerateScene: (sceneId: string) => void;
}

export const SceneCard: React.FC<SceneCardProps> = ({ scene, aspectRatio = "16:9", onGenerateImage, onUpdateScene, onDeleteScene, onRegenerateScene }) => {
  const [isRegenerating, setIsRegenerating] = React.useState(false);
  const [isGeneratingVoice, setIsGeneratingVoice] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Determine aspect ratio class based on new types
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case '9:16': return 'aspect-[9/16]';
      case '1:1': return 'aspect-square';
      default: return 'aspect-video'; // 16:9
    }
  };

  return (
    <motion.div
      layout
      className="bg-[#0a0a0b] border border-white/5 rounded-[2rem] overflow-hidden group hover:border-red-500/30 transition-all duration-500 h-full flex flex-col cinematic-glow relative shadow-2xl"
    >
      <div className={`${getAspectRatioClass()} relative bg-slate-900 group-hover:scale-[1.01] transition-transform duration-700 overflow-hidden border-b border-white/5`}>
        <AnimatePresence mode="wait">
          {scene.imageUrl ? (
            <motion.img
              key="image"
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
              src={scene.imageUrl}
              alt={scene.description}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <motion.div 
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex flex-col items-center justify-center text-slate-700 gap-3"
            >
            {scene.status === SceneStatus.GENERATING ? (
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Loader2 className="w-12 h-12 animate-spin text-red-600" />
                  <div className="absolute inset-0 blur-xl bg-red-600/20 animate-pulse"></div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 italic">Rendering Frame...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <ImageIcon className="w-12 h-12 opacity-10" />
                <button
                  onClick={() => onGenerateImage(scene.id)}
                  className="px-10 py-4 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_10px_30px_rgba(220,38,38,0.3)] italic"
                >
                  Inject Visuals
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
        
        <div className="absolute top-6 left-6 z-10 flex gap-3">
          <div className="bg-black/80 shadow-2xl backdrop-blur-xl border border-white/10 px-4 py-2 rounded-xl text-[9px] font-black text-white uppercase tracking-widest italic">
            {scene.imageUrl ? `SEQUENCE ${scene.order + 1} - COMMITTED` : `SEQUENCE ${scene.order + 1} - STAGED`}
          </div>
          <div className="bg-red-600/80 shadow-2xl backdrop-blur-xl border border-white/10 px-4 py-2 rounded-xl text-[9px] font-black text-white uppercase tracking-widest italic">
            {aspectRatio}
          </div>
        </div>

        <div className="absolute top-6 right-6 z-10 flex gap-3">
          <button 
            onClick={async () => {
              setIsRegenerating(true);
              await onRegenerateScene(scene.id);
              setIsRegenerating(false);
            }}
            disabled={isRegenerating || scene.status === SceneStatus.GENERATING}
            className="bg-black/60 hover:bg-red-600 text-gray-400 hover:text-white p-2.5 rounded-xl backdrop-blur-xl border border-white/10 transition-all disabled:opacity-50"
            title="Regenerate Narrative"
          >
            <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => onDeleteScene(scene.id)}
            className="bg-black/60 hover:bg-red-600 text-gray-400 hover:text-white p-2.5 rounded-xl backdrop-blur-xl border border-white/10 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <div className="bg-black/80 shadow-2xl backdrop-blur-xl border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3">
            <Clock className="w-3.5 h-3.5 text-red-500" />
            <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">{scene.timecode}</span>
          </div>
        </div>
        
        {scene.status === SceneStatus.COMPLETED && (
          <div className="absolute bottom-6 right-6 z-10 animate-in fade-in zoom-in">
            <div className="bg-red-600 p-2.5 rounded-xl shadow-[0_0_30px_rgba(220,38,38,0.5)] border border-white/20">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
          </div>
        )}
      </div>

      <div className="p-10 space-y-10 flex-1 relative">
        <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none">
          <Film className="w-32 h-32 text-white" />
        </div>

        <div className="space-y-8 relative z-10">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase text-red-500 tracking-[0.3em] flex items-center gap-3 italic">
              <Film className="w-4 h-4" /> Scene Architecture
            </h3>
            <textarea
              value={scene.description}
              onChange={(e) => onUpdateScene(scene.id, { description: e.target.value })}
              className="w-full bg-white/[0.03] hover:bg-white/[0.05] text-sm font-bold text-white border border-white/5 rounded-2xl p-5 h-24 outline-none focus:border-red-500/30 focus:ring-2 focus:ring-red-500/5 transition-all placeholder:text-gray-800"
              placeholder="Narrative beat description..."
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-[10px] font-black uppercase text-red-500 tracking-[0.3em] flex items-center gap-3 italic">
                <Video className="w-4 h-4" /> Cinematic Script
              </h3>
            </div>
            <textarea
              value={scene.narration}
              onChange={(e) => onUpdateScene(scene.id, { narration: e.target.value })}
              className="w-full bg-white/[0.03] hover:bg-white/[0.05] text-sm leading-relaxed text-gray-200 border border-white/5 rounded-2xl p-6 h-36 outline-none focus:border-red-500/30 focus:ring-2 focus:ring-red-500/5 transition-all font-serif italic"
              dir="rtl"
              placeholder="Vocal script content..."
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/5 p-5 rounded-2xl space-y-3 group/meta hover:bg-red-600/[0.02] transition-colors">
              <h4 className="text-[9px] font-black uppercase text-orange-500 tracking-widest flex items-center gap-2 italic">
                <Music className="w-3.5 h-3.5" /> Atmospheric Score
              </h4>
              <p className="text-[10px] text-gray-500 leading-relaxed font-bold uppercase tracking-tight">
                {scene.musicPrompt || "Processing audio landscape..."}
              </p>
            </div>
            <div className="bg-white/5 border border-white/5 p-5 rounded-2xl space-y-3 group/meta hover:bg-red-600/[0.02] transition-colors">
              <h4 className="text-[9px] font-black uppercase text-blue-500 tracking-widest flex items-center gap-2 italic">
                <Volume2 className="w-3.5 h-3.5" /> Foleys & FX
              </h4>
              <p className="text-[10px] text-gray-500 leading-relaxed font-bold uppercase tracking-tight">
                {scene.soundEffect || "Analyzing auditory environment..."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-4">
            <div className="space-y-4">
              <h4 className="text-[9px] font-black uppercase text-red-500 tracking-widest flex items-center gap-2 italic">
                <Zap className="w-3.5 h-3.5" /> Sequential Transition
              </h4>
              <select
                value={scene.transitionEffect || 'Fade'}
                onChange={(e) => onUpdateScene(scene.id, { transitionEffect: e.target.value as any })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] text-gray-300 outline-none focus:border-red-500 transition-all font-black uppercase tracking-widest cursor-pointer hover:bg-white/10 appearance-none"
              >
                {['Fade', 'Wipe', 'Dissolve', 'Cut', 'Zoom', 'Cross'].map(effect => (
                  <option key={effect} value={effect} className="bg-[#0a0a0b]">{effect}</option>
                ))}
              </select>
            </div>
            <div className="space-y-4">
              <h4 className="text-[9px] font-black uppercase text-red-500 tracking-widest flex items-center gap-2 italic">
                <Move className="w-3.5 h-3.5" /> Frame Kinematics
              </h4>
              <select
                value={scene.animationType || 'none'}
                onChange={(e) => onUpdateScene(scene.id, { animationType: e.target.value as any })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] text-gray-300 outline-none focus:border-red-500 transition-all font-black uppercase tracking-widest cursor-pointer hover:bg-white/10 appearance-none"
              >
                <option value="none" className="bg-[#0a0a0b]">Locked Frame</option>
                <option value="pan-right" className="bg-[#0a0a0b]">Horizontal Pan</option>
                <option value="pan-left" className="bg-[#0a0a0b]">Reverse Pan</option>
                <option value="zoom-in" className="bg-[#0a0a0b]">Neural Zoom</option>
                <option value="zoom-out" className="bg-[#0a0a0b]">Pull-back</option>
              </select>
            </div>
          </div>

          <div className="space-y-8 pt-8 border-t border-white/5">
            <h4 className="text-[10px] font-black uppercase text-red-500 tracking-[0.3em] flex items-center justify-between italic">
              <div className="flex items-center gap-3">
                <Mic className="w-4 h-4" /> Vocal Synthesis
              </div>
              {scene.voiceoverUrl && (
                <button 
                  onClick={() => {
                    if (audioRef.current) {
                      if (isPlaying) {
                        audioRef.current.pause();
                      } else {
                        audioRef.current.play();
                      }
                      setIsPlaying(!isPlaying);
                    }
                  }}
                  className="p-3 bg-red-600/10 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all border border-red-500/20 shadow-lg shadow-red-600/20"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
              )}
            </h4>

            {scene.voiceoverUrl && (
              <audio 
                ref={audioRef} 
                src={scene.voiceoverUrl} 
                onEnded={() => setIsPlaying(false)}
                className="hidden" 
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Edge Profile</label>
                <select 
                  value={scene.voiceProfile || 'en-US-GuyNeural'}
                  onChange={(e) => onUpdateScene(scene.id, { voiceProfile: e.target.value as any })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] text-gray-300 outline-none font-black uppercase tracking-tight"
                >
                   {['en-US-GuyNeural', 'en-US-AriaNeural', 'ar-EG-SalmaNeural', 'ar-SA-ZariNeural'].map(v => (
                     <option key={v} value={v} className="bg-[#0a0a0b]">{v.split('-').slice(1).join(' ')}</option>
                   ))}
                </select>
              </div>
              <div className="space-y-3 flex flex-col justify-end">
                <button 
                  onClick={async () => {
                    setIsGeneratingVoice(true);
                    try {
                      const url = await generateTTS(
                        scene.narration, 
                        scene.voiceProfile || 'en-US-GuyNeural',
                        scene.voiceSpeed || 1.0,
                        scene.voicePitch || 0
                      );
                      onUpdateScene(scene.id, { voiceoverUrl: url });
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setIsGeneratingVoice(false);
                    }
                  }}
                  disabled={isGeneratingVoice || !scene.narration}
                  className="w-full bg-red-600 hover:bg-red-500 text-white py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-lg shadow-red-600/20 italic"
                >
                  {isGeneratingVoice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {scene.voiceoverUrl ? 'Re-Recut' : 'Synthesize'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex justify-between text-[9px] font-black text-gray-500 uppercase tracking-widest">
                  <span>Playback Speed</span>
                  <span className="text-red-500 font-mono">{scene.voiceSpeed || 1.0}x</span>
                </div>
                <input 
                  type="range" min="0.5" max="2.0" step="0.1"
                  value={scene.voiceSpeed || 1.0}
                  onChange={(e) => onUpdateScene(scene.id, { voiceSpeed: parseFloat(e.target.value) })}
                  className="custom-slider w-full"
                />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between text-[9px] font-black text-gray-500 uppercase tracking-widest">
                  <span>Pitch Offset</span>
                  <span className="text-red-500 font-mono">{scene.voicePitch || 0}Hz</span>
                </div>
                <input 
                  type="range" min="-20" max="20" step="1"
                  value={scene.voicePitch || 0}
                  onChange={(e) => onUpdateScene(scene.id, { voicePitch: parseInt(e.target.value) })}
                  className="custom-slider w-full"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-white/5 mt-auto">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[10px] font-black uppercase text-gray-600 tracking-[0.3em] italic">Neural Visual Prompt</h3>
          </div>
          <textarea
            value={scene.visualPrompt}
            onChange={(e) => onUpdateScene(scene.id, { visualPrompt: e.target.value })}
            className="w-full bg-black/60 text-[10px] text-gray-500 font-mono resize-none border border-white/5 hover:border-red-500/30 focus:border-red-500/30 transition-all rounded-2xl p-5 h-28 uppercase outline-none leading-relaxed shadow-inner"
            placeholder="AI generation prompt..."
          />
        </div>
      </div>
    </motion.div>
  );
};
