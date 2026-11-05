
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { mensajeErrorMedidor } from '../../../components/medidoresUi';
import { useConexion } from '../../../contexts/ConexionContext';
import { validarCodigoMedidor } from '../../../domain/validaciones';


import { useMedidorQuery } from '../../../hooks/useMedidorQuery';

export default function MedidorSearchScreen() {
  const { enLinea } = useConexion();

  const [codigo, setCodigo] = useState('');
  const [errorCampo, setErrorCampo] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [sinCacheOffline, setSinCacheOffline] = useState(false);
  const [consultando, setConsultando] = useState(false);
  const consultaMedidor = useMedidorQuery(codigo, enLinea);

  async function buscar(): Promise<void> {
    const codigoNormalizado = codigo.trim().toUpperCase();
    const errorValidacion = validarCodigoMedidor(codigoNormalizado);

    setErrorCampo(errorValidacion);
    setMensaje(null);
    setSinCacheOffline(false);

    if (errorValidacion !== null) return;

    setConsultando(true);

    try {
      if (consultaMedidor.data?.medidor.codigo === codigoNormalizado) {
        router.push({
          pathname: '/medidor/[codigo]',
          params: { codigo: consultaMedidor.data.medidor.codigo },
        });
        return;
      }

      if (!enLinea) {
        setSinCacheOffline(true);
        return;
      }

      const resultado = await consultaMedidor.refetch();

      if (resultado.error) {
        throw resultado.error;
      }

      if (!resultado.data) {
        setMensaje('No se encontraron datos para este medidor.');
        return;
      }

      router.push({
        pathname: '/medidor/[codigo]',
        params: { codigo: resultado.data.medidor.codigo },
      });
    } catch (consultaError: unknown) {
      setMensaje(mensajeErrorMedidor(consultaError));
    } finally {
      setConsultando(false);
    }
  }

  function cambiarCodigo(value: string) {
    const nuevoCodigo = value.toUpperCase();

    setCodigo(nuevoCodigo);
    setErrorCampo(
      nuevoCodigo.length > 0 ? validarCodigoMedidor(nuevoCodigo) : null,
    );
    setMensaje(null);
    setSinCacheOffline(false);
  }

  return (
    <View className={"flex-1 bg-[#EAF4F8]"}>
      <ScrollView
        contentContainerClassName={"pb-[48px]"}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Encabezado */}
        <View className={"bg-[#062B52] px-[16px] pt-[16px] pb-[36px] rounded-bl-[32px] rounded-br-[32px] overflow-hidden"}>
          <View pointerEvents="none" className={"absolute -top-[90px] -right-[70px] w-[240px] h-[240px] rounded-[120px] bg-[rgba(34,178,224,0.16)] border-[1px] border-[rgba(179,239,255,0.2)]"} />
          <View pointerEvents="none" className={"absolute -bottom-[100px] -left-[70px] w-[200px] h-[200px] rounded-[100px] bg-[rgba(0,207,190,0.12)] border-[1px] border-[rgba(179,239,255,0.16)]"} />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver al inicio"
            onPress={() => router.replace('/inicio')}
            className={["self-start flex-row items-center gap-[4px] px-[8px] py-[4px] mb-[16px] rounded-[99px] bg-[rgba(255,255,255,0.10)] border-[1px] border-[rgba(255,255,255,0.2)]", "active:opacity-[0.8]"].filter(Boolean).join(' ')}
          >
            <Text className={"text-blanco text-[20px]"}>←</Text>
            <Text className={"text-[#E0F6FF] text-[12px] font-[700]"}>Inicio</Text>
          </Pressable>

          <View className={"flex-row items-center gap-[8px] mb-[16px]"}>
            <View className={"w-[34px] h-[34px] rounded-[12px] items-center justify-center bg-[rgba(255,255,255,0.13)] border-[1px] border-[rgba(255,255,255,0.25)]"}>
              <Text className={"text-[#8DEBFF] text-[24px] font-[700]"}>◇</Text>
            </View>
            <Text className={"text-[10px] font-[500] leading-[20px] text-[#BDEBFA] tracking-[1px]"}>LECTURA ÁGIL · EPMAPS</Text>
          </View>

          <View className={"flex-row items-center gap-[8px]"}>
            <View className={"flex-1"}>
              <Text className={"text-[#7EE6E8] text-[9px] font-[800] tracking-[1.4px] mb-[8px]"}>GESTIÓN DE SUMINISTROS</Text>
              <Text className={"text-[29px] font-[700] leading-[35px] text-blanco"}>Consulta de</Text>
              <Text className={"text-[#65DCE5] text-[30px] leading-[36px] font-[800]"}>medidor.</Text>
            </View>

            <View className={"w-[72px] h-[82px] rounded-[25px] items-center justify-center bg-[rgba(255,255,255,0.10)] border-[1px] border-[rgba(180,240,255,0.35)]"}>
              <Text className={"text-[#9BEFFF] text-[55px] font-[300]"}>◇</Text>
            </View>
          </View>

          <Text className={"text-[12px] font-[400] leading-[20px] text-[#D5EAF7] mt-[12px]"}>
            Identifica el suministro para consultar su información y continuar
            con el proceso de lectura.
          </Text>

          <View className={"self-start flex-row items-center gap-[8px] mt-[16px] px-[12px] py-[8px] rounded-[99px] bg-[rgba(255,255,255,0.09)] border-[1px] border-[rgba(255,255,255,0.17)]"}>
            <View
              className={(enLinea ? "w-[8px] h-[8px] rounded-[4px] bg-[#51E1AF]" : "w-[8px] h-[8px] rounded-[4px] bg-[#FFC45C]")}
            />
            <Text className={"text-[#E0F6FF] text-[11px] font-[600]"}>
              {enLinea
                ? 'Conectividad de red disponible'
                : 'Modo sin conexión'}
            </Text>
          </View>
        </View>

        {/* Formulario de búsqueda */}
        <View className={"shadow-[0px_8px_18px_rgba(10,69,106,0.12)] mx-[12px] -mt-[12px] p-[16px] rounded-[26px] bg-[rgba(255,255,255,0.84)] border-[1px] border-blanco"}>
          <View className={"flex-row items-center gap-[12px] mb-[24px]"}>
            <View className={"w-[43px] h-[43px] rounded-[15px] items-center justify-center bg-[#DDF4FA] border-[1px] border-[#BDE7F2]"}>
              <Text className={"text-[#0879B6] text-[14px] font-[900]"}>01</Text>
            </View>
            <View className={"flex-1"}>
              <Text className={"text-[#103E66] text-[17px] font-[800]"}>Identificar medidor</Text>
              <Text className={"text-[#648196] text-[11px] mt-[4px]"}>
                Ingresa el código del suministro.
              </Text>
            </View>
          </View>

          <Text className={"text-[10px] font-[500] leading-[20px] text-[#315B76] tracking-[0.8px] mb-[8px]"}>CÓDIGO DEL MEDIDOR</Text>

          <View
            className={(errorCampo !== null ? "min-h-[57px] flex-row items-center gap-[8px] px-[12px] rounded-[18px] bg-[#FFF8F8] border-[1px] border-[#D94B61]" : "min-h-[57px] flex-row items-center gap-[8px] px-[12px] rounded-[18px] bg-[#F6FBFD] border-[1px] border-[#C7E2ED]")}
          >
            <View className={"w-[34px] h-[34px] rounded-[12px] items-center justify-center bg-[#DDF4FA]"}>
              <Text className={"text-[#0879B6] text-[28px] leading-[31px]"}>⌕</Text>
            </View>

            <TextInput
              accessibilityLabel="Código del medidor"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={10}
              onChangeText={cambiarCodigo}
              onSubmitEditing={() => void buscar()}
              placeholder="MED-123456"
              placeholderTextColor="#7993A5"
              returnKeyType="search"
              className={"flex-1 min-w-[0px] text-[#103E66] text-[16px] font-[700] py-[8px]"}
              value={codigo}
              editable={!consultando}
            />

            {codigo.length > 0 && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Borrar código"
                disabled={consultando}
                onPress={() => cambiarCodigo('')}
                className={"w-[30px] h-[30px] rounded-[15px] items-center justify-center bg-[#E2EFF5]"}
              >
                <Text className={"text-[#315B76] text-[22px]"}>×</Text>
              </Pressable>
            )}
          </View>

          <View className={"flex-row items-center gap-[8px] mt-[8px]"}>
            <Text className={"w-[17px] h-[17px] rounded-[9px] overflow-hidden text-center text-[#0879B6] bg-[#DDF4FA] text-[12px] font-[800]"}>i</Text>
            <Text className={"flex-1 text-[#648196] text-[11px] leading-[16px]"}>
              Formato esperado: MED- seguido de seis dígitos.
            </Text>
          </View>

          {errorCampo !== null && (
            <View className={"flex-row items-start gap-[8px] mt-[12px] p-[12px] rounded-[14px] bg-[#FFF0F2] border-[1px] border-[#F5CDD4]"}>
              <Text className={"text-[#C7354F] text-[15px] font-[900]"}>!</Text>
              <Text className={"flex-1 text-[#B52E47] text-[12px] leading-[18px]"}>{errorCampo}</Text>
            </View>
          )}

          <Pressable
            accessibilityRole="button"
            disabled={consultando}
            onPress={() => void buscar()}
            className={[(consultando ? "shadow-[0px_4px_10px_rgba(8,127,196,0.18)] min-h-[54px] flex-row items-center justify-center gap-[8px] mt-[16px] px-[12px] rounded-[17px] bg-[#087FC4] border-[1px] border-[#38B8DD] opacity-[0.65]" : "shadow-[0px_4px_10px_rgba(8,127,196,0.18)] min-h-[54px] flex-row items-center justify-center gap-[8px] mt-[16px] px-[12px] rounded-[17px] bg-[#087FC4] border-[1px] border-[#38B8DD]"), "active:bg-[#075D92]"].filter(Boolean).join(' ')}
          >
            {consultando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className={"text-blanco text-[25px]"}>⌕</Text>
            )}

            <Text className={"text-blanco text-[13px] font-[800]"}>
              {consultando ? 'Consultando medidor…' : 'Consultar medidor'}
            </Text>

            {!consultando && (
              <Text className={"text-blanco text-[20px] ml-[NaNpx]"}>→</Text>
            )}
          </Pressable>

          {mensaje !== null && (
            <View
              accessibilityRole="alert"
              className={"flex-row items-start gap-[8px] mt-[12px] p-[12px] rounded-[14px] bg-[#FFF0F2] border-[1px] border-[#F5CDD4]"}
            >
              <Text className={"text-[#C7354F] text-[15px] font-[900]"}>!</Text>
              <Text className={"flex-1 text-[#B52E47] text-[12px] leading-[18px]"}>{mensaje}</Text>
            </View>
          )}

          {sinCacheOffline && (
            <View className={"mt-[16px] p-[12px] rounded-[20px] bg-[#FFF8E8] border-[1px] border-[#F2DDAA]"} accessibilityRole="summary">
              <View className={"flex-row items-center gap-[8px]"}>
                <View className={"w-[42px] h-[42px] rounded-[14px] bg-[#FFE8B5] items-center justify-center"}>
                  <Text className={"text-[#A96500] text-[25px] font-[800]"}>⌁</Text>
                </View>
                <View className={"flex-1"}>
                  <Text className={"text-[#80511A] text-[15px] font-[800]"}>
                    Sin datos disponibles
                  </Text>
                  <Text className={"text-[#A96500] text-[8px] tracking-[0.7px] font-[800] mt-[4px]"}>
                    CONSULTA LOCAL NO DISPONIBLE
                  </Text>
                </View>
              </View>

              <Text className={"text-[#805E32] text-[12px] leading-[19px] mt-[12px]"}>
                No hay conexión disponible ni información guardada para este
                medidor. Puedes continuar indicando su estado, pero la lectura
                quedará pendiente de verificación según el flujo de registro.
              </Text>

              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: '/registro/estado_medidor',
                    params: { codigo: codigo.trim().toUpperCase() },
                  })
                }
                className={["min-h-[47px] mt-[12px] px-[12px] rounded-[14px] flex-row items-center justify-between gap-[8px] bg-[#A96500]", "active:opacity-[0.8]"].filter(Boolean).join(' ')}
              >
                <Text className={"flex-1 text-blanco text-[11px] font-[800]"}>
                  Continuar sin datos de oficina
                </Text>
                <Text className={"text-blanco text-[19px]"}>→</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Orientación para el técnico */}
        <View className={"mx-[12px] mt-[16px] p-[12px] rounded-[20px] flex-row items-start gap-[12px] bg-[rgba(221,244,250,0.75)] border-[1px] border-blanco"}>
          <View className={"w-[35px] h-[35px] rounded-[12px] bg-[#C9F2E3] items-center justify-center"}>
            <Text className={"text-[#087F62] text-[17px] font-[900]"}>✓</Text>
          </View>
          <View className={"flex-1"}>
            <Text className={"text-[#16496D] text-[12px] font-[800]"}>Antes de continuar</Text>
            <Text className={"text-[#5A788D] text-[11px] leading-[17px] mt-[4px]"}>
              Comprueba que el código corresponda al medidor que estás
              inspeccionando.
            </Text>
          </View>
        </View>

        <Text className={"text-[#7190A3] text-[9px] font-[700] tracking-[1.4px] text-center mt-[16px]"}>LECTURA ÁGIL · EPMAPS</Text>
      </ScrollView>
    </View>
  );
}
