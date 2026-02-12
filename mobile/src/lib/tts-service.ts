import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';

export interface TTSOptions {
  text: string;
  voiceId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
}

const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel voice

export async function speakWithElevenLabs(options: TTSOptions): Promise<Audio.Sound | null> {
  try {
    const {
      text,
      voiceId = DEFAULT_VOICE_ID,
      stability = 0.5,
      similarityBoost = 0.75,
      style = 0.0,
    } = options;

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });

    const apiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`;

    // Make the API request
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.EXPO_PUBLIC_VIBECODE_ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_flash_v2_5',
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
          style,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('TTS API request failed');
    }

    // Get the audio as array buffer
    const audioBuffer = await response.arrayBuffer();

    // Convert to base64
    const base64Audio = btoa(
      new Uint8Array(audioBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    // Save to file
    const fileUri = FileSystem.documentDirectory + `speech_${Date.now()}.mp3`;
    await FileSystem.writeAsStringAsync(fileUri, base64Audio, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Create and play sound
    const { sound } = await Audio.Sound.createAsync(
      { uri: fileUri },
      { shouldPlay: true }
    );

    return sound;
  } catch (error) {
    console.error('Failed to generate speech:', error);
    return null;
  }
}

export async function speakAlarmGreeting(
  name: string,
  time: string,
  weather?: { temp: number; description: string }
): Promise<Audio.Sound | null> {
  let greeting = `Good morning! It's ${time}. `;

  if (weather) {
    greeting += `The temperature is ${weather.temp} degrees celsius with ${weather.description}. `;
  }

  greeting += `Time to wake up!`;

  return speakWithElevenLabs({ text: greeting });
}

export async function speakMissionInstructions(missionType: string): Promise<Audio.Sound | null> {
  const instructions: { [key: string]: string } = {
    math: 'Please solve the math problems to dismiss your alarm.',
    shake: 'Shake your phone vigorously to turn off the alarm.',
    memory: 'Remember the color sequence and repeat it back.',
    photo: 'Take a selfie to prove you are awake.',
    barcode: 'Scan the barcode you registered to dismiss the alarm.',
    walk: 'Walk the required number of steps to turn off your alarm.',
  };

  const text = instructions[missionType] || 'Complete the mission to dismiss your alarm.';
  return speakWithElevenLabs({ text });
}

export async function speakEncouragement(): Promise<Audio.Sound | null> {
  const messages = [
    'Great job! You did it!',
    'Excellent work! Have a wonderful day!',
    'Perfect! You are fully awake now!',
    'Amazing! You completed the challenge!',
  ];

  const text = messages[Math.floor(Math.random() * messages.length)];
  return speakWithElevenLabs({ text });
}
