/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// BookMotion Narrative Studio - Version 4.0.1 - RECOVERY_DEPLOY
import React, { useState, useEffect, useRef, Component, ErrorInfo, ReactNode } from 'react';
import { MovieForm } from './components/MovieForm';
import { SceneCard } from './components/SceneCard';
import { CinematicPreview } from './components/CinematicPreview';
import { SettingsPanel } from './components/SettingsPanel';
import { generateMovieSummary, generateStoryboard, generateSceneImage, generateCharacterDesign } from './services/gemini';
import { MovieProject, Scene, SceneStatus, VisualStyle, ProductionSettings } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Film, Download, Share2, Sparkles, Wand2, AlertCircle, X, Monitor, Layers, Layout, Users, Settings, Package, ChevronLeft, ChevronRight, Menu, PlayCircle, Loader2, RefreshCw } from 'lucide-react';
import { extractTextFromPdf, extractTextFromEpub } from './lib/documentUtils';
import JSZip from 'jszip';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: (error: Error) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Critical UI Failure:", error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback(this.state.error);
    }
    return this.props.children;
  }
}

export default function App() {
  const [project, setProject] = useState<MovieProject | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeProjectTab, setActiveProjectTab] = useState<'storyboard' | 'characters' | 'settings' | 'assets' | 'preview'>('storyboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleStartProduction = async (title: string, style: string, settings: ProductionSettings, pdfFile?: File) => {
    const key = localStorage.getItem('BOOKMOTION_GEMINI_API_KEY');
    if (!key) {
      setError("Neural Pipeline Error: No API Key found. Please configure your GEMINI_API_KEY in the Director Suite > Engine.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingProgress(5);
    setLoadingStatus('Initializing Engine...');
    try {
      let contentToAnalyze = title;
      
      console.log("[App] Starting Production Pipeline...");
      console.log("[App] API Key Source:", localStorage.getItem('BOOKMOTION_GEMINI_API_KEY') ? 'LocalStorage' : 'Env');
      
      if (pdfFile) {
        setLoadingStatus('Extracting Source Material...');
        console.log("[App] Extracting text from file:", pdfFile.name);
        try {
          if (pdfFile.name.toLowerCase().endsWith('.epub')) {
            contentToAnalyze = await extractTextFromEpub(pdfFile);
          } else {
            contentToAnalyze = await extractTextFromPdf(pdfFile);
          }
          console.log("[App] Extraction successful, length:", contentToAnalyze.length);
          setLoadingProgress(15);
        } catch (docErr) {
          console.error("[App] Extraction Error:", docErr);
          setError(docErr instanceof Error ? docErr.message : "حدث خطأ أثناء قراءة الملف");
          setIsLoading(false);
          return;
        }
      }

      setLoadingStatus('Analyzing Narrative Structure...');
      console.log("[App] Calling generateMovieSummary...");
      const summary = await generateMovieSummary(contentToAnalyze, settings);
      console.log("[App] Summary generated.");
      setLoadingProgress(35);
      
      setLoadingStatus('Engineering Character DNA...');
      console.log("[App] Calling generateCharacterDesign...");
      const characterDefinitions = await generateCharacterDesign(summary, settings);
      console.log("[App] Character design generated.");
      setLoadingProgress(65);
      
      setLoadingStatus(`Rendering Storyboard (${settings.sceneDensity} Segments)...`);
      console.log("[App] Calling generateStoryboard...");
      const rawScenes = await generateStoryboard(summary, style, characterDefinitions, settings);
      console.log("[App] Storyboard generated, scenes:", rawScenes.length);
      setLoadingProgress(85);
      
      const scenes = rawScenes.map(scene => ({
        ...scene,
        voiceProfile: settings.audio.defaultVoice,
        voiceSpeed: settings.audio.speed,
        voicePitch: settings.audio.pitch,
        status: SceneStatus.PENDING
      }));

      setLoadingProgress(100);
      setProject({
        id: `proj-${Date.now()}`,
        title,
        originalIdea: title,
        summary,
        style,
        settings,
        scenes,
        characterDefinitions,
        createdAt: Date.now(),
      });
    } catch (err) {
      console.error("Neural Pipeline Failure:", err);
      if (err instanceof Error) {
        setError(`Engine Fault: ${err.message}`);
      } else {
        setError("فشل المحرك في تحليل القصة. يرجى المحاولة مرة أخرى باستخدام نص مختلف.");
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => setLoadingProgress(0), 800);
    }
  };

  const handleExportBundle = async () => {
    if (!project) return;
    setIsExporting(true);
    try {
      const zip = new JSZip();
      zip.file("project.json", JSON.stringify(project, null, 2));

      // Add images
      const imgFolder = zip.folder("scenes");
      for (const scene of project.scenes) {
        if (scene.imageUrl && scene.imageUrl.startsWith('data:image')) {
          const base64Data = scene.imageUrl.split(',')[1];
          imgFolder?.file(`scene-${scene.order + 1}.png`, base64Data, { base64: true });
        }
      }

      // Add script
      let scriptContent = `BOOKMOTION PRODUCTION SCRIPT: ${project.title}\n`;
      scriptContent += `STYLE: ${project.style} | RATIO: ${project.settings.aspectRatio}\n`;
      scriptContent += `====================================================\n\n`;
      
      project.scenes.forEach((s, i) => {
        scriptContent += `[Scene ${i + 1} - ${s.timecode}]\n`;
        scriptContent += `VISUAL: ${s.description}\n\n`;
        scriptContent += `Narration:\n${s.narration}\n\n`;
        scriptContent += `---\n\n`;
      });
      
      zip.file("script.txt", scriptContent);

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.title.replace(/\s+/g, '_')}-master-bundle.zip`;
      a.click();
    } catch (err) {
      console.error("Export failed", err);
      setError("فشل تصدير الحزمة. يرجى التأكد من اكتمال توليد الصور.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleRegenerateScene = async (sceneId: string) => {
    if (!project) return;
    const scene = project.scenes.find(s => s.id === sceneId);
    if (!scene) return;

    // ضع المشهد على GENERATING
    setProject(prev => prev ? {
      ...prev,
      scenes: prev.scenes.map(s => s.id === sceneId ? { ...s, status: SceneStatus.GENERATING } : s)
    } : null);

    try {
      const newScenes = await generateStoryboard(
        project.summary,
        project.style,
        project.characterDefinitions || '',
        { ...project.settings, sceneDensity: 1 }
      );
      if (newScenes.length > 0) {
        const newData = newScenes[0];
        setProject(prev => prev ? {
          ...prev,
          scenes: prev.scenes.map(s => s.id === sceneId ? {
            ...s,
            description: newData.description,
            narration: newData.narration,
            visualPrompt: newData.visualPrompt,
            motionHint: newData.motionHint,
            musicPrompt: newData.musicPrompt,
            soundEffect: newData.soundEffect,
            transitionEffect: newData.transitionEffect,
            imageUrl: undefined,
            status: SceneStatus.PENDING
          } : s)
        } : null);
      }
    } catch (error) {
      setProject(prev => prev ? {
        ...prev,
        scenes: prev.scenes.map(s => s.id === sceneId ? { ...s, status: SceneStatus.FAILED } : s)
      } : null);
    }
  };

  const handleExportScript = () => {
    if (!project) return;
    const existing = document.getElementById('print-script');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.id = 'print-script';
    div.innerHTML = `
      <h1>${project.title}</h1>
      <p class="meta">${project.style} • ${project.settings.aspectRatio} • ${project.scenes.length} Scenes</p>
      <div class="summary"><h2>Story Summary</h2><p>${project.summary}</p></div>
      ${project.scenes.map((s, i) => `
        <div class="scene-block">
          <h3>Scene ${i + 1} — ${s.timecode}</h3>
          <p class="label">Description</p><p>${s.description}</p>
          <p class="label">Narration</p><p class="narration" dir="${/[\u0600-\u06FF]/.test(s.narration) ? 'rtl' : 'ltr'}">${s.narration}</p>
          <p class="label">Visual Prompt</p><p class="prompt">${s.visualPrompt}</p>
        </div>
      `).join('')}
    `;
    document.body.appendChild(div);
    window.print();
    setTimeout(() => div.remove(), 1000);
  };

  const handleGenerateImage = async (sceneId: string) => {
    if (!project) return;

    setProject(prev => prev ? {
      ...prev,
      scenes: prev.scenes.map(s => s.id === sceneId ? { ...s, status: SceneStatus.GENERATING } : s)
    } : null);

    try {
      const scene = project.scenes.find(s => s.id === sceneId);
      if (!scene) return;

      const imageUrl = await generateSceneImage(
        scene,
        project.style as VisualStyle,
        project.settings.aspectRatio,
        project.characterDefinitions
      );
      
      setProject(prev => prev ? {
        ...prev,
        scenes: prev.scenes.map(s => 
          s.id === sceneId ? { ...s, imageUrl, status: SceneStatus.COMPLETED } : s
        )
      } : null);
    } catch (error) {
      console.error("Image generation failed", error);
      setProject(prev => prev ? {
        ...prev,
        scenes: prev.scenes.map(s => s.id === sceneId ? { ...s, status: SceneStatus.FAILED } : s)
      } : null);
    }
  };

  const handleGenerateAllImages = async () => {
    if (!project) return;
    for (const scene of project.scenes) {
      if (!scene.imageUrl) {
        await handleGenerateImage(scene.id);
      }
    }
  };

  const handleUpdateScene = (sceneId: string, updates: Partial<Scene>) => {
    setProject(prev => prev ? {
      ...prev,
      scenes: prev.scenes.map(s => s.id === sceneId ? { ...s, ...updates } : s)
    } : null);
  };

  const handleReorderScenes = (newScenes: Scene[]) => {
    setProject(prev => prev ? { ...prev, scenes: newScenes } : null);
  };

  const handleAddScene = () => {
    if (!project) return;
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      order: project.scenes.length,
      timecode: '00:00',
      description: 'New cinematic scene...',
      narration: '',
      visualPrompt: 'Cinematic wide shot...',
      status: SceneStatus.PENDING,
      holdDuration: 4,
      transitionDuration: 1,
      transitionEffect: 'Fade',
      voiceProfile: project.settings.audio.defaultVoice,
      voiceSpeed: project.settings.audio.speed,
      voicePitch: project.settings.audio.pitch
    };
    setProject(prev => prev ? { ...prev, scenes: [...prev.scenes, newScene] } : null);
  };

  const handleDeleteScene = (sceneId: string) => {
    setProject(prev => prev ? {
      ...prev,
      scenes: prev.scenes.filter(s => s.id !== sceneId)
    } : null);
  };

  const handleUpdateSettings = (settings: ProductionSettings) => {
    setProject(prev => prev ? { ...prev, settings } : null);
  };

  const handleUpdateStyle = (style: string) => {
    setProject(prev => prev ? { ...prev, style } : null);
  };

  return (
    <ErrorBoundary 
      fallback={(err) => (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-10 text-center">
          <div className="w-24 h-24 bg-red-600/20 rounded-[2.5rem] flex items-center justify-center text-red-500 mb-8 border border-red-500/30 shadow-[0_0_50px_rgba(220,38,38,0.2)]">
            <AlertCircle className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4">Neural Engine Crash</h1>
          <p className="text-gray-500 font-mono text-[10px] uppercase tracking-widest mb-10 max-w-lg">
            A critical fault occurred during UI synthesis. This is usually caused by invalid data structures or missing neural assets.
          </p>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-10 max-w-2xl w-full text-left">
            <p className="text-red-500 font-mono text-[10px] uppercase tracking-widest mb-2">Technical Error Diagnostic:</p>
            <p className="text-gray-400 font-mono text-xs">{err.message}</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-10 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl italic"
          >
            Reboot Core
          </button>
        </div>
      )}
    >
      <div className="bg-[#050505] min-h-screen text-slate-200 font-sans relative overflow-x-hidden bg-grid">
      <div className="max-w-[1600px] mx-auto px-6 py-8 relative z-10">
        <header className="flex items-center justify-between mb-16 border-b border-white/5 pb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20 group cursor-pointer hover:scale-105 transition-transform">
              <Film className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">BookMotion <span className="text-red-500">PRO</span></h2>
              <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">Director's Production Suite</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center bg-white/5 rounded-full px-5 py-2.5 border border-white/5 backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-red-500 mr-2 animate-pulse" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Neural Director Active</span>
            </div>
          </div>
        </header>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <div className="bg-red-600/10 border border-red-600/20 rounded-[2rem] p-8 flex items-center justify-between gap-6 shadow-[0_15px_30px_rgba(220,38,38,0.1)]">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-red-600/20 rounded-2xl flex items-center justify-center border border-red-500/20">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-widest italic">Engine Fault Detected</h4>
                    <p className="text-xs text-red-400/70 mt-1">{error}</p>
                    {error.includes("API Key") && (
                      <div className="mt-4 flex gap-4">
                        <button 
                          onClick={() => {
                            // If project exists, go to project settings
                            if (project) setActiveProjectTab('settings');
                            // If no project, we need to tell MovieForm to switch to settings
                            // We'll handle this by passing a prop to MovieForm
                            window.dispatchEvent(new CustomEvent('switch-to-settings'));
                          }}
                          className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2"
                        >
                          Navigate to Director Suite <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setError(null)}
                  className="p-3 hover:bg-white/5 rounded-full transition-colors text-gray-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {!project ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <MovieForm 
                onGenerate={handleStartProduction} 
                isLoading={isLoading} 
                loadingStatus={loadingStatus}
                loadingProgress={loadingProgress}
              />
            </motion.div>
          ) : (
            <motion.div
              key="project"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-10 relative items-start"
            >
              {/* Sidebar Navigation */}
              <aside className={`sticky top-8 transition-all duration-500 ease-[0.22, 1, 0.36, 1] ${isSidebarCollapsed ? 'w-24' : 'w-80'} h-[calc(100vh-12rem)] flex flex-col gap-6 z-30`}>
                <div className="glass-panel p-5 rounded-[2.5rem] flex flex-col h-full border-white/5 relative group/sidebar">
                  <button 
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="absolute -right-3 top-12 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-600/40 z-10 opacity-0 group-hover/sidebar:opacity-100 transition-all hover:scale-110"
                  >
                    {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                  </button>

                  <div className="flex flex-col gap-3 flex-1">
                    <SidebarItem 
                      icon={<Layout className="w-5 h-5" />} 
                      label="Storyboard" 
                      active={activeProjectTab === 'storyboard'} 
                      collapsed={isSidebarCollapsed}
                      onClick={() => setActiveProjectTab('storyboard')}
                    />
                    <SidebarItem 
                      icon={<PlayCircle className="w-5 h-5" />} 
                      label="Cinematic Preview" 
                      active={activeProjectTab === 'preview'} 
                      collapsed={isSidebarCollapsed}
                      onClick={() => setActiveProjectTab('preview')}
                    />
                    <SidebarItem 
                      icon={<Users className="w-5 h-5" />} 
                      label="Character DNA" 
                      active={activeProjectTab === 'characters'} 
                      collapsed={isSidebarCollapsed}
                      onClick={() => setActiveProjectTab('characters')}
                    />
                    <SidebarItem 
                      icon={<Settings className="w-5 h-5" />} 
                      label="Director Suite" 
                      active={activeProjectTab === 'settings'} 
                      collapsed={isSidebarCollapsed}
                      onClick={() => setActiveProjectTab('settings')}
                    />
                    <SidebarItem 
                      icon={<Package className="w-5 h-5" />} 
                      label="Production Assets" 
                      active={activeProjectTab === 'assets'} 
                      collapsed={isSidebarCollapsed}
                      onClick={() => setActiveProjectTab('assets')}
                    />
                  </div>

                  <div className={`mt-auto pt-6 border-t border-white/5 space-y-4 ${isSidebarCollapsed ? 'items-center' : ''}`}>
                    <button 
                      onClick={() => setProject(null)}
                      className={`w-full flex items-center gap-4 p-5 rounded-2xl text-gray-500 hover:text-white hover:bg-white/5 transition-all font-black text-[10px] uppercase tracking-[0.2em] italic ${isSidebarCollapsed ? 'justify-center' : ''}`}
                    >
                      <Wand2 className="w-5 h-5" />
                      {!isSidebarCollapsed && <span>New Injection</span>}
                    </button>
                  </div>
                </div>
              </aside>

              {/* Main Content Area */}
              <div className="flex-1 space-y-12 min-w-0">
                {/* Compact Project Header */}
                <div className="flex items-center justify-between gap-10 pb-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <span className="px-3 py-1 bg-red-600/10 text-red-500 rounded-lg text-[9px] font-black tracking-widest uppercase border border-red-500/20 italic">Production Engine Active</span>
                      <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">{project.title}</h1>
                    </div>
                    <div className="flex items-center gap-6 text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                       <span className="flex items-center gap-2"><Sparkles className="w-3 h-3 text-red-600" /> {project.style} Style</span>
                       <span className="w-1.5 h-1.5 bg-gray-800 rounded-full"></span>
                       <span className="flex items-center gap-2"><Monitor className="w-3 h-3 text-gray-600" /> {project.settings.aspectRatio} Cinema</span>
                       <span className="w-1.5 h-1.5 bg-gray-800 rounded-full"></span>
                       <span className="flex items-center gap-2"><Layers className="w-3 h-3 text-gray-600" /> {project.scenes.length} Sequences</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <button className="p-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 transition-all group">
                      <Share2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    </button>
                    <button 
                      onClick={handleExportBundle}
                      disabled={isExporting}
                      className="bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-[0_15px_30px_rgba(220,38,38,0.3)] transition-all hover:-translate-y-1 disabled:opacity-50"
                    >
                      {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />} 
                      {isExporting ? 'Exporting...' : 'Export Master Bundle'}
                    </button>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {activeProjectTab === 'storyboard' && (
                    <motion.div
                      key="storyboard"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-12"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic">Interactive Storyboard</h3>
                          <p className="text-[10px] text-gray-500 mt-2 font-mono uppercase tracking-[0.2em]">Neural Sequence Visualizer v4.0</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={handleAddScene}
                            className="bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border border-red-500/20 italic"
                          >
                            + Insert Sequence
                          </button>
                          <button 
                            onClick={handleGenerateAllImages}
                            className="bg-white hover:bg-gray-200 text-black px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 shadow-2xl hover:-translate-y-1"
                          >
                            <Sparkles className="w-4 h-4" /> Render All Frames
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                        {project.scenes.map((scene) => (
                          <SceneCard 
                            key={scene.id}
                            scene={scene} 
                            aspectRatio={project.settings.aspectRatio}
                            onGenerateImage={handleGenerateImage}
                            onUpdateScene={handleUpdateScene}
                            onDeleteScene={handleDeleteScene}
                            onRegenerateScene={handleRegenerateScene}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {activeProjectTab === 'preview' && (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <CinematicPreview 
                        scenes={project.scenes} 
                        aspectRatio={project.settings.aspectRatio} 
                        settings={project.settings}
                        onUpdateScene={handleUpdateScene}
                        onReorderScenes={handleReorderScenes}
                        onAddScene={handleAddScene}
                      />
                    </motion.div>
                  )}

                  {activeProjectTab === 'characters' && (
                    <motion.div
                      key="characters"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="max-w-5xl space-y-12"
                    >
                      <div className="glass-panel p-16 rounded-[3rem] relative overflow-hidden border-red-500/10">
                        <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none">
                          <Users className="w-96 h-96 text-red-500" />
                        </div>
                        
                        <div className="relative z-10 space-y-10">
                          <div>
                            <h3 className="text-4xl font-black text-white tracking-tighter uppercase italic mb-3">Character DNA Blueprint</h3>
                            <p className="text-[10px] text-red-500 font-mono tracking-[0.3em] uppercase">Visual Storytelling Consistency Protocol</p>
                          </div>

                          <div className="bg-black/60 border border-white/5 rounded-[2.5rem] p-12 shadow-2xl">
                            <p className="text-xl text-gray-300 leading-relaxed font-serif italic whitespace-pre-wrap" dir="rtl">
                              {project.characterDefinitions || "System still analyzing character traits for visual stability..."}
                            </p>
                          </div>

                          <div className="grid grid-cols-3 gap-8">
                            <div className="p-8 bg-red-600/5 border border-red-500/20 rounded-3xl group hover:bg-red-600/10 transition-colors">
                              <h5 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3">Facial Geometry</h5>
                              <p className="text-[11px] text-gray-500 font-bold uppercase tracking-tighter">Neural Consistency Active</p>
                            </div>
                            <div className="p-8 bg-orange-600/5 border border-orange-500/20 rounded-3xl group hover:bg-orange-600/10 transition-colors">
                              <h5 className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-3">Attire Mapping</h5>
                              <p className="text-[11px] text-gray-500 font-bold uppercase tracking-tighter">Persistent Aesthetic</p>
                            </div>
                            <div className="p-8 bg-blue-600/5 border border-blue-500/20 rounded-3xl group hover:bg-blue-600/10 transition-colors">
                              <h5 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3">Vocal Profile</h5>
                              <p className="text-[11px] text-gray-500 font-bold uppercase tracking-tighter">Harmonic Stability</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeProjectTab === 'settings' && (
                    <motion.div
                      key="settings"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="w-full"
                    >
                      <SettingsPanel 
                        settings={project.settings}
                        onChange={handleUpdateSettings}
                        style={project.style}
                        onStyleChange={handleUpdateStyle}
                      />
                    </motion.div>
                  )}

                  {activeProjectTab === 'assets' && (
                    <motion.div
                      key="assets"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-10"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <AssetCard 
                          icon={<Layers className="w-7 h-7 text-red-500" />}
                          title="Image Sequence"
                          description="Master resolution cinematic frames exported for individual post-production color grading."
                          actionText="Export Frames"
                          color="red"
                        />
                        <AssetCard 
                          icon={<Settings className="w-7 h-7 text-orange-500" />}
                          title="JSON Manifest"
                          description="Technical metadata containing neural prompts, engine states, and scene architecture."
                          actionText="Download JSON"
                          color="orange"
                        />
                        <AssetCard 
                          icon={<Monitor className="w-7 h-7 text-blue-500" />}
                          title="Directing Script"
                          description="Complete cinematic breakdown including AI narration, motion hints, and transition data."
                          actionText="Export Script"
                          color="blue"
                          onClick={handleExportScript}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-15%] right-[-10%] w-[50%] h-[50%] bg-red-600/5 blur-[160px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-15%] left-[-10%] w-[50%] h-[50%] bg-orange-600/5 blur-[160px] rounded-full"></div>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick, collapsed }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, collapsed: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-5 p-5 rounded-3xl transition-all relative group ${
        active 
        ? 'text-white' 
        : 'text-gray-500 hover:text-white hover:bg-white/5'
      }`}
    >
      <div className={`${active ? 'text-red-500' : 'group-hover:text-red-400'} transition-colors relative z-10`}>
        {icon}
      </div>
      
      {!collapsed && (
        <span className="text-[10px] font-black uppercase tracking-[0.2em] truncate relative z-10 italic">{label}</span>
      )}

      {collapsed && (
        <div className="absolute left-full ml-6 px-4 py-2.5 bg-neutral-900 border border-red-500/30 rounded-xl text-white text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 whitespace-nowrap shadow-[0_10px_30px_rgba(220,38,38,0.2)]">
          {label}
        </div>
      )}

      {active && (
        <motion.div 
          layoutId="active-nav-bg"
          className="absolute inset-0 bg-white/5 border border-white/10 rounded-3xl z-0"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      
      {active && (
        <div className="absolute left-0 w-1 h-6 bg-red-600 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
      )}
    </button>
  );
}

function AssetCard({ icon, title, description, actionText, color, onClick }: { icon: React.ReactNode, title: string, description: string, actionText: string, color: 'red' | 'orange' | 'blue', onClick?: () => void }) {
  const colorClasses = {
    red: 'bg-red-600/10 border-red-500/20 text-red-500 shadow-red-600/10',
    orange: 'bg-orange-600/10 border-orange-500/20 text-orange-500 shadow-orange-600/10',
    blue: 'bg-blue-600/10 border-blue-500/20 text-blue-500 shadow-blue-600/10'
  };

  return (
    <div className="glass-panel p-10 rounded-[2.5rem] space-y-6 group hover:border-white/10 transition-all">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg border ${colorClasses[color]}`}>
        {icon}
      </div>
      <div>
        <h4 className="font-black text-white text-xl uppercase italic tracking-tight">{title}</h4>
        <p className="text-xs text-gray-500 mt-3 leading-relaxed font-medium uppercase tracking-tight">{description}</p>
      </div>
      <button 
        onClick={onClick}
        className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 group-hover:gap-4 ${
        color === 'red' ? 'text-red-500 hover:text-red-400' : color === 'orange' ? 'text-orange-500 hover:text-orange-400' : 'text-blue-500 hover:text-blue-400'
      }`}>
        {actionText} <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
