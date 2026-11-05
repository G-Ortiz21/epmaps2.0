import { Link, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface RouteLink {
  label: string;
  href: Href;
}

interface RouteScreenProps {
  title: string;
  description: string;
  links?: RouteLink[];
  children?: ReactNode;
  kicker?: string;
  showPendingNotice?: boolean;
}

export function RouteScreen({
  title,
  description,
  links = [],
  children,
  kicker = 'ESTRUCTURA DE NAVEGACIÓN',
  showPendingNotice = true,
}: RouteScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-fondo">
      <ScrollView contentContainerClassName="grow">
        <View className="bg-marca px-6 py-6">
          <Text className="text-xl font-semibold leading-[26px] text-blanco">
            LECTURA ÁGIL
          </Text>
          <Text className="mt-1 text-base leading-6 text-blanco">
            Registro técnico de medidores
          </Text>
        </View>

        <View className="gap-3 p-6">
          <Text className="text-sm font-medium leading-5 text-marca-oscura">
            {kicker}
          </Text>
          <Text className="text-[28px] font-bold leading-[34px] text-texto">
            {title}
          </Text>
          <Text className="text-base leading-6 text-texto-secundario">
            {description}
          </Text>

          {showPendingNotice && (
            <View
              className="gap-1 rounded-xl border border-borde bg-superficie p-4"
              accessibilityRole="summary"
            >
              <Text className="text-sm font-medium leading-5 text-advertencia">
                Funcionalidad pendiente
              </Text>
              <Text className="text-base leading-6 text-texto">
                Esta pantalla solo prepara la ruta. No inicia sesión, consulta
                datos ni guarda cambios.
              </Text>
            </View>
          )}

          {children}

          {links.length > 0 && (
            <View className="mt-2 gap-2">
              <Text className="mb-1 text-sm font-medium leading-5 text-texto-secundario">
                NAVEGACIÓN
              </Text>
              {links.map((link) => (
                <Link key={`${link.href}-${link.label}`} href={link.href} asChild>
                  <Pressable
                    accessibilityRole="button"
                    className="min-h-12 items-center justify-center rounded-lg border border-marca bg-superficie px-4 py-2 active:bg-superficie-suave"
                  >
                    <Text className="text-sm font-medium leading-5 text-marca-oscura">
                      {link.label}
                    </Text>
                  </Pressable>
                </Link>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
