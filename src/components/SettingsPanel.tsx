import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  Monitor, 
  Layers, 
  Globe, 
  Mic, 
  Cpu, 
  Zap, 
  Film, 
  Save, 
  Plus, 
  X,
  Smartphone,
  Maximize,
  Square,
  Sparkles,
  Music,
  Activity,
  CheckCircle2,
  AlertCircle,
  Database,
  Trash2,
  ChevronRight,
  ShieldCheck,
  Play,
  VolumeX,
  Volume2
} from 'lucide-react';
import { 
  ProductionSettings, 
  AspectRatio, 
  AIModel, 
  FrameRate, 
  OutputFormat,
  UserStylePreset,
  VisualStyle,
  AppLanguage
} from '../types';

interface SettingsPanelProps {
  settings: ProductionSettings;
  onChange: (settings: ProductionSettings) => void;
  style?: string;
  onStyleChange?: (style: string) => void;
  presets?: UserStylePreset[];
  onSavePreset?: (name: string) => void;
  onLoadPreset?: (preset: UserStylePreset) => void;
  onDeletePreset?: (id: string) => void;
  className?: string;
}

type Tab = 'AI Providers' | 'Audio Engine' | 'Render & Output' | 'System & Storage' | 'Presets';

export function SettingsPanel({
  settings,
  onChange,
  style,
  onStyleChange,
  presets = [],
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
  className = ""
}: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('AI Providers');
  const [newPresetName, setNewPresetName] = useState('');
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('BOOKMOTION_GEMINI_API_KEY') || '');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const handleSaveApiKey = () => {
    localStorage.setItem('BOOKMOTION_GEMINI_API_KEY', apiKey);
    setTestStatus('idle');
  };

  // Auto-save API key when it changes to prevent loss if user forgets to click Secure
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('BOOKMOTION_GEMINI_API_KEY', apiKey);
    }
  }, [apiKey]);

  const handleTestConnection = async () => {
    if (!apiKey) return;
    setTestStatus('testing');
    try {
      // Simulate API ping
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (response.ok) {
        setTestStatus('success');
      } else {
        setTestStatus('error');
      }
    } catch (err) {
      setTestStatus('error');
    }
  };

  const handleClearCache = () => {
    if (confirm("Are you sure you want to purge all cached project data? This cannot be undone.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const tabs: { id: Tab, icon: React.ReactNode }[] = [
    { id: 'AI Providers', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'Audio Engine', icon: <Mic className="w-4 h-4" /> },
    { id: 'Render & Output', icon: <Monitor className="w-4 h-4" /> },
    { id: 'System & Storage', icon: <Database className="w-4 h-4" /> },
    { id: 'Presets', icon: <Save className="w-4 h-4" /> },
  ];

  const updateSetting = (key: keyof ProductionSettings, value: any) => {
    onChange({ ...settings, [key]: value });
  };

  const updateAudioSetting = (key: keyof ProductionSettings['audio'], value: any) => {
    onChange({
      ...settings,
      audio: {
        ...settings.audio,
        [key]: value
      }
    });
  };

  const arabicVoices = [
    { id: 'ar-EG-SalmaNeural', label: 'Salma (Egypt)' },
    { id: 'ar-SA-ZariNeural', label: 'Zari (Saudi)' },
    { id: 'ar-SA-HamedNeural', label: 'Hamed (Saudi)' },
    { id: 'ar-AE-FatimaNeural', label: 'Fatima (UAE)' },
    { id: 'en-US-GuyNeural', label: 'Guy (US)' },
    { id: 'en-US-AriaNeural', label: 'Aria (US)' },
  ];

  return (
    <div className={`w-full max-w-6xl mx-auto flex gap-8 h-[700px] ${className}`}>
      {/* Professional Sidebar Navigation */}
      <aside className="w-72 glass-panel rounded-[2.5rem] p-6 flex flex-col gap-2 border-white/5 relative overflow-hidden shrink-0">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-red-600/5 to-transparent pointer-events-none" />
        
        <div className="px-4 py-6 mb-4">
          <h2 className="text-xl font-black tracking-tighter text-white uppercase italic">Director's Suite</h2>
          <p className="text-[9px] text-gray-500 font-mono tracking-widest uppercase mt-1">v4.0 Production Control</p>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all relative group ${
                activeTab === tab.id 
                  ? 'text-white' 
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className={`${activeTab === tab.id ? 'text-red-500' : 'text-gray-600 group-hover:text-red-400'} transition-colors`}>
                {tab.icon}
              </div>
              <span className="relative z-10 italic">{tab.id}</span>
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="active-sidebar-tab"
                  className="absolute inset-0 bg-red-600/10 border border-red-500/20 rounded-2xl shadow-[0_0_20px_rgba(220,38,38,0.1)]" 
                />
              )}
            </button>
          ))}
        </nav>

        <div className="mt-auto p-4 border-t border-white/5">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
             <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Neural Link Secure</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 glass-panel rounded-[2.5rem] p-12 border-white/5 relative overflow-hidden flex flex-col">
        {/* Decorative Ambience */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/5 blur-[120px] pointer-events-none" />
        
        <header className="mb-10 relative z-10">
          <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic">{activeTab}</h3>
          <p className="text-[10px] text-red-500 font-mono tracking-[0.3em] uppercase mt-2">Operational Parameters Stage 1</p>
        </header>

        <div className="flex-1 relative z-10 overflow-y-auto no-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-10"
            >
              {activeTab === 'AI Providers' && (
                <div className="space-y-10">
                  <div className="setting-card border-red-500/20 bg-red-600/[0.02]">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-600/20 rounded-2xl flex items-center justify-center text-red-500 border border-red-500/20 shadow-[0_0_20px_rgba(220,38,38,0.1)]">
                          <Zap className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-white uppercase italic">Google Gemini Hub</h4>
                          <p className="text-[9px] text-gray-500 uppercase font-mono">Core Generative Intelligence</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {testStatus === 'success' && <div className="flex items-center gap-2 text-green-500 text-[10px] font-black uppercase tracking-widest bg-green-500/10 px-3 py-1 rounded-lg border border-green-500/20"><CheckCircle2 className="w-3 h-3" /> Online</div>}
                        {testStatus === 'error' && <div className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest bg-red-500/10 px-3 py-1 rounded-lg border border-red-500/20"><AlertCircle className="w-3 h-3" /> Fault</div>}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <input 
                          type="password" 
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="GEMINI_API_KEY_SECURE_VAULT"
                          className="flex-1 bg-black/60 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-mono text-sm"
                        />
                        <button 
                          onClick={handleSaveApiKey}
                          className="bg-white/10 hover:bg-white/20 text-white px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border border-white/5"
                        >
                          Secure
                        </button>
                        <button 
                          onClick={handleTestConnection}
                          disabled={testStatus === 'testing' || !apiKey}
                          className="bg-red-600 hover:bg-red-500 text-white px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg disabled:opacity-50 flex items-center gap-2"
                        >
                          {testStatus === 'testing' ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                          Test Link
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Synthesis Model (Main)</label>
                      <select 
                        value={settings.aiModel}
                        onChange={(e) => updateSetting('aiModel', e.target.value as AIModel)}
                        className="w-full bg-black/60 border border-white/10 rounded-2xl px-5 py-4 text-[11px] font-bold text-white outline-none focus:ring-2 focus:ring-red-500 transition-all uppercase"
                      >
                        <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash Lite</option>
                      </select>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Storyboard Specialist</label>
                      <select 
                        value={settings.aiModelStoryboard}
                        onChange={(e) => updateSetting('aiModelStoryboard', e.target.value as AIModel)}
                        className="w-full bg-black/60 border border-white/10 rounded-2xl px-5 py-4 text-[11px] font-bold text-white outline-none focus:ring-2 focus:ring-red-500 transition-all uppercase"
                      >
                        <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash Lite</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Audio Engine' && (
                <div className="space-y-10">
                  <div className="flex items-center justify-between bg-black/40 border border-white/5 rounded-[2rem] p-8">
                    <div>
                      <h4 className="text-[11px] font-black text-white uppercase tracking-widest italic">Neural Audio Pipeline</h4>
                      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tight mt-1">Master Engine Bypass</p>
                    </div>
                    <button 
                      onClick={() => updateAudioSetting('enabled', !settings.audio.enabled)}
                      className={`w-14 h-7 rounded-full relative transition-all duration-500 ${settings.audio.enabled ? 'bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.4)]' : 'bg-gray-800'}`}
                    >
                      <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all duration-300 ${settings.audio.enabled ? 'left-8' : 'left-1'}`} />
                    </button>
                  </div>

                  {!settings.audio.enabled && (
                    <div className="bg-red-900/10 border border-red-500/20 rounded-2xl p-6 flex items-center gap-4 animate-pulse">
                      <VolumeX className="w-5 h-5 text-red-500" />
                      <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">Audio Pipeline Offline: Silent Film Mode Active</p>
                    </div>
                  )}

                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-12 transition-all duration-500 ${settings.audio.enabled ? 'opacity-100' : 'opacity-20 pointer-events-none grayscale'}`}>
                    <div className="space-y-6">
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Edge-TTS Neural Presence</label>
                      <div className="grid grid-cols-1 gap-3">
                        {arabicVoices.map((voice) => (
                          <button
                            key={voice.id}
                            onClick={() => updateAudioSetting('defaultVoice', voice.id)}
                            className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${
                              settings.audio.defaultVoice === voice.id 
                                ? 'bg-red-600/10 border-red-500/50 text-white' 
                                : 'bg-black/40 border-white/5 text-gray-600 hover:bg-white/5'
                            }`}
                          >
                            <span className="text-[11px] font-black uppercase italic tracking-tight">{voice.label}</span>
                            {settings.audio.defaultVoice === voice.id ? <CheckCircle2 className="w-4 h-4 text-red-500" /> : <Play className="w-3 h-3 opacity-20" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-12 bg-black/40 border border-white/5 rounded-[2.5rem] p-10">
                      <div className="space-y-6">
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Speech Rate Velocity</label>
                          <span className="text-red-500 font-mono text-xs font-bold">{settings.audio.speed}x</span>
                        </div>
                        <input 
                          type="range" 
                          min="0.5" 
                          max="2.0" 
                          step="0.1"
                          value={settings.audio.speed}
                          onChange={(e) => updateAudioSetting('speed', parseFloat(e.target.value))}
                          className="custom-slider w-full" 
                        />
                        <div className="flex justify-between text-[8px] text-gray-600 font-black uppercase tracking-[0.2em]">
                          <span>Slow Motion</span>
                          <span>Default</span>
                          <span>Overdrive</span>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vocal Pitch Spectrum</label>
                          <span className="text-red-500 font-mono text-xs font-bold">{settings.audio.pitch > 0 ? '+' : ''}{settings.audio.pitch}Hz</span>
                        </div>
                        <input 
                          type="range" 
                          min="-20" 
                          max="20" 
                          value={settings.audio.pitch}
                          onChange={(e) => updateAudioSetting('pitch', parseInt(e.target.value))}
                          className="custom-slider w-full" 
                        />
                        <div className="flex justify-between text-[8px] text-gray-600 font-black uppercase tracking-[0.2em]">
                          <span>Deep Bass</span>
                          <span>Neutral</span>
                          <span>High Treble</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Render & Output' && (
                <div className="space-y-12">
                  <div className="grid grid-cols-2 gap-12">
                    <div className="space-y-8">
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Cinema Aspect Ratio</label>
                      <div className="flex gap-4">
                        {(['16:9', '9:16'] as AspectRatio[]).map((ar) => (
                          <button
                            key={ar}
                            onClick={() => updateSetting('aspectRatio', ar)}
                            className={`flex-1 py-12 rounded-[2rem] border transition-all flex flex-col items-center gap-6 ${
                              settings.aspectRatio === ar 
                                ? 'bg-red-600/10 border-red-500/50 text-white shadow-2xl' 
                                : 'bg-black/40 border-white/5 text-gray-600 hover:bg-white/5'
                            }`}
                          >
                            <div className={`border-2 rounded transition-all ${settings.aspectRatio === ar ? 'border-red-500 bg-red-600/20' : 'border-gray-800'}`} style={{ width: ar === '16:9' ? '48px' : '27px', height: ar === '16:9' ? '27px' : '48px' }} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{ar === '16:9' ? 'YouTube / TV' : 'Shorts / TikTok'}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-10">
                      <div className="space-y-6">
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Ken Burns Zoom Intensity</label>
                          <span className="text-red-500 font-mono text-xs font-bold">LVL {settings.zoomIntensity}</span>
                        </div>
                        <input 
                          type="range" 
                          min="1" 
                          max="10" 
                          value={settings.zoomIntensity}
                          onChange={(e) => updateSetting('zoomIntensity', parseInt(e.target.value))}
                          className="custom-slider w-full" 
                        />
                        <div className="flex justify-between text-[8px] text-gray-600 font-black uppercase tracking-[0.2em]">
                          <span>Static</span>
                          <span>Medium</span>
                          <span>Aggressive</span>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-4">Neural Creativity (Temp)</label>
                        <input 
                          type="range" 
                          min="0" 
                          max="1" 
                          step="0.1" 
                          value={settings.temperature}
                          onChange={(e) => updateSetting('temperature', parseFloat(e.target.value))}
                          className="custom-slider w-full" 
                        />
                        <div className="flex justify-between text-[8px] text-gray-600 font-black uppercase tracking-[0.2em]">
                          <span>Robot</span>
                          <span>Creative</span>
                          <span>Dreamer</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'System & Storage' && (
                <div className="space-y-12">
                  <div className="setting-card border-white/5 bg-white/[0.01]">
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6">Production Export Path</h4>
                    <div className="flex gap-4">
                      <input 
                        type="text" 
                        value={settings.outputDirectory}
                        onChange={(e) => updateSetting('outputDirectory', e.target.value)}
                        className="flex-1 bg-black/60 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-1 focus:ring-red-500 outline-none font-mono text-[11px]"
                      />
                      <button className="bg-white/5 hover:bg-white/10 text-white px-6 rounded-2xl border border-white/5">
                        <Globe className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="setting-card border-red-500/10 bg-red-600/[0.01]">
                       <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-6">Neural Cache Management</h4>
                       <p className="text-xs text-gray-500 mb-8 leading-relaxed font-medium uppercase tracking-tight">Purge temporary workspace files and AI generated tokens to reclaim local storage capacity.</p>
                       <button 
                         onClick={handleClearCache}
                         className="w-full flex items-center justify-center gap-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                       >
                         <Trash2 className="w-4 h-4" /> Clear All Local Data
                       </button>
                    </div>

                    <div className="setting-card border-white/5 bg-white/[0.01]">
                       <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6">Export Specification</h4>
                       <div className="space-y-4">
                          <div className="flex justify-between items-center py-2 border-b border-white/5">
                             <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tight">Default Container</span>
                             <span className="text-[10px] font-black text-white uppercase">{settings.outputFormat}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-white/5">
                             <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tight">Target Frame Rate</span>
                             <span className="text-[10px] font-black text-white uppercase">{settings.frameRate} FPS</span>
                          </div>
                          <div className="flex justify-between items-center py-2">
                             <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tight">Rendering Quality</span>
                             <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">{settings.quality}</span>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Presets' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xl font-black text-white tracking-tight uppercase italic">Configuration Presets</h4>
                      <p className="text-[10px] text-gray-500 tracking-widest uppercase mt-1">Snapshot of current engine state</p>
                    </div>
                    <button 
                      onClick={() => setIsSavingPreset(true)}
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl"
                    >
                      <Plus className="w-4 h-4" /> Stash Preset
                    </button>
                  </div>

                  <AnimatePresence>
                    {isSavingPreset && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-red-600/5 border border-red-500/20 p-8 rounded-[2rem] flex gap-4"
                      >
                        <input 
                          type="text" 
                          value={newPresetName}
                          onChange={(e) => setNewPresetName(e.target.value)}
                          placeholder="Name your engine state..."
                          className="flex-1 bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:ring-1 focus:ring-red-500 outline-none"
                        />
                        <button 
                          onClick={() => {
                            if (newPresetName && onSavePreset) {
                              onSavePreset(newPresetName);
                              setNewPresetName('');
                              setIsSavingPreset(false);
                            }
                          }}
                          className="bg-red-600 text-white px-10 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg"
                        >
                          Commit
                        </button>
                        <button onClick={() => setIsSavingPreset(false)} className="p-4 text-gray-500 hover:text-white"><X className="w-6 h-6" /></button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {presets.length > 0 ? presets.map((p) => (
                      <div key={p.id} className="bg-black/40 border border-white/5 p-8 rounded-[2rem] flex items-center justify-between group hover:border-red-500/20 transition-all">
                        <div className="flex items-center gap-6">
                          <div className="w-14 h-14 bg-red-600/10 rounded-2xl flex items-center justify-center text-red-500 border border-red-500/10">
                            <Save className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-base font-black text-white uppercase italic tracking-tighter">{p.name}</p>
                            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-mono mt-1">{p.settings.aiModel} • {p.settings.aspectRatio}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => onLoadPreset && onLoadPreset(p)}
                            className="bg-white/5 hover:bg-white/10 text-white p-3 rounded-xl border border-white/5 transition-all"
                            title="Recall State"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                          <button onClick={() => onDeletePreset && onDeletePreset(p.id)} className="p-3 text-gray-700 hover:text-red-500"><Trash2 className="w-5 h-5" /></button>
                        </div>
                      </div>
                    )) : (
                      <div className="col-span-full py-24 border border-dashed border-white/10 rounded-[3rem] text-center bg-white/[0.01]">
                         <Save className="w-12 h-12 text-gray-800 mx-auto mb-6" />
                         <p className="text-gray-700 text-[10px] font-black uppercase tracking-[0.3em]">No production snapshots recorded</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function LoaderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
