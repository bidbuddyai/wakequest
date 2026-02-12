import { View } from 'react-native';
import { Bell } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface LogoProps {
  size?: number;
}

export function Logo({ size = 80 }: LogoProps) {
  return (
    <View style={{ width: size, height: size }}>
      <LinearGradient
        colors={['#F97316', '#EF4444']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.25,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#F97316',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        <Bell size={size * 0.5} color="#FFFFFF" strokeWidth={2.5} />
      </LinearGradient>
    </View>
  );
}
