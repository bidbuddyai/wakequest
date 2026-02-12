import { View, Text, Pressable, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { generateMathProblem } from '@/lib/alarm-utils';
import { DifficultyLevel } from '@/lib/types';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface MathMissionProps {
  difficulty: DifficultyLevel;
  onComplete: () => void;
}

export function MathMission({ difficulty, onComplete }: MathMissionProps) {
  const [problem, setProblem] = useState(generateMathProblem(difficulty));
  const [answer, setAnswer] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  const [problemCount, setProblemCount] = useState<number>(0);

  const problemsNeeded = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 5 : 8;

  const shake = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  const handleSubmit = async () => {
    const userAnswer = parseInt(answer, 10);
    if (userAnswer === problem.answer) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const newCount = problemCount + 1;
      if (newCount >= problemsNeeded) {
        onComplete();
      } else {
        setProblemCount(newCount);
        setProblem(generateMathProblem(difficulty));
        setAnswer('');
        setError(false);
      }
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(true);
      shake.value = withSpring(-10, {}, () => {
        shake.value = withSpring(10, {}, () => {
          shake.value = withSpring(0);
        });
      });
      setTimeout(() => setError(false), 1500);
    }
  };

  return (
    <View className="flex-1 items-center justify-center px-6">
      <Text className="text-white text-lg mb-2">Solve Math Problems</Text>
      <Text className="text-white/60 text-sm mb-8">
        {problemCount} / {problemsNeeded} completed
      </Text>

      <Animated.View style={animatedStyle} className="items-center">
        <Text className="text-white text-7xl font-bold mb-12">{problem.question}</Text>

        <TextInput
          value={answer}
          onChangeText={setAnswer}
          keyboardType="number-pad"
          placeholder="Answer"
          placeholderTextColor="rgba(255,255,255,0.3)"
          className={`text-white text-4xl font-bold text-center w-64 py-4 px-6 rounded-2xl ${
            error ? 'bg-red-500/20 border-2 border-red-500' : 'bg-white/10 border-2 border-white/30'
          }`}
          autoFocus
          onSubmitEditing={handleSubmit}
        />

        {error && (
          <Text className="text-red-400 text-base mt-4">Incorrect! Try again</Text>
        )}
      </Animated.View>

      <Pressable
        onPress={handleSubmit}
        disabled={!answer}
        style={({ pressed }) => ({
          transform: [{ scale: pressed ? 0.95 : 1 }]
        })}
        className={`mt-12 px-8 py-4 rounded-full ${
          answer ? 'bg-white' : 'bg-white/20'
        }`}
      >
        <Text
          className={`text-lg font-semibold ${
            answer ? 'text-blue-600' : 'text-white/40'
          }`}
        >
          Submit
        </Text>
      </Pressable>
    </View>
  );
}
