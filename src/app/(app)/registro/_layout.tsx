
import { Stack } from 'expo-router';

export default function RegistroLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="estado_medidor" />
      <Stack.Screen name="datos_lectura" />
      <Stack.Screen name="revision_consumo" />
      <Stack.Screen name="fotografia" />
      <Stack.Screen name="resumen" />
    </Stack>
  );
}
