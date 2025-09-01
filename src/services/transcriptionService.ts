import * as FileSystem from 'expo-file-system';

export interface TranscriptionResult {
  text: string;
  duration?: number;
  confidence?: number;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

export class TranscriptionService {
  private apiKey: string;
  private baseUrl: string = 'https://api.openai.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async transcribeAudio(audioUri: string): Promise<TranscriptionResult> {
    try {
      // Read the audio file
      const audioInfo = await FileSystem.getInfoAsync(audioUri);
      if (!audioInfo.exists) {
        throw new Error('Audio file not found');
      }

      // Create form data for the API request
      const formData = new FormData();
      formData.append('file', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'audio.m4a',
      } as any);
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'verbose_json');
      formData.append('language', 'en'); // Can be made configurable

      const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Transcription failed');
      }

      const result = await response.json();
      
      return {
        text: result.text,
        duration: result.duration,
        segments: result.segments,
      };

    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  }

  async enhanceText(text: string, mode: 'summary' | 'bullets' | 'action_items' = 'summary'): Promise<string> {
    try {
      const prompts = {
        summary: 'Please provide a concise summary of this text:',
        bullets: 'Please convert this text into clear bullet points:',
        action_items: 'Please extract any action items or tasks from this text:'
      };

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: `${prompts[mode]}\n\n${text}`
            }
          ],
          max_tokens: 500,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Text enhancement failed');
      }

      const result = await response.json();
      return result.choices[0]?.message?.content || text;

    } catch (error) {
      console.error('Text enhancement error:', error);
      return text; // Return original text if enhancement fails
    }
  }
}

// Mock service for development/testing
export class MockTranscriptionService {
  async transcribeAudio(audioUri: string): Promise<TranscriptionResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      text: "This is a mock transcription of your audio recording. In a real implementation, this would be the actual transcribed text from your voice recording using OpenAI's Whisper API.",
      duration: 10,
      confidence: 0.95,
      segments: [
        { start: 0, end: 5, text: "This is a mock transcription of your audio recording." },
        { start: 5, end: 10, text: "In a real implementation, this would be the actual transcribed text." }
      ]
    };
  }

  async enhanceText(text: string, mode: 'summary' | 'bullets' | 'action_items' = 'summary'): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const enhancements = {
      summary: `**Summary:** ${text.substring(0, 100)}...`,
      bullets: `**Key Points:**\n• ${text.split('.')[0]}\n• Mock bullet point 2\n• Mock bullet point 3`,
      action_items: `**Action Items:**\n□ Mock action item 1\n□ Mock action item 2\n□ Mock action item 3`
    };
    
    return enhancements[mode];
  }
}