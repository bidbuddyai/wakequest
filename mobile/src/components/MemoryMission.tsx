import { View, Text, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import { getMemorySequenceLength } from '@/lib/alarm-utils';
import { DifficultyLevel } from '@/lib/types';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface MemoryMissionProps {
  difficulty: DifficultyLevel;
  onComplete: () => void;
}

const COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

export function MemoryMission({ difficulty, onComplete }: MemoryMissionProps) {
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [isShowing, setIsShowing] = useState<boolean>(true);
  const [currentFlash, setCurrentFlash] = useState<number>(-1);
  const [error, setError] = useState<boolean>(false);

  const sequenceLength = getMemorySequenceLength(difficulty);

  useEffect(() => {
    // Generate random sequence
    const newSequence: number[] = [];
    for (let i = 0; i < sequenceLength; i++) {
      newSequence.push(Math.floor(Math.random() * 6));
    }
    setSequence(newSequence);

    // Show sequence
    let index = 0;
    const interval = setInterval(async () => {
      if (index < newSequence.length) {
        setCurrentFlash(newSequence[index]);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTimeout(() => setCurrentFlash(-1), 400);
        index++;
      } else {
        clearInterval(interval);
        setIsShowing(false);
      }
    }, 800);

    return () => clearInterval(interval);
  }, []);

  const handleColorPress = async (colorIndex: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newUserSequence = [...userSequence, colorIndex];
    setUserSequence(newUserSequence);

    // Check if correct
    if (sequence[newUserSequence.length - 1] !== colorIndex) {
      // Wrong!
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(true);
      setTimeout(() => {
        setUserSequence([]);
        setError(false);
      }, 1000);
    } else if (newUserSequence.length === sequence.length) {
      // Complete!
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        onComplete();
      }, 500);
    }
  };

  return (
    <View className="flex-1 items-center justify-center px-6">
      <Text className="text-white text-2xl font-bold mb-2">Memory Game</Text>
      <Text className="text-white/60 text-base mb-12">
        {isShowing ? 'Watch the sequence...' : `Tap the colors in order (${userSequence.length}/${sequenceLength})`}
      </Text>

      <View className="flex-row flex-wrap w-full max-w-xs justify-center">
        {COLORS.map((color, index) => (
          <Pressable
            key={index}
            onPress={() => !isShowing && handleColorPress(index)}
            disabled={isShowing}
            style={({ pressed }) => ({
              transform: [{ scale: pressed ? 0.9 : 1 }],
              margin: 8
            })}
          >
            <Animated.View
              entering={FadeIn.delay(index * 100)}
              style={{
                width: 90,
                height: 90,
                borderRadius: 45,
                backgroundColor: color,
                opacity: currentFlash === index ? 1 : isShowing ? 0.3 : error ? 0.5 : 1,
                transform: [{ scale: currentFlash === index ? 1.1 : 1 }],
              }}
            />
          </Pressable>
        ))}
      </View>

      {error && (
        <Animated.View entering={FadeIn} exiting={FadeOut}>
          <Text className="text-red-400 text-lg mt-8">Wrong! Try again</Text>
        </Animated.View>
      )}
    </View>
  );
}
