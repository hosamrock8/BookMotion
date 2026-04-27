/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { Sparkles, Wand2, ArrowRight, FileText, X, Save, Plus, Settings2, Film, Layers, Monitor, Globe, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VisualStyle, UserStylePreset, ProductionSettings, AspectRatio, AppLanguage, AIModel, OutputFormat, FrameRate } from '../types';
import { SettingsPanel } from './SettingsPanel';

interface MovieFormProps {
  onGenerate: (title: string, style: string, settings: ProductionSettings, pdfFile?: File) => void;
  isLoading: boolean;
  loadingStatus?: string;
  loadingProgress: number;
}

export function MovieForm({ onGenerate, isLoading, loadingStatus, loadingProgress }: MovieFormProps) {
  const [title, setTitle] = useState('');
  const [style, setStyle] = useState<string>('Cinematic');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'story' | 'settings'>('story');
  
  // Production Settings following the new architecture
  const [settings, setSettings] = useState<ProductionSettings>({
    projectTitle: '',
    language: 'en',
    outputFormat: 'mp4',
    aspectRatio: '16:9',
    style: 'Cinematic',
    quality: 'High',
    frameRate: 24,
    aiModel: 'gemini-3.1-flash',
    aiModelStoryboard: 'gemini-3.1-flash',
    temperature: 0.7,
    sceneDensity: 6,
    zoomIntensity: 5,
    outputDirectory: 'C:/Production/BookMotion/Exports',
    audio: {
      enabled: true,
      defaultVoice: 'Kore',
      pitch: 1.0,
      speed: 1.0,
      backgroundMusic: true,
    },
  });

  const [presets, setPresets] = useState<UserStylePreset[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedPresets = localStorage.getItem('bookmotion_presets');
    if (savedPresets) {
      setPresets(JSON.parse(savedPresets));
    }

    const handleSwitch = () => setActiveTab('settings');
    window.addEventListener('switch-to-settings', handleSwitch);
    return () => window.removeEventListener('switch-to-settings', handleSwitch);
  }, []);

  // Sync title with projectTitle
  useEffect(() => {
    setSettings(prev => ({ ...prev, projectTitle: title }));
  }, [title]);

  const handleSavePreset = (name: string) => {
    const newPreset: UserStylePreset = {
      id: crypto.randomUUID(),
      name,
      style: style as VisualStyle,
      settings
    };
    const updated = [...presets, newPreset];
    setPresets(updated);
    localStorage.setItem('bookmotion_presets', JSON.stringify(updated));
  };

  const handleLoadPreset = (preset: UserStylePreset) => {
    setStyle(preset.style);
    setSettings(preset.settings);
    setTitle(preset.settings.projectTitle);
  };

  const handleDeletePreset = (id: string) => {
    const updated = presets.filter(p => p.id !== id);
    setPresets(updated);
    localStorage.setItem('bookmotion_presets', JSON.stringify(updated));
  };

  const styles = [
    { id: 'Cinematic', label: 'Hyper-Realistic', icon: '📽️', description: 'Masterwork cinematic realism' },
    { id: 'Anime', label: 'Studio Ghibli', icon: '🏯', description: 'Hand-drawn ethereal aesthetic' },
    { id: 'Noir', label: 'Neo-Noir', icon: '🕶️', description: 'High-contrast shadow play' },
    { id: 'Cyberpunk', label: 'Night City', icon: '🏮', description: 'Neon-drenched futurism' },
    { id: '3D Render', label: 'Pixar Dreams', icon: '🎈', description: 'Soft 3D character animation' },
    { id: 'Digital Art', label: 'Concept Canvas', icon: '🖌️', description: 'Painterly digital strokes' },
  ];

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 30 * 1024 * 1024) {
        alert("الملف كبير جداً. الحد الأقصى هو 30 ميجابايت.");
        return;
      }
      
      if (file.type === 'application/pdf' || file.type === 'application/epub+zip' || file.name.endsWith('.epub')) {
        setSelectedFile(file);
        if (!title) {
          setTitle(file.name.replace(/\.(pdf|epub)$/i, ''));
        }
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-12">
      <div className="text-center space-y-6 mb-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 bg-red-600/10 px-4 py-2 rounded-full border border-red-500/20"
        >
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]"></div>
          <span className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em]">High-End Narrative Suite v3.0</span>
        </motion.div>
        
        <h1 className="text-7xl font-black text-white tracking-tighter leading-[0.95] max-w-5xl mx-auto italic uppercase">
          Engineering <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-red-600 bg-[length:200%_auto] animate-shimmer">Cinematic</span> <br /> 
          Masterpieces
        </h1>
      </div>

      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={() => setActiveTab('story')}
          className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 border-2 ${
            activeTab === 'story' 
              ? 'bg-red-600 border-red-500 text-white shadow-[0_10px_20px_rgba(220,38,38,0.3)]' 
              : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'
          }`}
        >
          <Film className="w-4 h-4" /> Story & Style
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 border-2 ${
            activeTab === 'settings' 
              ? 'bg-red-600 border-red-500 text-white shadow-[0_10px_20px_rgba(220,38,38,0.3)]' 
              : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'
          }`}
        >
          <Settings2 className="w-4 h-4" /> Director's Suite
        </button>
      </div>

      <div className="relative">
        <AnimatePresence mode="wait">
          {activeTab === 'story' ? (
            <motion.div 
              key="story-tab"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="glass-panel rounded-[2.5rem] p-12 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/5 blur-[120px] -z-10"></div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-10">
                  <div className="space-y-4 relative">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block px-1">Narrative Concept</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter production title..."
                      className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-6 focus:ring-2 focus:ring-red-500 outline-none transition-all text-white text-2xl font-bold placeholder:text-gray-800"
                    />
                  </div>

                  <div className="space-y-4 relative">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block px-1">Source Material (PDF / EPUB)</label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".pdf,.epub"
                      className="hidden"
                    />
                    <AnimatePresence mode="wait">
                      {!selectedFile ? (
                        <motion.button
                          key="upload-btn"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full bg-black/40 border-2 border-dashed border-white/5 rounded-[2.5rem] p-12 hover:border-red-500/40 hover:bg-red-500/5 transition-all group flex flex-col items-center gap-4"
                        >
                          <div className="w-20 h-20 bg-red-600/10 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform border border-red-500/10 shadow-[0_0_20px_rgba(220,38,38,0.1)]">
                            <FileText className="w-10 h-10 text-red-500" />
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-black text-white uppercase italic">Inject Script</p>
                            <p className="text-[9px] text-gray-600 uppercase tracking-widest mt-2 font-mono">Neural Extraction Protocol v4.0 Staged</p>
                          </div>
                        </motion.button>
                      ) : (
                        <motion.div
                          key="file-badge"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="w-full bg-red-600/10 border border-red-500/20 rounded-[2.5rem] p-8 flex items-center justify-between shadow-[0_15px_30px_rgba(220,38,38,0.1)]"
                        >
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/40">
                              <FileText className="w-8 h-8 text-white" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xl font-black text-white truncate max-w-[250px] uppercase">{selectedFile.name}</span>
                              <span className="text-[9px] text-red-400 font-mono tracking-widest uppercase">Buffer Loaded • {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>
                          </div>
                          <button onClick={removeFile} className="p-3 hover:bg-white/10 rounded-full text-gray-400 transition-colors"><X className="w-6 h-6" /></button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="space-y-10">
                  <div className="space-y-6">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block">Visual Art Direction</label>
                    <div className="grid grid-cols-2 gap-4">
                      {styles.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setStyle(s.id)}
                          className={`relative p-6 rounded-3xl border-2 transition-all group overflow-hidden ${
                            style === s.id 
                            ? 'bg-red-600 border-red-500 text-white shadow-[0_10px_30px_rgba(220,38,38,0.2)]' 
                            : 'bg-black/40 border-white/5 text-gray-500 hover:border-white/10'
                          }`}
                        >
                          <div className="relative z-10 flex flex-col items-start gap-1">
                            <div className="flex items-center gap-3">
                              <span className={`text-2xl transition-all ${style === s.id ? 'scale-110' : 'grayscale group-hover:grayscale-0'}`}>{s.icon}</span>
                              <span className="text-[10px] font-black uppercase tracking-widest italic">{s.label}</span>
                            </div>
                            <p className={`text-[8px] uppercase tracking-tighter mt-1 font-medium ${style === s.id ? 'text-white/70' : 'text-gray-600'}`}>{s.description}</p>
                          </div>
                          {style === s.id && (
                            <motion.div 
                              layoutId="style-active-glow"
                              className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" 
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="settings-tab"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full"
            >
              <SettingsPanel 
                settings={settings}
                onChange={setSettings}
                style={style}
                onStyleChange={setStyle}
                presets={presets}
                onSavePreset={handleSavePreset}
                onLoadPreset={handleLoadPreset}
                onDeletePreset={handleDeletePreset}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="mt-12 flex justify-center">
        <button
          onClick={() => {
            if (!title && !selectedFile) return;
            onGenerate(title.trim(), style, settings, selectedFile || undefined);
          }}
          disabled={isLoading || (!title.trim() && !selectedFile)}
          className="group relative w-full max-w-lg"
        >
          <div className="absolute inset-0 bg-red-600 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
          
          {isLoading && (
            <div className="overflow-hidden rounded-full bg-gray-900 h-1 w-full mb-6">
              <div
                style={{ width: `${loadingProgress}%` }}
                className="bg-red-600 h-full transition-all duration-500 ease-out rounded-full"
              />
            </div>
          )}

          <div className={`relative flex items-center justify-center gap-6 bg-red-600 text-white rounded-[2.5rem] px-12 py-8 transition-all shadow-[0_20px_50px_rgba(220,38,38,0.4)] border border-red-500/30 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-500 hover:-translate-y-2 hover:shadow-[0_30px_70px_rgba(220,38,38,0.6)] active:scale-[0.98]'
          }`}>
            {isLoading ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                    <Sparkles className="w-8 h-8" />
                  </motion.div>
                  <span className="text-2xl font-black uppercase tracking-widest italic">
                    {loadingStatus || 'Executing Pipeline...'}
                    {loadingProgress > 0 && <span className="ml-3 text-red-300">{loadingProgress}%</span>}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-2xl font-black uppercase tracking-widest italic">Ignite Production</span>
                  <ArrowRight className="w-8 h-8 group-hover:translate-x-4 transition-transform" />
                </>
              )}
          </div>
        </button>
      </div>
    </div>
  );
}
