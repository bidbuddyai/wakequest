import { View, Text, Pressable, Image, ActivityIndicator } from 'react-native';
import { useState, useRef } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Camera, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface ObjectFindMissionProps {
  onComplete: () => void;
}

const OBJECTS = [
  'a coffee mug',
  'a book',
  'a pair of shoes',
  'a toothbrush',
  'a water bottle',
  'a pillow',
  'a clock',
  'a mirror',
  'a towel',
  'a phone charger',
];

export function ObjectFindMission({ onComplete }: ObjectFindMissionProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [targetObject, setTargetObject] = useState<string>(
    OBJECTS[Math.floor(Math.random() * OBJECTS.length)]
  );
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const cameraRef = useRef<any>(null);

  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center px-6 bg-gradient-to-b from-purple-900 to-blue-900">
        <Text className="text-white text-lg">Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center px-6 bg-gradient-to-b from-purple-900 to-blue-900">
        <Camera size={64} color="white" />
        <Text className="text-white text-2xl font-bold mt-4 mb-2">Camera Required</Text>
        <Text className="text-white/60 text-center mb-8">
          This mission requires camera access to identify objects
        </Text>
        <Pressable
          onPress={requestPermission}
          style={({ pressed }) => ({
            transform: [{ scale: pressed ? 0.95 : 1 }]
          })}
          className="bg-white px-8 py-4 rounded-full"
        >
          <Text className="text-purple-600 text-lg font-semibold">Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  const handleTakePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
      });

      setPhotoUri(photo.uri);
      setIsAnalyzing(true);

      // Call vision AI to analyze the image
      await analyzeImage(photo.base64);
    } catch (error) {
      console.error('Failed to take photo:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const analyzeImage = async (base64Image: string) => {
    try {
      // Check if OpenAI API key is available
      const openaiKey = process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;

      if (!openaiKey) {
        // No API key - cannot verify
        setIsAnalyzing(false);
        setIsCorrect(false);
        setResult('OpenAI API key required for this mission');

        setTimeout(() => {
          setPhotoUri(null);
          setResult(null);
        }, 3000);
        return;
      }

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
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Look at this image and tell me if you can see ${targetObject}. Respond with ONLY "YES" if you clearly see ${targetObject} in the image, or "NO" if you don't see it. Be strict - it must actually be ${targetObject}.`,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 10,
        }),
      });

      const data = await response.json();
      const answer = data.choices[0]?.message?.content?.trim().toUpperCase();

      setIsAnalyzing(false);

      if (answer === 'YES') {
        setIsCorrect(true);
        setResult(`Perfect! I can see ${targetObject} in the photo.`);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        setTimeout(() => {
          onComplete();
        }, 2000);
      } else {
        setIsCorrect(false);
        setResult(`I don't see ${targetObject}. Try again!`);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

        setTimeout(() => {
          setPhotoUri(null);
          setResult(null);
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to analyze image:', error);
      setIsAnalyzing(false);
      setIsCorrect(false);
      setResult('Failed to analyze. Try again!');

      setTimeout(() => {
        setPhotoUri(null);
        setResult(null);
      }, 2000);
    }
  };

  if (photoUri) {
    return (
      <View className="flex-1 bg-purple-900 items-center justify-center px-6">
        <Animated.View entering={FadeIn} className="w-full max-w-sm">
          <Image
            source={{ uri: photoUri }}
            className="w-full h-96 rounded-3xl mb-6"
            resizeMode="cover"
          />

          {isAnalyzing ? (
            <View className="items-center">
              <ActivityIndicator size="large" color="white" />
              <Text className="text-white text-xl font-semibold mt-4">
                Analyzing with AI...
              </Text>
              <Text className="text-white/60 text-sm mt-2">
                Looking for {targetObject}
              </Text>
            </View>
          ) : result ? (
            <Animated.View entering={FadeIn} className="items-center">
              <View
                className={`px-6 py-4 rounded-2xl ${
                  isCorrect ? 'bg-green-500' : 'bg-red-500'
                }`}
              >
                <Text className="text-white text-lg font-semibold text-center">
                  {result}
                </Text>
              </View>
            </Animated.View>
          ) : null}
        </Animated.View>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', padding: 24 }}>
          {/* Top instruction card */}
          <Animated.View
            entering={FadeIn.delay(300)}
            className="bg-purple-600/90 backdrop-blur-xl rounded-3xl px-6 py-5 border-2 border-white/20"
          >
            <View className="flex-row items-center mb-2">
              <Sparkles size={24} color="white" />
              <Text className="text-white text-xl font-bold ml-2">AI Object Hunt</Text>
            </View>
            <Text className="text-white text-lg font-semibold">
              Find and photograph:
            </Text>
            <Text className="text-yellow-300 text-2xl font-bold mt-1">
              {targetObject}
            </Text>
            <Text className="text-white/80 text-sm mt-2">
              AI will verify the object in your photo
            </Text>
          </Animated.View>

          <View style={{ flex: 1 }} />

          {/* Camera button */}
          <View style={{ alignItems: 'center', paddingBottom: 40 }}>
            <Pressable
              onPress={handleTakePhoto}
              style={({ pressed }) => ({
                transform: [{ scale: pressed ? 0.9 : 1 }]
              })}
            >
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: 'white',
                  borderWidth: 4,
                  borderColor: 'rgba(139, 92, 246, 0.8)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Camera size={36} color="#8B5CF6" />
              </View>
            </Pressable>
            <Text className="text-white/80 text-sm mt-3">
              Tap to capture
            </Text>
          </View>
        </View>
      </CameraView>
    </View>
  );
}
