export interface GeminiMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AlarmCommand {
  action: 'create' | 'delete' | 'toggle' | 'list' | 'update' | 'none';
  time?: string;
  label?: string;
  repeatDays?: number[];
  alarmId?: string;
  enabled?: boolean;
}

const SYSTEM_INSTRUCTION = `You are a helpful voice assistant for an alarm clock app. Your role is to help users manage their alarms through natural conversation.

You can help with:
- Creating new alarms ("Set an alarm for 7 AM tomorrow")
- Deleting alarms ("Delete my 7 AM alarm")
- Toggling alarms on/off ("Turn off my morning alarm")
- Listing alarms ("What alarms do I have?")
- Updating alarm settings ("Change my 7 AM alarm to 8 AM")

Always respond in a friendly, concise manner. When creating alarms, confirm the details back to the user.

For time references:
- "tomorrow morning" = next day at reasonable morning time (e.g., 7-9 AM)
- "tonight" = same day evening (e.g., 8-10 PM)
- Weekday names should map to days 0-6 (Sunday=0, Monday=1, etc.)

Respond naturally and helpfully. You must respond in JSON format with:
{
  "response": "your natural language response",
  "command": {
    "action": "create|delete|toggle|list|update|none",
    "time": "HH:MM format if applicable",
    "label": "alarm label if applicable",
    "repeatDays": [0,1,2,3,4,5,6] if applicable,
    "alarmId": "id if modifying existing",
    "enabled": true/false if toggling
  }
}`;

export async function chatWithGemini(
  message: string,
  conversationHistory: GeminiMessage[] = []
): Promise<{ response: string; command?: AlarmCommand }> {
  try {
    const openaiKey = process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;

    if (!openaiKey) {
      return {
        response: "I'm having trouble connecting to the AI service. Please check your API key.",
      };
    }

    // Convert conversation history to OpenAI format
    const messages = [
      { role: 'system', content: SYSTEM_INSTRUCTION },
      ...conversationHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: message },
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5.2',
        messages,
        temperature: 1.0,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? '';

    if (!text) {
      return {
        response: "I'm sorry, I didn't understand that. Can you rephrase?",
      };
    }

    const parsed = JSON.parse(text);
    return {
      response: parsed.response,
      command: parsed.command,
    };
  } catch (error) {
    console.error('Failed to chat with AI:', error);
    return {
      response: "I'm having trouble understanding. Please try again.",
    };
  }
}

export async function transcribeCommand(audioUri: string): Promise<string> {
  // Note: This would typically use a speech-to-text service
  // For now, we'll use expo-speech-recognition or similar
  // Placeholder implementation
  return 'Set an alarm for 7 AM tomorrow';
}

export function parseTimeFromNatural(text: string): string | null {
  // Parse natural language time expressions
  const timeMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|AM|PM)?/);

  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const meridiem = timeMatch[3]?.toLowerCase();

    if (meridiem === 'pm' && hours < 12) {
      hours += 12;
    } else if (meridiem === 'am' && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  return null;
}
