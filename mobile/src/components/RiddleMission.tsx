import { View, Text, Pressable, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { Lightbulb, Sparkles, Send } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut, SlideInUp } from 'react-native-reanimated';
import { DifficultyLevel } from '@/lib/types';

interface RiddleMissionProps {
  difficulty: DifficultyLevel;
  onComplete: () => void;
}

const RIDDLES = {
  easy: [
    { question: 'What has hands but cannot clap?', answer: 'A clock' },
    { question: 'What gets wet while drying?', answer: 'A towel' },
    { question: 'What has a face and two hands but no arms or legs?', answer: 'A clock' },
    { question: 'What can you catch but not throw?', answer: 'A cold' },
    { question: 'What has teeth but cannot bite?', answer: 'A comb' },
  ],
  medium: [
    { question: 'What comes once in a minute, twice in a moment, but never in a thousand years?', answer: 'The letter M' },
    { question: 'What goes up but never comes down?', answer: 'Your age' },
    { question: 'What can travel around the world while staying in a corner?', answer: 'A stamp' },
    { question: 'What has keys but no locks, space but no room, and you can enter but not go inside?', answer: 'A keyboard' },
    { question: 'What belongs to you but other people use it more than you?', answer: 'Your name' },
  ],
  hard: [
    { question: 'I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?', answer: 'An echo' },
    { question: 'The more you take, the more you leave behind. What am I?', answer: 'Footsteps' },
    { question: 'I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?', answer: 'A map' },
    { question: 'What can run but never walks, has a mouth but never talks, has a head but never weeps, has a bed but never sleeps?', answer: 'A river' },
    { question: 'What is so fragile that saying its name breaks it?', answer: 'Silence' },
  ],
};

export function RiddleMission({ difficulty, onComplete }: RiddleMissionProps) {
  const [riddle, setRiddle] = useState(
    RIDDLES[difficulty][Math.floor(Math.random() * RIDDLES[difficulty].length)]
  );
  const [answer, setAnswer] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [attempts, setAttempts] = useState<number>(0);
  const maxAttempts = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 3 : 2;

  const handleSubmit = async () => {
    if (!answer.trim()) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsAnalyzing(true);

    // Check if OpenAI API is available for smart matching
    const openaiKey = process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;

    if (openaiKey) {
      // Use AI to check if the answer is semantically correct
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-5.2',
            messages: [
              {
                role: 'system',
                content: 'You are checking if a riddle answer is correct. The user may phrase it differently but if the meaning is the same, it should be accepted. Respond with ONLY "CORRECT" or "WRONG".',
              },
              {
                role: 'user',
                content: `Riddle: "${riddle.question}"\nExpected Answer: "${riddle.answer}"\nUser's Answer: "${answer}"\n\nIs the user's answer correct?`,
              },
            ],
            max_tokens: 10,
          }),
        });

        const data = await response.json();
        const aiResult = data.choices[0]?.message?.content?.trim().toUpperCase();

        setIsAnalyzing(false);

        if (aiResult === 'CORRECT') {
          setIsCorrect(true);
          setResult(`Brilliant! The answer is "${riddle.answer}".`);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          setTimeout(() => {
            onComplete();
          }, 2500);
        } else {
          handleWrongAnswer();
        }
      } catch (error) {
        console.error('AI check failed:', error);
        // Fallback to simple comparison
        checkAnswerFallback();
      }
    } else {
      // No AI - use simple comparison
      checkAnswerFallback();
    }
  };

  const checkAnswerFallback = () => {
    setIsAnalyzing(false);

    const userAnswer = answer.toLowerCase().trim();
    const correctAnswer = riddle.answer.toLowerCase().trim();

    if (
      userAnswer === correctAnswer ||
      userAnswer.includes(correctAnswer) ||
      correctAnswer.includes(userAnswer)
    ) {
      setIsCorrect(true);
      setResult(`Correct! The answer is "${riddle.answer}".`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setTimeout(() => {
        onComplete();
      }, 2500);
    } else {
      handleWrongAnswer();
    }
  };

  const handleWrongAnswer = async () => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (newAttempts >= maxAttempts) {
      setIsCorrect(false);
      setResult(`Out of attempts! The answer was "${riddle.answer}".`);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      setTimeout(() => {
        onComplete();
      }, 3000);
    } else {
      setIsCorrect(false);
      setResult(`Not quite! You have ${maxAttempts - newAttempts} attempt${maxAttempts - newAttempts === 1 ? '' : 's'} left.`);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      setTimeout(() => {
        setResult(null);
        setAnswer('');
      }, 2000);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gradient-to-b from-indigo-900 to-purple-900"
    >
      <View className="flex-1 px-6 pt-20 pb-10">
        {/* Header */}
        <Animated.View entering={FadeIn} className="items-center mb-8">
          <View className="bg-white/10 backdrop-blur-xl rounded-full p-6 mb-4">
            <Lightbulb size={48} color="#FCD34D" />
          </View>
          <Text className="text-white text-2xl font-bold mb-2">🧩 Solve the Riddle</Text>
          <Text className="text-white/80 text-base text-center">
            AI will verify your answer
          </Text>
        </Animated.View>

        {/* Difficulty Badge */}
        <View className="flex-row justify-center mb-6">
          <View
            className={`px-4 py-2 rounded-full ${
              difficulty === 'easy'
                ? 'bg-green-500'
                : difficulty === 'medium'
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
          >
            <Text className="text-white font-semibold capitalize">{difficulty}</Text>
          </View>
        </View>

        {/* Riddle Card */}
        <Animated.View
          entering={SlideInUp.delay(200)}
          className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 mb-6"
        >
          <View className="flex-row items-center mb-4">
            <Sparkles size={20} color="#6366F1" />
            <Text className="text-gray-900 text-lg font-bold ml-2">The Riddle</Text>
          </View>

          <Text className="text-gray-800 text-xl leading-8 text-center font-medium">
            {riddle.question}
          </Text>

          <View className="mt-4 pt-4 border-t border-gray-200">
            <Text className="text-gray-500 text-sm text-center">
              Attempts: {attempts} / {maxAttempts}
            </Text>
          </View>
        </Animated.View>

        {/* Answer Input */}
        <Animated.View entering={FadeIn.delay(400)} className="mb-6">
          <View className="bg-white/20 backdrop-blur-xl rounded-2xl p-4 border border-white/30">
            <TextInput
              value={answer}
              onChangeText={setAnswer}
              placeholder="Type your answer..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              className="text-white text-lg"
              autoFocus
              editable={!isAnalyzing && !result}
              onSubmitEditing={handleSubmit}
            />
          </View>
        </Animated.View>

        {/* Submit Button */}
        {!isAnalyzing && !result && (
          <Animated.View entering={FadeIn.delay(600)}>
            <Pressable
              onPress={handleSubmit}
              disabled={!answer.trim()}
              style={({ pressed }) => ({
                transform: [{ scale: pressed ? 0.97 : 1 }],
                opacity: !answer.trim() ? 0.5 : 1
              })}
              className="bg-white rounded-2xl py-4 px-6 flex-row items-center justify-center"
            >
              <Send size={20} color="#6366F1" />
              <Text className="text-indigo-600 text-lg font-bold ml-2">Submit Answer</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Loading */}
        {isAnalyzing && (
          <Animated.View entering={FadeIn} className="items-center">
            <ActivityIndicator size="large" color="white" />
            <Text className="text-white text-lg font-semibold mt-4">
              AI is checking your answer...
            </Text>
          </Animated.View>
        )}

        {/* Result */}
        {result && (
          <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            className={`px-6 py-4 rounded-2xl ${
              isCorrect ? 'bg-green-500' : 'bg-red-500/90'
            }`}
          >
            <Text className="text-white text-lg font-semibold text-center">
              {result}
            </Text>
          </Animated.View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
