import { View, Text, Pressable } from 'react-native';
import { useState } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ScanBarcode } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface BarcodeMissionProps {
  onComplete: () => void;
}

export function BarcodeMission({ onComplete }: BarcodeMissionProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState<boolean>(false);

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
        <ScanBarcode size={64} color="white" />
        <Text className="text-white text-2xl font-bold mt-4 mb-2">Camera Required</Text>
        <Text className="text-white/60 text-center mb-8">
          This mission requires access to your camera to scan a barcode
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

  const handleBarCodeScanned = (result: { data: string }) => {
    if (scanned) return;

    console.log('Barcode scanned:', result.data);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setScanned(true);
    setTimeout(() => {
      onComplete();
    }, 1000);
  };

  return (
    <View className="flex-1">
      <CameraView
        style={{ flex: 1 }}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39', 'upc_a', 'upc_e'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', padding: 24 }}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View
              style={{
                width: 250,
                height: 250,
                borderWidth: 3,
                borderColor: scanned ? '#10B981' : 'white',
                borderRadius: 20,
                marginBottom: 24,
              }}
            />
            <Text className="text-white text-2xl font-bold mb-2">
              {scanned ? 'Scanned!' : 'Scan a Barcode'}
            </Text>
            <Text className="text-white/80 text-base text-center">
              {scanned
                ? 'Great! Dismissing alarm...'
                : 'Point your camera at any barcode or QR code'}
            </Text>
          </View>

          <View style={{ paddingBottom: 40 }}>
            <Text className="text-white/60 text-sm text-center">
              Scan any product barcode, QR code, or similar
            </Text>
          </View>
        </View>
      </CameraView>
    </View>
  );
}
