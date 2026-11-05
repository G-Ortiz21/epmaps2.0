import LottieView from 'lottie-react-native';
import { View } from 'react-native';

export default function LottieStatus() {
  return (
    <View
      accessible
      accessibilityLabel="Lectura guardada en el dispositivo"
      className="h-[180px] w-[180px]"
    >
      <LottieView
        autoPlay
        loop={false}
        source={require('../../assets/animations/lectura-exitosa.json')}
        style={{ width: 180, height: 180 }}
      />
    </View>
  );
}