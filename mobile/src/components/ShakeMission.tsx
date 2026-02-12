import { View, Text } from 'react-native';
import { useState, useEffect } from 'react';
import { Accelerometer } from 'expo-sensors';
import { getShakeThreshold } from '@/lib/alarm-utils';
import { DifficultyLevel } from '@/lib/types';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';

interface ShakeMissionProps {
  difficulty: DifficultyLevel;
  onComplete: () => void;
}

export function ShakeMission({ difficulty, onComplete }: ShakeMissionProps) {
  const [shakeCount, setShakeCount] = useState<number>(0);
  const threshold = getShakeThreshold(difficulty);

  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }));

  useEffect(() => {
    let lastX = 0;
    let lastY = 0;
    let lastZ = 0;
    let lastUpdate = 0;

    const subscription = Accelerometer.addListener(async (data) => {
      const currentTime = Date.now();
      if (currentTime - lastUpdate > 100) {
        const diffTime = currentTime - lastUpdate;
        lastUpdate = currentTime;

        const { x, y, z } = data;
        const speed =
          (Math.abs(x + y + z - lastX - lastY - lastZ) / diffTime) * 10000;

        if (speed > 800) {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          const newCount = shakeCount + 1;
          setShakeCount(newCount);

          scale.value = withSequence(
            withSpring(1.2, { damping: 10 }),
            withSpring(1, { damping: 10 })
          );
          rotation.value = withSequence(
            withSpring(10, { damping: 10 }),
            withSpring(-10, { damping: 10 }),
            withSpring(0, { damping: 10 })
          );

          if (newCount >= threshold) {
            setTimeout(() => {
              onComplete();
            }, 500);
          }
        }

        lastX = x;
        lastY = y;
        lastZ = z;
      }
    });

    Accelerometer.setUpdateInterval(100);

    return () => {
      subscription.remove();
    };
  }, [shakeCount, threshold, onComplete]);

  const progress = (shakeCount / threshold) * 100;

  return (
    <View className="flex-1 items-center justify-center px-6">
      <Animated.View style={animatedStyle}>
        <Text className="text-white text-8xl mb-4">📱</Text>
      </Animated.View>

      <Text className="text-white text-2xl font-bold mb-2">Shake Your Phone!</Text>
      <Text className="text-white/60 text-lg mb-12">
        {shakeCount} / {threshold} shakes
      </Text>

      <View className="w-full max-w-xs h-6 bg-white/20 rounded-full overflow-hidden">
        <View
          className="h-full bg-white rounded-full"
          style={{ width: `${progress}%` }}
        />
      </View>

      <Text className="text-white/60 text-sm mt-8 text-center">
        Shake vigorously to dismiss the alarm
      </Text>
    </View>
  );
}
