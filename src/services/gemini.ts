/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Scene, SceneStatus, ProductionSettings, VisualStyle } from "../types";

const getApiKey = () => {
  const savedKey = localStorage.getItem('BOOKMOTION_GEMINI_API_KEY');
  if (savedKey) return savedKey;
  return (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
};

const ai = () => {
  const key = getApiKey();
  return key ? new GoogleGenAI({ apiKey: key, apiVersion: 'v1beta' }) : null;
};

const getModelId = (model: string) => {
  if (model.includes('gemini-2.0')) return 'gemini-3.1-flash-lite-preview';
  return 'gemini-3.1-flash-lite-preview';
};

const executeWithFallback = async (genAI: any, modelId: string, payload: any) => {
  // Define fallback sequence prioritizing the requested model, then stable backups
  const fallbackChain = [modelId, 'gemini-3.1-flash-lite-preview', 'gemini-1.5-flash'];
  let lastError: any;

  for (const model of fallbackChain) {
    try {
      return await genAI.models.generateContent({
        ...payload,
        model
      });
    } catch (err: any) {
      lastError = err;
      const isTransient = err.message?.includes('503') || 
                          err.message?.includes('high demand') || 
                          err.status === 'UNAVAILABLE';
      
      if (isTransient) {
        console.warn(`[Neural Engine] ${model} overloaded. Engaging fallback protocols...`);
        continue;
      }
      throw err; // Critical failure (404, 401, etc) - stop immediately
    }
  }
  throw lastError;
};

export async function generateMovieSummary(input: string, settings?: ProductionSettings) {
  const genAI = ai();
  if (!genAI) throw new Error("Gemini API Key is missing. Please set it in Settings > Engine.");
  const modelId = 'gemini-3.1-flash-lite-preview';

  const isLargeScript = input.length > 500;
  const prompt = isLargeScript 
    ? `You are a world-class literary adapter. Analyze the following book text/excerpt and transform it into a compelling, cinematic narrative script for a video. 
       - Identify the core protagonist and their motivation.
       - Extract the most visual and emotional story beats.
       - Create a high-stakes, 3-act summary suitable for a 3-minute video production.
       - Use evocative, cinematic language.
       - ALWAYS RESPOND IN THE PREDOMINANT LANGUAGE OF THE INPUT (Arabic or English).
       
       BOOK CONTENT: \n\n"${input.substring(0, 8000)}"`
    : `Transform this idea into a cinematic book-to-screen story recap: "${input}". Focus on world-building and character motivation. Respond in the same language as input.`;

  const response = await executeWithFallback(genAI, modelId, {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: settings?.temperature || 0.7
    }
  });

  return response.text || "";
}

export async function generateCharacterDesign(summary: string, settings?: ProductionSettings): Promise<string> {
  const genAI = ai();
  if (!genAI) throw new Error("Gemini API Key is missing. Please set it in Settings > Engine.");
  const modelId = 'gemini-3.1-flash-lite-preview';

  const response = await executeWithFallback(genAI, modelId, {
    contents: [{ role: 'user', parts: [{ text: `Based on this narrative summary: "${summary}", define the visual appearance of the primary characters to maintain storytelling continuity. 
    Describe their gender, age, hair color/style, eye color, and a unique symbolic outfit or accessory they wear throughout the story. 
    Keep it concise but detailed enough for image generation stability across scenes. Respond in English for better technical prompting.` }] }],
    generationConfig: {
      temperature: 0.4 // Keep character DNA stable
    }
  });

  return response.text || "";
}

export async function generateStoryboard(summary: string, style: string, characterDesign: string, settings: ProductionSettings): Promise<Scene[]> {
  const genAI = ai();
  if (!genAI) throw new Error("Gemini API Key is missing. Please set it in Settings > Engine.");
  const modelId = 'gemini-3.1-flash-lite-preview';

  const response = await executeWithFallback(genAI, modelId, {
    contents: [{ role: 'user', parts: [{ text: `
    NARRATIVE SUMMARY: ${summary}
    CHARACTER VISUAL DNA: ${characterDesign}
    VISUAL STYLE: ${style}
    ASPECT RATIO: ${settings.aspectRatio}
    ZOOM INTENSITY: ${settings.zoomIntensity}/10

    Generate exactly ${settings.sceneDensity} scenes for this storyboard.

    For 'description', provide a concise, high-level summary of the scene's visual and narrative focus.
    For 'visualPrompt', you MUST generate a professional, technical descriptor using this framework:
    1. Visual DNA: Precise character description (feature by feature) from the CHARACTER VISUAL DNA provided.
    2. Framing & Lens: Specify camera perspective (Extreme Close-Up, Dutch Angle, 35mm lens, Wide Anamorphic Tracking).
    3. Lighting & Atmosphere: Detailed lighting setup (Rim light, Volumetric God rays, Cinematic color grade).
    4. Technical Polish: Surface details (Subsurface scattering, Masterwork quality).
    5. Aspect Ratio Context: Compose the shot specifically for ${settings.aspectRatio}.

    For 'motionHint', describe how this image should be animated. 
    IMPORTANT: Reflect the ZOOM INTENSITY of ${settings.zoomIntensity}/10 in your motion descriptions. 
    If intensity is high (8-10), suggest dynamic, fast zooms or pans. If low (1-3), suggest subtle drifts or static frames.
    For 'musicPrompt', describe the orchestral or ambient score for this specific moment.
    For 'soundEffect', describe the immersive audio details.
    For 'narration', translate the story beat into a voiceover script in ${settings.language}.
    For 'transitionEffect', choose the most cinematic transition to the next scene (Fade, Wipe, Dissolve, Cut, Zoom, Cross).
    For 'transitionDuration', specify duration in seconds (0.1 to 3.0).

    Format as a JSON array of objects with keys: timecode, description, visualPrompt, narration, motionHint, musicPrompt, soundEffect, transitionEffect, transitionDuration.` }] }],
    generationConfig: {
      temperature: settings.temperature || 0.7,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            timecode: { type: Type.STRING },
            description: { type: Type.STRING },
            visualPrompt: { type: Type.STRING },
            narration: { type: Type.STRING },
            motionHint: { type: Type.STRING },
            musicPrompt: { type: Type.STRING },
            soundEffect: { type: Type.STRING },
            transitionEffect: { type: Type.STRING },
            transitionDuration: { type: Type.NUMBER },
          },
          required: ["timecode", "description", "visualPrompt", "narration", "motionHint", "musicPrompt", "soundEffect", "transitionEffect", "transitionDuration"],
        },
      },
    },
  });

  const rawScenes = JSON.parse(response.text || "[]");
  return rawScenes.map((s: any, index: number) => ({
    id: `scene-${Date.now()}-${index}`,
    order: index,
    ...s,
    status: SceneStatus.PENDING,
  }));
}

export async function generateSceneImage(scene: Scene, style: VisualStyle, aspectRatio: string = "16:9", characterDNA?: string): Promise<string> {
  const genAI = ai();
  if (!genAI) throw new Error("Gemini API Key is missing. Please set it in Settings > Engine.");
  
  // Map our display aspect ratios to Gemini's internal types
  const ratioMap: Record<string, "16:9" | "1:1" | "9:16"> = {
    "16:9": "16:9",
    "9:16": "9:16",
    "1:1": "1:1"
  };

  const geminiRatio = ratioMap[aspectRatio] || "16:9";

  // Construct a sophisticated, multi-layered prompt that incorporates narrative context
  const enhancedPrompt = `
    MASTER STYLE: ${style}
    SCENE CONTEXT: ${scene.description}
    NARRATIVE BEAT/VOICEOVER: ${scene.narration}
    VISUAL ARCHITECTURE: ${scene.visualPrompt}
    ${characterDNA ? `\nCHARACTER VISUAL DNA: ${characterDNA}` : ""}

    TASK: Create a cinematic masterpiece frame that visualizes this story beat.
    The image must strictly follow the VISUAL ARCHITECTURE for specific framing, lighting, and camera technicals.
    Use the SCENE CONTEXT and NARRATIVE BEAT to inform the emotional weight, atmospheric nuance, and character expressions.
    Ensure total consistency with the MASTER STYLE and CHARACTER VISUAL DNA if provided.
    High-end production quality, 8k resolution, cinematic lighting, professional composition.
  `.trim();

  const response = await executeWithFallback(genAI, 'gemini-3.1-flash-image-preview', {
    contents: [{
      parts: [{ text: enhancedPrompt }],
    }],
    generationConfig: {
      imageConfig: {
        aspectRatio: geminiRatio,
      },
    } as any, 
  });

  for (const part of response.candidates?.[0].content.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("Failed to generate image");
}
