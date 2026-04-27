/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Modality } from "@google/genai";
import { VoiceProfile } from "../types";

const getApiKey = () => {
  const savedKey = localStorage.getItem('BOOKMOTION_GEMINI_API_KEY');
  if (savedKey) return savedKey;
  return (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
};

const ai = () => {
  const key = getApiKey();
  return key ? new GoogleGenAI({ apiKey: key, apiVersion: 'v1beta' }) : null;
};

const executeWithFallback = async (genAI: any, modelId: string, payload: any) => {
  const fallbackChain = Array.from(new Set([modelId, 'gemini-3.1-flash-tts-preview', 'gemini-3.1-flash-live-preview', 'gemini-1.5-flash-latest']));
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
        console.warn(`[Audio Engine] ${model} overloaded. Engaging fallback protocols...`);
        continue;
      }
      throw err;
    }
  }
  throw lastError;
};

export async function generateTTS(
  text: string, 
  voice: VoiceProfile = 'Kore', 
  speed: number = 1.0, 
  pitch: number = 1.0
): Promise<string> {
  const genAI = ai();
  if (!genAI) throw new Error("Gemini API Key is missing. Please set it in Settings > Engine.");

  try {
    const instruction = `Speak at ${speed === 1.0 ? 'normal' : speed > 1.0 ? 'fast' : 'slow'} speed and ${pitch === 1.0 ? 'normal' : pitch > 1.0 ? 'high' : 'low'} pitch: ${text}`;

    const response = await executeWithFallback(genAI, "gemini-3.1-flash-tts-preview", {
      contents: [{ parts: [{ text: instruction }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return createWavDataUrl(base64Audio, 24000);
    }
    
    throw new Error('No audio data received');
  } catch (error) {
    console.error('TTS Generation failed:', error);
    throw error;
  }
}

function createWavDataUrl(base64Pcm: string, sampleRate: number): string {
  const binaryString = atob(base64Pcm);
  const len = binaryString.length;
  const buffer = new ArrayBuffer(44 + len);
  const view = new DataView(buffer);

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // RIFF chunk length
  view.setUint32(4, 36 + len, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (LPCM)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, 1, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * 2, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, len, true);

  // write PCM data
  for (let i = 0; i < len; i++) {
    view.setUint8(44 + i, binaryString.charCodeAt(i));
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}
