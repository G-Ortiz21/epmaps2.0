
import { Stack } from 'expo-router';
import { RegistroProvider } from '../../contexts/RegistroContext';

export default function AppLayout() {
  return (
    <RegistroProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="inicio" />
        <Stack.Screen name="perfil" />
        <Stack.Screen name="cambiar-clave" />
        <Stack.Screen name="lecturas" />
        <Stack.Screen name="medidor/index" />
        <Stack.Screen name="medidor/[codigo]" />
        <Stack.Screen name="registro" />
      </Stack>
    </RegistroProvider>
  );
}
