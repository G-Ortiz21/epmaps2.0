import { Stack } from 'expo-router';

export default function VerificacionLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="verificar-correo" />
    </Stack>
  );
}
