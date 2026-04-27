/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VoiceProfile } from "../types";

/**
 * Local Edge-TTS Bridge
 * This service communicates with the local Python/Node edge-tts service
 * to generate high-quality, open-source vocal synthesis.
 */
export async function generateTTS(
  text: string, 
  voice: VoiceProfile = 'ar-EG-SalmaNeural', 
  speed: number = 1.0, 
  pitch: number = 0
): Promise<string> {
  try {
    // Calling local edge-tts bridge service (typically running on port 5000 or 8000)
    // Adjust the endpoint if your local service uses a different path.
    const response = await fetch('http://localhost:5000/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice,
        rate: `${Math.round((speed - 1) * 100)}%`,
        pitch: `${pitch}Hz`
      }),
    });

    if (!response.ok) {
      throw new Error(`Local TTS Engine reported an error: ${response.statusText}`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('CRITICAL: Local Edge-TTS synthesis failed. Ensure local service is running.', error);
    throw new Error('Local Audio Engine Offline. Please start your edge-tts service.');
  }
}
