import { View, Text, Pressable, Dimensions } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Logo } from '@/components/Logo';
import { Bell, Brain, Volume2, Sparkles, CheckCircle2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const ONBOARDING_SCREENS = [
  {
    icon: Bell,
    title: 'Welcome to WakeQuest',
    description: 'The ultimate alarm app that actually wakes you up. No more sleeping through alarms!',
    color: '#F97316',
  },
  {
    icon: Brain,
    title: 'Smart Missions',
    description: 'Complete challenges to dismiss your alarm. Choose from 9 different mission types including AI-powered tasks.',
    color: '#10B981',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Features',
    description: 'Use GPT-5.2 vision to find objects, solve riddles, or verify singing. Plus voice assistant control!',
    color: '#06B6D4',
  },
  {
    icon: Volume2,
    title: 'Customizable Sounds',
    description: 'Choose from 18 alarm sounds - from peaceful chimes to loud sirens. Perfect for any sleep style.',
    color: '#EF4444',
  },
];

export default function OnboardingScreen() {
  console.log('🎉 OnboardingScreen rendering...');
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  console.log('📍 Current onboarding step:', currentStep);

  const handleNext = async () => {
    console.log('➡️ Next button pressed');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (currentStep === ONBOARDING_SCREENS.length - 1) {
      console.log('✅ Completing onboarding...');
      await AsyncStorage.setItem('onboarding_completed', 'true');
      router.replace('/(tabs)');
    } else {
      console.log('📄 Moving to next step:', currentStep + 1);
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = async () => {
    console.log('⏭️ Skip button pressed');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await AsyncStorage.setItem('onboarding_completed', 'true');
    router.replace('/(tabs)');
  };

  const screen = ONBOARDING_SCREENS[currentStep];
  const Icon = screen.icon;

  console.log('🎨 Rendering screen:', screen.title);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <LinearGradient
        colors={['#F97316', '#EF4444']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 300 }}
      />
      <View className="flex-1 px-6 pt-20 pb-10">
        {/* Skip button */}
        {currentStep < ONBOARDING_SCREENS.length - 1 && (
          <Animated.View entering={FadeInDown.delay(200)} className="items-end">
            <Pressable
              onPress={handleSkip}
              className="active:opacity-70"
            >
              <Text className="text-gray-600 text-base font-medium">Skip</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Content */}
        <View className="flex-1 justify-center items-center">
          {/* Logo on first screen */}
          {currentStep === 0 && (
            <Animated.View entering={FadeInUp.delay(300)}>
              <Logo size={120} />
            </Animated.View>
          )}

          {/* Icon for other screens */}
          {currentStep > 0 && (
            <Animated.View
              key={currentStep}
              entering={FadeInUp.delay(200)}
              style={{
                width: 120,
                height: 120,
                borderRadius: 30,
                backgroundColor: screen.color + '20',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 40,
              }}
            >
              <Icon size={64} color={screen.color} strokeWidth={2} />
            </Animated.View>
          )}

          {/* Title */}
          <Animated.View entering={FadeInUp.delay(400)} className="mt-12">
            <Text className="text-gray-900 text-4xl font-bold text-center mb-6">
              {screen.title}
            </Text>
          </Animated.View>

          {/* Description */}
          <Animated.View entering={FadeInUp.delay(500)} className="px-6">
            <Text className="text-gray-700 text-lg text-center leading-7">
              {screen.description}
            </Text>
          </Animated.View>
        </View>

        {/* Progress dots */}
        <Animated.View entering={FadeInDown.delay(600)} className="flex-row justify-center mb-8 gap-2">
          {ONBOARDING_SCREENS.map((_, index) => (
            <View
              key={index}
              style={{
                width: currentStep === index ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: currentStep === index ? '#F97316' : '#E5E7EB',
              }}
            />
          ))}
        </Animated.View>

        {/* Next button */}
        <Animated.View entering={FadeInDown.delay(700)}>
          <Pressable
            onPress={handleNext}
            className="active:scale-95"
          >
            <LinearGradient
              colors={['#F97316', '#EF4444']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 18,
                paddingHorizontal: 32,
                borderRadius: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {currentStep === ONBOARDING_SCREENS.length - 1 ? (
                <>
                  <CheckCircle2 size={24} color="#FFFFFF" />
                  <Text className="text-white text-lg font-bold">Get Started</Text>
                </>
              ) : (
                <Text className="text-white text-lg font-bold">Continue</Text>
              )}
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}
