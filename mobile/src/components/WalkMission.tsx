import { View, Text, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import { Footprints, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Pedometer } from 'expo-sensors';
import { DifficultyLevel } from '@/lib/types';

interface WalkMissionProps {
  difficulty: DifficultyLevel;
  onComplete: () => void;
}

const STEPS_REQUIRED = {
  easy: 20,
  medium: 50,
  hard: 100,
};

export function WalkMission({ difficulty, onComplete }: WalkMissionProps) {
  const [currentSteps, setCurrentSteps] = useState<number>(0);
  const [isPedometerAvailable, setIsPedometerAvailable] = useState<boolean>(false);
  const [subscription, setSubscription] = useState<any>(null);
  const targetSteps = STEPS_REQUIRED[difficulty];
  const progress = Math.min(currentSteps / targetSteps, 1);

  const progressWidth = useSharedValue(0);

  useEffect(() => {
    checkPedometerAvailability();
    return () => {
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    progressWidth.value = withSpring(progress);
  }, [progress]);

  useEffect(() => {
    if (currentSteps >= targetSteps) {
      handleComplete();
    }
  }, [currentSteps]);

  const checkPedometerAvailability = async () => {
    const isAvailable = await Pedometer.isAvailableAsync();
    setIsPedometerAvailable(isAvailable);

    if (isAvailable) {
      startCounting();
    }
  };

  const startCounting = () => {
    const sub = Pedometer.watchStepCount((result) => {
      setCurrentSteps((prev) => prev + result.steps);
      if (result.steps > 0) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    });

    setSubscription(sub);
  };

  const handleComplete = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    subscription?.remove();

    setTimeout(() => {
      onComplete();
    }, 1500);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  if (!isPedometerAvailable) {
    return (
      <View className="flex-1 items-center justify-center px-6 bg-gradient-to-b from-green-900 to-blue-900">
        <Footprints size={64} color="white" />
        <Text className="text-white text-2xl font-bold mt-4 mb-2">Pedometer Not Available</Text>
        <Text className="text-white/60 text-center mb-8">
          Your device doesn't support step counting
        </Text>
        <Pressable
          onPress={onComplete}
          style={({ pressed }) => ({
            transform: [{ scale: pressed ? 0.95 : 1 }]
          })}
          className="bg-white px-8 py-4 rounded-full"
        >
          <Text className="text-green-600 text-lg font-semibold">Continue</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gradient-to-b from-green-900 to-blue-900 items-center justify-center px-6">
      <Animated.View entering={FadeIn} className="items-center">
        <View className="bg-white/10 backdrop-blur-xl rounded-full p-8 mb-6">
          <Footprints size={64} color="white" />
        </View>

        <Text className="text-white text-3xl font-bold mb-2">Walk Mission</Text>
        <Text className="text-white/80 text-lg text-center mb-8">
          Walk {targetSteps} steps to dismiss the alarm
        </Text>

        {/* Steps Counter */}
        <View className="bg-white/20 backdrop-blur-lg rounded-3xl px-8 py-6 mb-6 border border-white/30 items-center min-w-[280px]">
          <Text className="text-white/60 text-sm uppercase tracking-wider mb-2">Steps</Text>
          <View className="flex-row items-baseline">
            <Text className="text-white text-6xl font-bold">{currentSteps}</Text>
            <Text className="text-white/60 text-2xl ml-2">/ {targetSteps}</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View className="w-full max-w-sm mb-8">
          <View className="h-4 bg-white/20 rounded-full overflow-hidden">
            <Animated.View
              style={[animatedStyle, { height: '100%', backgroundColor: '#10B981' }]}
            />
          </View>
          <Text className="text-white/60 text-sm text-center mt-2">
            {Math.round(progress * 100)}% Complete
          </Text>
        </View>

        {/* Instructions */}
        <View className="bg-blue-500/20 backdrop-blur-lg rounded-2xl px-6 py-4 border border-blue-400/30">
          <Text className="text-white text-center text-sm">
            Start walking around to count steps
          </Text>
        </View>

        {/* Success indicator */}
        {currentSteps >= targetSteps && (
          <Animated.View
            entering={FadeIn}
            className="absolute inset-0 items-center justify-center bg-green-500/30 backdrop-blur-sm"
          >
            <View className="bg-green-500 rounded-full p-8">
              <Check size={80} color="white" strokeWidth={3} />
            </View>
            <Text className="text-white text-3xl font-bold mt-6">Mission Complete!</Text>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}
