/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type VisualStyle = 'Anime' | '3D Render' | 'Cinematic' | 'Digital Art' | 'Cyberpunk' | 'Noir';

export type AspectRatio = '16:9' | '9:16' | '1:1';

export type OutputFormat = 'mp4' | 'mov' | 'webm';

export type FrameRate = 24 | 30 | 60;

export type AppLanguage = 'en' | 'ar' | 'es' | 'fr';

export type AIModel = 'gemini-3.1-flash';

export interface ProductionSettings {
  projectTitle: string;
  language: AppLanguage;
  outputFormat: OutputFormat;
  aspectRatio: AspectRatio;
  style: string;
  quality: 'Standard' | 'High' | 'Ultra';
  frameRate: FrameRate;
  aiModel: AIModel;
  aiModelStoryboard: AIModel;
  temperature: number;
  sceneDensity: number;
  zoomIntensity: number;
  outputDirectory: string;
  // Audio settings structured for open-source engines like Edge-TTS
  audio: {
    enabled: boolean;
    defaultVoice: string;
    pitch: number; 
    speed: number;
    backgroundMusic: boolean;
  };
}

export interface UserStylePreset {
  id: string;
  name: string;
  style: VisualStyle;
  settings: ProductionSettings;
}

export enum SceneStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export type TransitionEffect = 'Fade' | 'Wipe' | 'Dissolve' | 'Cut' | 'Zoom' | 'Cross';

export interface Scene {
  id: string;
  order: number;
  timecode: string;
  description: string;
  visualPrompt: string;
  narration: string;
  motionHint?: string;
  musicPrompt?: string;
  soundEffect?: string;
  transitionEffect?: TransitionEffect;
  transitionDuration?: number;
  holdDuration?: number;
  jumpTarget?: string; 
  animationType?: 'none' | 'pan-right' | 'pan-left' | 'zoom-in' | 'zoom-out';
  imageUrl?: string;
  voiceoverUrl?: string;
  voiceProfile?: string; // Using string to match audio.defaultVoice
  voiceSpeed?: number;
  voicePitch?: number;
  status: SceneStatus;
}

export interface MovieProject {
  id: string;
  title: string;
  originalIdea: string;
  summary: string;
  style: string;
  settings: ProductionSettings;
  scenes: Scene[];
  characterDefinitions?: string;
  createdAt: number;
}
