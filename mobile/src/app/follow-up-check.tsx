import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// The challenge phrase user must type exactly
const CHALLENGE_PHRASE = "I swear I am up";

export default function FollowUpCheckScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { alarmId } = useLocalSearchParams<{ alarmId?: string }>();

  const [input, setInput] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = async () => {
    // Check for exact match (case-sensitive, punctuation matters)
    if (input === CHALLENGE_PHRASE) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError('Incorrect. Type exactly as shown with perfect spelling and punctuation.');
      setInput('');
    }
  };

  return (
    <View className="flex-1 bg-[#0A0E27]" style={{ paddingTop: insets.top }}>
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          {/* Header */}
          <View className="items-center mb-8">
            <LinearGradient
              colors={['#FF6B35', '#F7931E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <CheckCircle size={40} color="#FFF" strokeWidth={2.5} />
            </LinearGradient>
            <Text className="text-white text-3xl font-bold text-center mb-3">
              Are You Still Awake?
            </Text>
            <Text className="text-gray-400 text-base text-center">
              Type the phrase below exactly as shown
            </Text>
          </View>

          {/* Challenge Phrase */}
          <View className="bg-[#151B3B] rounded-2xl p-6 mb-6">
            <Text className="text-gray-400 text-sm mb-2 text-center">
              Type this exactly:
            </Text>
            <Text className="text-white text-2xl font-bold text-center">
              {CHALLENGE_PHRASE}
            </Text>
          </View>

          {/* Input */}
          <View className="mb-4">
            <TextInput
              value={input}
              onChangeText={(text) => {
                setInput(text);
                setError('');
              }}
              placeholder="Type here..."
              placeholderTextColor="#6B7280"
              autoFocus
              autoCorrect={false}
              autoCapitalize="none"
              className="bg-[#151B3B] text-white text-lg px-6 py-4 rounded-2xl"
              onSubmitEditing={handleSubmit}
            />
            {error ? (
              <Text className="text-red-500 text-sm mt-2 text-center">
                {error}
              </Text>
            ) : null}
          </View>

          {/* Submit Button */}
          <Pressable
            onPress={handleSubmit}
            className="active:scale-95"
            disabled={!input.trim()}
          >
            <LinearGradient
              colors={input.trim() ? ['#FF6B35', '#F7931E'] : ['#374151', '#374151']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 16,
                padding: 18,
                alignItems: 'center',
              }}
            >
              <Text className="text-white font-bold text-lg">
                Confirm I'm Awake
              </Text>
            </LinearGradient>
          </Pressable>

          {/* Hint */}
          <Text className="text-gray-500 text-xs text-center mt-6">
            Spelling, capitalization, and punctuation must be perfect
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
