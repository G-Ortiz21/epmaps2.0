import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useIsRestoring } from '@tanstack/react-query';

import { MedidorCard } from '../../../components/MedidorCard';
import { useConexion } from '../../../contexts/ConexionContext';
import { evaluarEstadoOficina, validarCodigoMedidor } from '../../../domain/validaciones';
import {
  interpretarConsultaMedidor,
  normalizarCodigoMedidor,
  useMedidorQuery,
} from '../../../hooks/useMedidorQuery';

import { useRegistro } from '../../../contexts/RegistroContext';

export default function MedidorDetailScreen() {
  const { codigo } = useLocalSearchParams<{ codigo: string }>();
  const codigoMedidor = normalizarCodigoMedidor(
    Array.isArray(codigo) ? '' : codigo ?? '',
  );
  const { enLinea } = useConexion();
  const isRestoring = useIsRestoring();
  const {
    registro,
    hayRegistroPendiente,
  } = useRegistro();

  const errorCodigo =
    validarCodigoMedidor(codigoMedidor) === null
      ? null
      : 'El código del medidor no tiene un formato válido.';

  const consultaMedidor = useMedidorQuery(codigoMedidor, enLinea);

  const consulta = interpretarConsultaMedidor(consultaMedidor, {
    codigoNormalizado: codigoMedidor,
    codigoValido: errorCodigo === null,
    enLinea,
    restaurando: isRestoring,
  });

  const resultado = consulta.resultado;

  const error = errorCodigo ?? consulta.error;

  // Evitamos mostrar carga o estado vacío prematuro mientras la caché se está restaurando de AsyncStorage
  const cargando = consulta.cargando;

  const medidorEncontrado =
    resultado?.estado === 'encontrado' ? resultado : null;

  const decision =
    medidorEncontrado === null
      ? null
      : evaluarEstadoOficina(medidorEncontrado.medidor.estadoOficina);

  const puedeRegistrar =
    resultado?.estado === 'sin_cache_sin_conexion' ||
    decision?.permiteContinuar === true;

  function volverAConsultar() {
    router.replace('/medidor');
  }

  function registrarLectura(): void {
    const puedeRecuperarBorrador =
      hayRegistroPendiente &&
      registro.codigoMedidor === codigoMedidor;

    const pasoDestino = puedeRecuperarBorrador
      ? registro.paso
      : 'estado_medidor';

    router.push({
      pathname: `/registro/${pasoDestino}` as
        | '/registro/estado_medidor'
        | '/registro/datos_lectura'
        | '/registro/revision_consumo'
        | '/registro/fotografia'
        | '/registro/resumen',
      params: {
        codigo: codigoMedidor,
      },
    });
  }

  return (
    <View className={"flex-1 bg-[#EAF4F8]"}>
      <ScrollView
        contentContainerClassName={"pb-[36px]"}
        showsVerticalScrollIndicator={false}
      >
        {/* Encabezado */}
        <View className={"bg-[#062B52] px-[22px] pt-[20px] pb-[30px] rounded-bl-[32px] rounded-br-[32px] overflow-hidden"}>
          <View pointerEvents="none" className={"absolute -top-[90px] -right-[70px] w-[240px] h-[240px] rounded-[120px] bg-[rgba(34,178,224,0.16)] border-[1px] border-[rgba(179,239,255,0.2)]"} />
          <View pointerEvents="none" className={"absolute -bottom-[110px] -left-[70px] w-[210px] h-[210px] rounded-[105px] bg-[rgba(0,207,190,0.12)] border-[1px] border-[rgba(179,239,255,0.16)]"} />

          <Pressable
            accessibilityRole="button"
            onPress={volverAConsultar}
            className={["self-start flex-row items-center gap-[7px] px-[12px] py-[7px] mb-[22px] rounded-[99px] bg-[rgba(255,255,255,0.10)] border-[1px] border-[rgba(255,255,255,0.2)]", "active:opacity-[0.8]"].filter(Boolean).join(' ')}
          >
            <Text className={"text-blanco text-[20px]"}>←</Text>
            <Text className={"text-[#E0F6FF] text-[12px] font-[700]"}>Volver a consulta</Text>
          </Pressable>

          <View className={"flex-row items-center gap-[9px] mb-[24px]"}>
            <View className={"w-[34px] h-[34px] rounded-[12px] items-center justify-center bg-[rgba(255,255,255,0.13)] border-[1px] border-[rgba(255,255,255,0.25)]"}>
              <Text className={"text-[#8DEBFF] text-[24px] font-[700]"}>◇</Text>
            </View>
            <Text className={"text-[#BDEBFA] text-[10px] font-[700] tracking-[1px]"}>LECTURA ÁGIL · EPMAPS</Text>
          </View>

          <Text className={"text-[#7EE6E8] text-[9px] font-[800] tracking-[1.4px] mb-[8px]"}>INFORMACIÓN DEL SUMINISTRO</Text>
          <Text className={"text-[29px] font-[700] leading-[35px] text-blanco"}>Detalle del</Text>
          <Text className={"text-[#65DCE5] text-[30px] leading-[37px] font-[800]"}>medidor.</Text>

          <Text className={"text-[12px] font-[400] leading-[20px] text-[#D5EAF7] mt-[10px]"}>
            Revisa la información disponible antes de registrar una nueva
            lectura.
          </Text>

          <View className={"flex-row items-center gap-[12px] mt-[22px] p-[14px] rounded-[20px] bg-[rgba(255,255,255,0.10)] border-[1px] border-[rgba(255,255,255,0.22)]"}>
            <View className={"w-[43px] h-[43px] rounded-[15px] items-center justify-center bg-[rgba(92,218,232,0.20)] border-[1px] border-[rgba(141,235,255,0.42)]"}>
              <Text className={"text-[#B5F6FF] text-[30px] font-[700]"}>◇</Text>
            </View>

            <View className={"flex-1 min-w-[0px]"}>
              <Text className={"text-[#A6D7EA] text-[9px] tracking-[1px] font-[700] mb-[5px]"}>CÓDIGO CONSULTADO</Text>
              <Text className={"text-blanco text-[16px] font-[800]"}>
                {codigoMedidor || 'Código no disponible'}
              </Text>
            </View>

            <View className={"w-[9px] h-[9px] rounded-[5px] bg-[#51E1AF]"} />
          </View>
        </View>

        {/* Sección de consulta */}
        <View className={"mx-[22px] mt-[25px] mb-[13px]"}>
          <View>
            <Text className={"text-[#103E66] text-[19px] font-[800]"}>Resultado de consulta</Text>
            <Text className={"text-[#5A788D] text-[12px] mt-[4px]"}>
              Información obtenida para este suministro.
            </Text>
          </View>
        </View>

        {cargando && (
          <View className={"mx-[16px] items-center p-[25px] rounded-[24px] bg-[rgba(255,255,255,0.82)] border-[1px] border-blanco"}>
            <View className={"w-[58px] h-[58px] rounded-[21px] bg-[#DDF4FA] items-center justify-center mb-[14px]"}>
              <ActivityIndicator size="large" color="#087FC4" />
            </View>
            <Text className={"text-[#103E66] text-[17px] font-[800] text-center"}>Consultando medidor</Text>
            <Text className={"text-[#5A788D] text-[12px] leading-[19px] text-center mt-[8px]"}>
              Estamos recuperando los datos disponibles del suministro.
            </Text>
          </View>
        )}

        {error !== null && !cargando && (
          <View className={"mx-[16px] p-[18px] rounded-[23px] bg-[#FFF3F4] border-[1px] border-[#F5CDD4]"} accessibilityRole="alert">
            <View className={"w-[43px] h-[43px] rounded-[15px] bg-[#FFE0E5] items-center justify-center mb-[12px]"}>
              <Text className={"text-[#C7354F] text-[25px] font-[900]"}>!</Text>
            </View>
            <Text className={"text-[#A92D43] text-[16px] font-[800]"}>
              No se pudo completar la consulta
            </Text>
            <Text className={"text-[#963D4D] text-[12px] leading-[19px] mt-[7px]"}>{error}</Text>

            <Pressable
              accessibilityRole="button"
              onPress={volverAConsultar}
              className={["min-h-[45px] mt-[15px] rounded-[14px] px-[14px] flex-row items-center justify-between bg-[#C7354F]", "active:opacity-[0.8]"].filter(Boolean).join(' ')}
            >
              <Text className={"text-blanco text-[12px] font-[800]"}>
                Volver a consultar
              </Text>
              <Text className={"text-blanco text-[19px]"}>→</Text>
            </Pressable>
          </View>
        )}

        {resultado?.estado === 'sin_cache_sin_conexion' && (
          <View className={"mx-[16px] p-[17px] rounded-[23px] bg-[#FFF8E8] border-[1px] border-[#F2DDAA]"}>
            <View className={"flex-row items-center gap-[11px]"}>
              <View className={"w-[43px] h-[43px] rounded-[15px] items-center justify-center bg-[#FFE8B5]"}>
                <Text className={"text-[#A96500] text-[26px] font-[800]"}>⌁</Text>
              </View>
              <View className={"flex-1"}>
                <Text className={"text-[#80511A] text-[15px] font-[800]"}>
                  Información no disponible
                </Text>
                <Text className={"text-[#A96500] text-[9px] font-[800] tracking-[0.7px] mt-[4px]"}>
                  MODO SIN CONEXIÓN
                </Text>
              </View>
            </View>

            <Text className={"text-[#805E32] text-[12px] leading-[19px] mt-[13px]"}>
              No hay conexión ni una copia local de este medidor. Si continúas,
              el registro deberá quedar pendiente de verificación según las
              reglas de la aplicación.
            </Text>
          </View>
        )}

        {medidorEncontrado !== null && (
          <View className={"mx-[16px]"}>
            <View className={"flex-row items-center gap-[7px] self-start px-[11px] py-[7px] mb-[10px] rounded-[99px] bg-[#D9F7E9] border-[1px] border-[#B5EBD3]"}>
              <View className={"w-[7px] h-[7px] rounded-[4px] bg-[#087F62]"} />
              <Text className={"text-[#087F62] text-[9px] font-[800] tracking-[0.6px]"}>
                MEDIDOR ENCONTRADO
              </Text>
            </View>

            <View className={"rounded-[23px] overflow-hidden"}>
              <MedidorCard
                medidor={medidorEncontrado.medidor}
                origen={medidorEncontrado.origen}
                consultadoEn={medidorEncontrado.consultadoEn}
              />
            </View>

            {consulta.avisoActualizacion !== null && (
              <View
                accessibilityRole="alert"
                className={"mt-[13px] p-[14px] rounded-[18px] bg-[#FFF8E8] border-[1px] border-[#F2DDAA]"}
              >
                <Text className={"text-[#80511A] text-[13px] font-[800]"}>
                  Información posiblemente desactualizada
                </Text>
                <Text className={"text-[#805E32] text-[12px] leading-[18px] mt-[5px]"}>
                  {consulta.avisoActualizacion}
                </Text>
              </View>
            )}

            {decision !== null && (
              <View
                accessibilityRole="summary"
                className={(decision.permiteContinuar ? "flex-row items-start gap-[12px] p-[15px] mt-[13px] rounded-[20px] border-[1px] bg-[rgba(217,247,233,0.88)] border-[#B5EBD3]" : "flex-row items-start gap-[12px] p-[15px] mt-[13px] rounded-[20px] border-[1px] bg-[#FFF0F2] border-[#F5CDD4]")}
              >
                <View
                  className={(decision.permiteContinuar ? "w-[36px] h-[36px] rounded-[13px] items-center justify-center bg-[#C1EED9]" : "w-[36px] h-[36px] rounded-[13px] items-center justify-center bg-[#FFDCE2]")}
                >
                  <Text
                    className={(decision.permiteContinuar ? "text-[19px] font-[900] text-[#087F62]" : "text-[19px] font-[900] text-[#C7354F]")}
                  >
                    {decision.permiteContinuar ? '✓' : '!'}
                  </Text>
                </View>

                <View className={"flex-1"}>
                  <Text className={"text-[#16496D] text-[13px] font-[800] mb-[4px]"}>
                    {decision.permiteContinuar
                      ? 'Puede continuar'
                      : 'Requiere atención'}
                  </Text>
                  <Text
                    className={(!decision.permiteContinuar ? "text-[#963D4D] text-[12px] leading-[18px]" : "text-[#286B56] text-[12px] leading-[18px]")}
                  >
                    {decision.mensaje}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Acción principal */}
        {puedeRegistrar && (
          <View className={"shadow-[0px_5px_13px_rgba(10,69,106,0.08)] mx-[16px] mt-[18px] p-[17px] rounded-[24px] bg-[rgba(255,255,255,0.82)] border-[1px] border-blanco"}>
            <View className={"flex-row items-center gap-[12px] mb-[16px]"}>
              <View className={"w-[45px] h-[45px] rounded-[16px] items-center justify-center bg-[#DDF4FA] border-[1px] border-[#BDE7F2]"}>
                <Text className={"text-[#0879B6] text-[25px] font-[800]"}>▤</Text>
              </View>
              <View className={"flex-1"}>
                <Text className={"text-[#103E66] text-[15px] font-[800]"}>
                  Siguiente paso
                </Text>
                <Text className={"text-[#5A788D] text-[11px] leading-[17px] mt-[4px]"}>
                  Continúa al registro para indicar el estado del medidor.
                </Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={registrarLectura}
              className={["shadow-[0px_4px_10px_rgba(8,127,196,0.18)] min-h-[53px] px-[16px] rounded-[17px] flex-row items-center justify-between bg-[#087FC4] border-[1px] border-[#38B8DD]", "active:bg-[#075D92]"].filter(Boolean).join(' ')}
            >
              <Text className={"text-blanco text-[13px] font-[800]"}>
                Registrar lectura
              </Text>
              <Text className={"text-blanco text-[21px]"}>→</Text>
            </Pressable>
          </View>
        )}

        <View className={"flex-row items-start gap-[10px] mx-[16px] mt-[18px] p-[14px] rounded-[18px] bg-[rgba(221,244,250,0.76)] border-[1px] border-blanco"}>
          <View className={"w-[25px] h-[25px] rounded-[9px] items-center justify-center bg-blanco"}>
            <Text className={"text-[#0879B6] text-[14px] font-[900]"}>i</Text>
          </View>
          <Text className={"flex-1 text-[#5A788D] text-[11px] leading-[17px]"}>
            La información mostrada depende de los datos disponibles en
            oficina o en la caché local.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/inicio')}
          className={["self-center mt-[18px] px-[17px] py-[11px] rounded-[99px] border-[1px] border-[#C5E0EB] bg-[rgba(255,255,255,0.65)]", "active:opacity-[0.8]"].filter(Boolean).join(' ')}
        >
          <Text className={"text-[#315F7B] text-[12px] font-[700]"}>Volver al inicio</Text>
        </Pressable>

        <Text className={"text-[#7190A3] text-[9px] font-[700] tracking-[1.4px] text-center mt-[20px]"}>LECTURA ÁGIL · EPMAPS</Text>
      </ScrollView>
    </View>
  );
}
