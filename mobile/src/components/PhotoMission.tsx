import { View, Text, Pressable, Platform } from 'react-native';
import { useState } from 'react';
import { Camera } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

// Conditional import for expo-camera (not available on web)
let CameraView: any = null;
let useCameraPermissions: any = null;
if (Platform.OS !== 'web') {
  const expoCamera = require('expo-camera');
  CameraView = expoCamera.CameraView;
  useCameraPermissions = expoCamera.useCameraPermissions;
}

interface PhotoMissionProps {
  onComplete: () => void;
}

export function PhotoMission({ onComplete }: PhotoMissionProps) {
  // On web, show a fallback message since camera access is limited
  if (Platform.OS === 'web') {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-white text-lg">Photo Mission</Text>
        <Text className="text-white text-2xl font-bold mt-4 mb-2">
          Camera access limited on web
        </Text>
        <Text className="text-white/60 text-center mb-8">
          Please use the mobile app for photo missions
        </Text>
        <Pressable
          onPress={onComplete}
          className="bg-white px-8 py-4 rounded-full active:scale-95"
        >
          <Text className="text-blue-600 text-lg font-semibold">
            Skip Mission
          </Text>
        </Pressable>
      </View>
    );
  }

  // Mobile implementation
  const [permission, requestPermission] = useCameraPermissions();
  const [photoTaken, setPhotoTaken] = useState<boolean>(false);

  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-white text-lg">Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Camera size={64} color="white" />
        <Text className="text-white text-2xl font-bold mt-4 mb-2">Camera Required</Text>
        <Text className="text-white/60 text-center mb-8">
          This mission requires access to your camera
        </Text>
        <Pressable
          onPress={requestPermission}
          className="bg-white px-8 py-4 rounded-full active:scale-95"
        >
          <Text className="text-blue-600 text-lg font-semibold">Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  const handleTakePhoto = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPhotoTaken(true);
    setTimeout(() => {
      onComplete();
    }, 1000);
  };

  return (
    <View className="flex-1">
      <CameraView style={{ flex: 1 }} facing="front">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', padding: 24 }}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text className="text-white text-2xl font-bold mb-2">Take a Selfie</Text>
            <Text className="text-white/80 text-base text-center">
              Take a photo to prove you're awake
            </Text>
          </View>

          <View style={{ alignItems: 'center', paddingBottom: 40 }}>
            <Pressable
              onPress={handleTakePhoto}
              className="active:scale-95"
              disabled={photoTaken}
            >
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: photoTaken ? '#10B981' : 'white',
                  borderWidth: 4,
                  borderColor: 'rgba(255,255,255,0.3)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {photoTaken && <Text className="text-white text-3xl">✓</Text>}
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
