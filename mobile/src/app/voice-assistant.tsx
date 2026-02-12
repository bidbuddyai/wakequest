import { View, Text, Pressable, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { Mic, Send, X, Crown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { chatWithGemini, GeminiMessage, AlarmCommand } from '@/lib/gemini-service';
import { useAlarmStore } from '@/lib/alarm-store';
import { speakWithElevenLabs } from '@/lib/tts-service';
import { formatAlarmTime } from '@/lib/alarm-utils';
import { usePremium } from '@/lib/usePremium';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export default function VoiceAssistantScreen() {
  const router = useRouter();
  const { isPremium } = usePremium();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: isPremium
        ? 'Hi! I can help you manage your alarms. Try saying "Set an alarm for 7 AM tomorrow" or "What alarms do I have?"'
        : 'Voice assistant requires Premium. Upgrade to create alarms with natural language!',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const conversationHistory = useRef<GeminiMessage[]>([]);

  const alarms = useAlarmStore((s) => s.alarms);
  const addAlarm = useAlarmStore((s) => s.addAlarm);
  const deleteAlarm = useAlarmStore((s) => s.deleteAlarm);
  const toggleAlarm = useAlarmStore((s) => s.toggleAlarm);
  const updateAlarm = useAlarmStore((s) => s.updateAlarm);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    if (!isPremium) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      router.push('/paywall');
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setIsProcessing(true);

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Add user message to chat
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: userMessage, timestamp: Date.now() },
    ]);

    try {
      // Get context about current alarms
      const alarmContext = alarms.length > 0
        ? `Current alarms: ${alarms.map((a) => `${formatAlarmTime(a.time)} - ${a.label || 'No label'} (${a.enabled ? 'ON' : 'OFF'})`).join(', ')}`
        : 'No alarms set.';

      const contextualMessage = `${alarmContext}\n\nUser: ${userMessage}`;

      // Chat with Gemini
      const { response, command } = await chatWithGemini(contextualMessage, conversationHistory.current);

      // Update conversation history
      conversationHistory.current.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: response }
      );

      // Execute command if provided
      if (command) {
        await executeCommand(command);
      }

      // Add assistant response
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: response, timestamp: Date.now() },
      ]);

      // Speak response
      speakWithElevenLabs({ text: response });
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: "Sorry, I'm having trouble right now. Please try again.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const executeCommand = async (command: AlarmCommand) => {
    try {
      switch (command.action) {
        case 'create':
          if (command.time) {
            addAlarm({
              time: command.time,
              label: command.label || '',
              enabled: true,
              repeatDays: command.repeatDays || [],
              missionType: 'none',
              missionDifficulty: 'medium',
              sound: 'classic',
              soundName: 'classic',
              vibrate: true,
              snoozeEnabled: true,
              snoozeDuration: 5,
              volume: 0.8,
              gradualVolume: false,
              weatherInfo: false,
              reminderEnabled: false,
              followUpEnabled: false,
              followUpDelay: 3,
            });
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          break;

        case 'delete':
          if (command.alarmId) {
            deleteAlarm(command.alarmId);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } else if (command.time) {
            // Find alarm by time
            const alarmToDelete = alarms.find((a) => a.time === command.time);
            if (alarmToDelete) {
              deleteAlarm(alarmToDelete.id);
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          }
          break;

        case 'toggle':
          if (command.alarmId) {
            toggleAlarm(command.alarmId);
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          } else if (command.time) {
            const alarmToToggle = alarms.find((a) => a.time === command.time);
            if (alarmToToggle) {
              toggleAlarm(alarmToToggle.id);
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
          }
          break;

        case 'update':
          if (command.alarmId && command.time) {
            updateAlarm(command.alarmId, { time: command.time });
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          break;

        case 'list':
          // Response is already in the message
          break;

        default:
          break;
      }
    } catch (error) {
      console.error('Command execution error:', error);
    }
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Voice Assistant',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} className="active:opacity-50">
              <X size={24} color="#6B7280" />
            </Pressable>
          ),
        }}
      />

      <LinearGradient
        colors={['#8B5CF6', '#7C3AED']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 120 }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={100}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4"
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }}
        >
          {messages.map((message, index) => (
            <Animated.View
              key={index}
              entering={FadeInDown.delay(index * 50)}
              className={`mb-4 ${message.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <View
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-500 shadow-sm'
                    : 'bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700'
                }`}
              >
                <Text
                  className={`text-base leading-6 ${
                    message.role === 'user'
                      ? 'text-white'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {message.text}
                </Text>
              </View>
            </Animated.View>
          ))}

          {isProcessing && (
            <View className="items-start mb-4">
              <View className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-3">
                <Text className="text-gray-400 dark:text-gray-500">Thinking...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View className="px-4 pb-6 pt-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          <View className="flex-row items-center space-x-2">
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask me anything..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-5 py-3 text-gray-900 dark:text-white text-base"
              multiline
              maxLength={500}
              onSubmitEditing={handleSend}
              editable={!isProcessing}
            />

            <Pressable
              onPress={handleSend}
              disabled={!input.trim() || isProcessing}
              style={({ pressed }) => ({
                transform: [{ scale: pressed ? 0.9 : 1 }]
              })}
              className={`w-12 h-12 rounded-full items-center justify-center ${
                input.trim() && !isProcessing ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-700'
              }`}
            >
              <Send
                size={20}
                color={input.trim() && !isProcessing ? '#FFFFFF' : '#9CA3AF'}
              />
            </Pressable>
          </View>

          <View className="flex-row items-center justify-center mt-3">
            <Mic size={16} color="#9CA3AF" />
            <Text className="text-gray-400 dark:text-gray-500 text-xs ml-2">
              Powered by Gemini AI
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
