// src/app/tts/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  const { text } = await request.json();
  
  try {
    console.log("Received text for TTS:", text);

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

    const ttsRequest = {
      input: { text },
      voice: { 
        languageCode: 'en-US', 
        name: 'en-GB-Wavenet-B'
      },
      audioConfig: { 
        audioEncoding: 'MP3',
        speakingRate: 1,
        pitch: 1,
      },
    };

    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ttsRequest),
    });

    if (!response.ok) {
      console.error("Error from TTS API:", response.statusText);
      throw new Error('Failed to generate audio');
    }

    const data = await response.json();
    const audioContent = data.audioContent;

    return NextResponse.json({ audioContent });
  } catch (error) {
    console.error("Error in /tts route:", error);
    return NextResponse.error();
  }
}
