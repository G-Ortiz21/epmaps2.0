
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useIsRestoring } from '@tanstack/react-query';

import { RouteScreen } from '../../../components/RouteScreen';
import { useConexion } from '../../../contexts/ConexionContext';
import { useRegistro } from '../../../contexts/RegistroContext';
import { ESTADOS_MEDIDOR, type EstadoMedidor } from '../../../domain/tipos';
import { evaluarEstadoOficina, validarCodigoMedidor } from '../../../domain/validaciones';
import { interpretarConsultaMedidor, useMedidorQuery } from '../../../hooks/useMedidorQuery';
import { existeLecturaEnPeriodo } from '../../../services/registroService';
const clasesDinamicas: Record<string, Record<string, string>> = {
  backgroundColor: {
    "#EAF4F8": "bg-[#EAF4F8]",
    "#062B52": "bg-[#062B52]",
    "#087FC4": "bg-[#087FC4]",
    "#DDF4FA": "bg-[#DDF4FA]",
    "#103E66": "bg-[#103E66]",
    "#5A788D": "bg-[#5A788D]",
    "#FFFFFF": "bg-blanco",
    "#D1E6F0": "bg-[#D1E6F0]",
    "#087F62": "bg-[#087F62]",
    "#D9F7E9": "bg-[#D9F7E9]",
    "#A96500": "bg-[#A96500]",
    "#FFF0C8": "bg-[#FFF0C8]",
    "#C7354F": "bg-[#C7354F]",
    "#FFE0E5": "bg-[#FFE0E5]",
    "#F1FAFF": "bg-[#F1FAFF]",
  },
  color: {
    "#EAF4F8": "text-[#EAF4F8]",
    "#062B52": "text-[#062B52]",
    "#087FC4": "text-[#087FC4]",
    "#DDF4FA": "text-[#DDF4FA]",
    "#103E66": "text-[#103E66]",
    "#5A788D": "text-[#5A788D]",
    "#FFFFFF": "text-blanco",
    "#D1E6F0": "text-[#D1E6F0]",
    "#087F62": "text-[#087F62]",
    "#D9F7E9": "text-[#D9F7E9]",
    "#A96500": "text-[#A96500]",
    "#FFF0C8": "text-[#FFF0C8]",
    "#C7354F": "text-[#C7354F]",
    "#FFE0E5": "text-[#FFE0E5]",
    "#F1FAFF": "text-[#F1FAFF]",
  },
};



const PALETA = {
  fondo: '#EAF4F8',
  azulOscuro: '#062B52',
  azul: '#087FC4',
  azulClaro: '#DDF4FA',
  texto: '#103E66',
  secundario: '#5A788D',
  blanco: '#FFFFFF',
  borde: '#D1E6F0',
  verde: '#087F62',
  verdeFondo: '#D9F7E9',
  ambar: '#A96500',
  ambarFondo: '#FFF0C8',
  rojo: '#C7354F',
  rojoFondo: '#FFE0E5',
};

const ESTADOS: Record<
  EstadoMedidor,
  { titulo: string; descripcion: string; icono: string; color: string; fondo: string }
> = {
  normal: {
    titulo: 'Normal',
    descripcion: 'El medidor responde. Exige registrar la lectura.',
    icono: '✓',
    color: PALETA.verde,
    fondo: PALETA.verdeFondo,
  },
  inaccesible: {
    titulo: 'Inaccesible',
    descripcion: 'No se pudo leer. Debes indicar el motivo; no admite lectura.',
    icono: '⌕',
    color: PALETA.ambar,
    fondo: PALETA.ambarFondo,
  },
  danado: {
    titulo: 'Dañado',
    descripcion: 'Debes describir el daño. La lectura es opcional.',
    icono: '!',
    color: PALETA.rojo,
    fondo: PALETA.rojoFondo,
  },
};

export default function EstadoMedidorScreen() {
  const { codigo } = useLocalSearchParams<{ codigo: string }>();
  const codigoMedidor = Array.isArray(codigo) ? '' : codigo ?? '';
  const { enLinea } = useConexion();

  const {
    registro,
    definirCodigoMedidor,
    definirEstadoMedidor,
    descartarRegistro,
  } = useRegistro();

  const [lecturaExistente, setLecturaExistente] =
    useState<boolean | null>(null);

  const errorCodigo =
    validarCodigoMedidor(codigoMedidor) === null
      ? null
      : 'Consulta un medidor válido antes de iniciar el registro.';

  // La consulta compartida por clave evita descargas duplicadas y permite
  // servir los datos persistidos sin conexión (ADR-015).
  const consultaMedidor = useMedidorQuery(codigoMedidor, enLinea);
  const restaurandoCache = useIsRestoring();

  const consulta = interpretarConsultaMedidor(consultaMedidor, {
    codigoNormalizado: codigoMedidor,
    codigoValido: errorCodigo === null,
    enLinea,
    restaurando: restaurandoCache,
  });

  useEffect(() => {
    if (
      errorCodigo === null &&
      registro.codigoMedidor !== codigoMedidor
    ) {
      definirCodigoMedidor(codigoMedidor);
    }
  }, [
    errorCodigo,
    codigoMedidor,
    registro.codigoMedidor,
    definirCodigoMedidor,
  ]);

  useEffect(() => {
    let vigente = true;

    if (errorCodigo !== null) {
      return () => {
        vigente = false;
      };
    }

    void existeLecturaEnPeriodo(codigoMedidor)
      .then((existe) => {
        if (vigente) setLecturaExistente(existe);
      })
      .catch(() => {
        if (vigente) setLecturaExistente(false);
      });

    return () => {
      vigente = false;
    };
  }, [codigoMedidor, errorCodigo]);

  const resultado = consulta.resultado;
  const error = errorCodigo ?? consulta.error ?? null;
  const cargando = consulta.cargando;

  const medidorEncontrado =
    resultado?.estado === 'encontrado' ? resultado.medidor : null;

  const decision =
    medidorEncontrado === null
      ? null
      : evaluarEstadoOficina(medidorEncontrado.estadoOficina);

  const permiteRegistrar =
    decision?.permiteContinuar === true ||
    resultado?.estado === 'sin_cache_sin_conexion';

  const registroOtroMedidor =
    registro.codigoMedidor !== null &&
    registro.codigoMedidor !== codigoMedidor &&
    registro.estadoMedidor !== null;

  if (registroOtroMedidor) {
    return (
      <RouteScreen
        title="Registro en curso"
        description={`Ya hay un registro sin guardar del medidor ${registro.codigoMedidor}. Continúalo o descártalo antes de iniciar uno nuevo.`}
        kicker="CONTROL PREVIO"
        showPendingNotice={false}
        links={[{ label: 'Volver al inicio', href: '/inicio' }]}
      >
        <View className={"p-[17px] rounded-[22px] bg-blanco gap-[12px]"}>
          <Text className={"text-[#103E66] text-[15px] font-[800]"}>Tienes un registro pendiente</Text>
          <Text className={"text-[#5A788D] text-[12px] leading-[19px]"}>
            Para comenzar con otro medidor, primero debes continuar o descartar
            el registro actual.
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(`/registro/${registro.paso}`)}
            className={["min-h-[52px] mt-[12px] px-[16px] rounded-[17px] flex-row items-center justify-between bg-[#087FC4]", "active:opacity-[0.8]"].filter(Boolean).join(' ')}
          >
            <Text className={"flex-1 text-blanco text-[13px] font-[800]"}>
              Continuar registro
            </Text>
            <Text className={"text-blanco text-[21px] ml-[10px]"}>→</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => void descartarRegistro()}
            className={["min-h-[48px] px-[15px] rounded-[15px] items-center justify-center bg-[#F0F7FA] border-[1px] border-[#C8E3EF]", "active:opacity-[0.8]"].filter(Boolean).join(' ')}
          >
            <Text className={"text-[#062B52] text-[12px] font-[800]"}>
              Descartar ese registro
            </Text>
          </Pressable>
        </View>
      </RouteScreen>
    );
  }

  return (
    <RouteScreen
      title="Estado del medidor"
      description="Indica cómo encontraste el medidor. El estado de oficina se comprueba por separado."
      kicker="PASO 1 DE 5 · CONTROL PREVIO"
      showPendingNotice={false}
      links={[{ label: 'Volver a consultar medidor', href: '/medidor' }]}
    >
      <View className={"flex-row items-center gap-[9px] mb-[16px]"}>
        <View className={"w-[34px] h-[34px] rounded-[12px] items-center justify-center bg-[#062B52]"}>
          <Text className={"text-[#8DEBFF] text-[24px] font-[700]"}>◇</Text>
        </View>
        <Text className={"text-[#5A788D] text-[10px] font-[800] tracking-[1px]"}>LECTURA ÁGIL · EPMAPS</Text>
      </View>

      <View className={"flex-row items-start gap-[13px] p-[16px] mb-[14px] rounded-[22px] bg-[#062B52]"}>
        <View className={"w-[46px] h-[46px] rounded-[16px] bg-[rgba(141,235,255,0.16)] items-center justify-center border-[1px] border-[rgba(141,235,255,0.32)]"}>
          <Text className={"text-[#8DEBFF] text-[17px] font-[900]"}>01</Text>
        </View>
        <View className={"flex-1"}>
          <Text className={"text-[#8DEBFF] text-[9px] font-[800] tracking-[1px]"}>PASO 1 DE 5</Text>
          <Text className={"text-blanco text-[17px] font-[800] mt-[4px]"}>Estado observado</Text>
          <Text className={"text-[#D5EAF7] text-[12px] leading-[18px] mt-[5px]"}>
            Comprueba el suministro y selecciona la condición física
            encontrada durante la visita.
          </Text>
        </View>
      </View>

      {medidorEncontrado !== null && (
        <View className={"flex-row items-center gap-[12px] p-[15px] mb-[16px] rounded-[22px] bg-blanco border-[1px] border-[#D5EAF2]"}>
          <View className={"w-[47px] h-[47px] rounded-[16px] bg-[#DDF4FA] items-center justify-center"}>
            <Text className={"text-[#087FC4] text-[29px] font-[800]"}>◇</Text>
          </View>
          <View className={"flex-1 min-w-[0px]"}>
            <Text className={"text-[#5A788D] text-[9px] font-[800] tracking-[0.7px]"}>MEDIDOR CONSULTADO</Text>
            <Text className={"text-[#103E66] text-[16px] font-[900] mt-[4px]"}>{medidorEncontrado.codigo}</Text>
            <Text className={"text-[#5A788D] text-[12px] leading-[19px]"}>
              Estado de oficina: {medidorEncontrado.estadoOficina}
            </Text>
          </View>
          <View className={"w-[9px] h-[9px] rounded-[5px] bg-[#20B990]"} />
        </View>
      )}

      {medidorEncontrado !== null && consulta.avisoActualizacion !== null && (
        <View className={"p-[17px] mb-[14px] rounded-[22px] bg-[#FFF3F4] border-[1px] border-[#F5CDD4] gap-[9px]"} accessibilityRole="alert">
          <Text className={"text-[#A92D43] text-[15px] font-[800]"}>Información posiblemente desactualizada</Text>
          <Text className={"text-[#963D4D] text-[12px] leading-[19px]"}>{consulta.avisoActualizacion}</Text>
        </View>
      )}

      {cargando && (
        <View className={"items-center p-[22px] mb-[14px] rounded-[22px] bg-blanco gap-[10px]"}>
          <ActivityIndicator size="large" color={PALETA.azul} />
          <Text className={"text-[#103E66] text-[15px] font-[800]"}>Verificando suministro</Text>
          <Text className={"text-[#5A788D] text-[12px] leading-[19px]"}>
            Consultando los datos disponibles de oficina y la información local.
          </Text>
        </View>
      )}

      {error !== null && (
        <View className={"p-[17px] mb-[14px] rounded-[22px] bg-[#FFF3F4] border-[1px] border-[#F5CDD4] gap-[9px]"} accessibilityRole="alert">
          <Text className={"text-[#C7354F] text-[24px] font-[900]"}>!</Text>
          <Text className={"text-[#A92D43] text-[15px] font-[800]"}>No se pudo completar la consulta</Text>
          <Text className={"text-[#963D4D] text-[12px] leading-[19px]"}>{error}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/medidor')}
            className={["min-h-[52px] mt-[12px] px-[16px] rounded-[17px] flex-row items-center justify-between bg-[#087FC4]", "active:opacity-[0.8]"].filter(Boolean).join(' ')}
          >
            <Text className={"flex-1 text-blanco text-[13px] font-[800]"}>Volver a consultar</Text>
            <Text className={"text-blanco text-[21px] ml-[10px]"}>→</Text>
          </Pressable>
        </View>
      )}

      {decision !== null && (
        <View
          className={(decision.permiteContinuar ? "flex-row items-start gap-[12px] p-[15px] mb-[14px] rounded-[20px] border-[1px] bg-[#D9F7E9] border-[#B5EBD3]" : "flex-row items-start gap-[12px] p-[15px] mb-[14px] rounded-[20px] border-[1px] bg-[#FFF0F2] border-[#F5CDD4]")}
          accessibilityRole="summary"
        >
          <View
            className={
              decision.permiteContinuar
                ? 'w-[36px] h-[36px] rounded-[13px] items-center justify-center bg-[#D9F7E9]'
                : 'w-[36px] h-[36px] rounded-[13px] items-center justify-center bg-[#FFE0E5]'
            }
          >
            <Text
              className={
                decision.permiteContinuar
                  ? 'text-[19px] font-[900] text-[#087F62]'
                  : 'text-[19px] font-[900] text-[#C7354F]'
              }
            >
              {decision.permiteContinuar ? '✓' : '!'}
            </Text>
          </View>
          <View className={"flex-1 gap-[5px]"}>
            <Text className={"text-[#103E66] text-[15px] font-[800]"}>
              {decision.permiteContinuar
                ? 'Puede continuar'
                : 'Requiere atención'}
            </Text>
            <Text className={"text-[#5A788D] text-[12px] leading-[19px]"}>{decision.mensaje}</Text>
          </View>
        </View>
      )}

      {resultado?.estado === 'sin_cache_sin_conexion' && (
        <View className={"p-[16px] mb-[14px] rounded-[20px] bg-[#FFF8E8] border-[1px] border-[#F2DDAA] gap-[9px]"}>
          <Text className={"text-[#A96500] text-[14px] font-[800]"}>⌁  Modo sin conexión</Text>
          <Text className={"text-[#805E32] text-[12px] leading-[19px]"}>
            No hay datos de oficina disponibles. Si continúas, la lectura
            quedará pendiente de verificación al recuperar la conexión.
          </Text>
        </View>
      )}

      {lecturaExistente === true && (
        <View className={"p-[17px] mb-[14px] rounded-[22px] bg-[#FFF3F4] border-[1px] border-[#F5CDD4] gap-[9px]"} accessibilityRole="summary">
          <Text className={"text-[#A92D43] text-[15px] font-[800]"}>
            Ya registraste este medidor este mes
          </Text>
          <Text className={"text-[#963D4D] text-[12px] leading-[19px]"}>
            Solo puede haber una lectura por medidor y periodo. Revisa el
            registro existente desde el historial.
          </Text>
        </View>
      )}

      {permiteRegistrar && lecturaExistente !== true && (
        <>
          <View className={"mt-[8px] mb-[12px]"}>
            <Text className={"text-[#103E66] text-[18px] font-[800]"}>Estado observado por el técnico</Text>
            <Text className={"text-[#5A788D] text-[12px] leading-[18px] mt-[4px]"}>
              Selecciona una sola opción para continuar.
            </Text>
          </View>

          <View className={"gap-[12px]"}>
            {ESTADOS_MEDIDOR.map((estado) => {
              const seleccionado = registro.estadoMedidor === estado;
              const apariencia = ESTADOS[estado];

              return (
                <Pressable
                  key={estado}
                  accessibilityRole="button"
                  accessibilityState={{ selected: seleccionado }}
                  onPress={() => definirEstadoMedidor(estado)}
                  className={[(seleccionado ? "flex-row items-start gap-[12px] p-[15px] min-h-[100px] rounded-[22px] bg-[#F1FAFF] border-[1px] border-[#087FC4]" : "flex-row items-start gap-[12px] p-[15px] min-h-[100px] rounded-[22px] bg-blanco border-[1px] border-[#D5EAF2]"), "active:opacity-[0.82]"].filter(Boolean).join(' ')}
                >
                  <View
                    className={["w-[43px] h-[43px] rounded-[15px] items-center justify-center", clasesDinamicas.backgroundColor[apariencia.fondo]].filter(Boolean).join(' ')}
                  >
                    <Text
                      className={["text-[21px] font-[900]", clasesDinamicas.color[apariencia.color]].filter(Boolean).join(' ')}
                    >
                      {apariencia.icono}
                    </Text>
                  </View>

                  <View className={"flex-1 gap-[5px]"}>
                    <Text className={"text-[#103E66] text-[15px] font-[800]"}>
                      {apariencia.titulo}
                    </Text>
                    <Text className={"text-[#5A788D] text-[12px] leading-[18px]"}>
                      {apariencia.descripcion}
                    </Text>
                    {seleccionado && (
                      <Text className={"text-[#087FC4] text-[11px] font-[800] mt-[3px]"}>
                        ✓ Seleccionado
                      </Text>
                    )}
                  </View>

                  <View
                    className={(seleccionado ? "w-[22px] h-[22px] rounded-[11px] border-[1.5px] border-[#087FC4] items-center justify-center" : "w-[22px] h-[22px] rounded-[11px] border-[1.5px] border-[#A8C7D7] items-center justify-center")}
                  >
                    {seleccionado && <View className={"w-[12px] h-[12px] rounded-[6px] bg-[#087FC4]"} />}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View className={"flex-row items-start gap-[10px] p-[13px] mt-[14px] mb-[14px] rounded-[17px] bg-[#DDF4FA]"}>
            <Text className={"w-[24px] h-[24px] rounded-[8px] text-center align-middle overflow-hidden bg-blanco text-[#087FC4] font-[900]"}>i</Text>
            <Text className={"flex-1 text-[#315F7B] text-[11px] leading-[17px]"}>
              La opción seleccionada determina los campos que se solicitarán
              en los siguientes pasos del registro.
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={registro.estadoMedidor === null}
            onPress={() => router.push('/registro/datos_lectura')}
            className={[(registro.estadoMedidor === null ? "min-h-[52px] mt-[12px] px-[16px] rounded-[17px] flex-row items-center justify-between bg-[#087FC4] opacity-[0.48]" : "min-h-[52px] mt-[12px] px-[16px] rounded-[17px] flex-row items-center justify-between bg-[#087FC4]"), "active:opacity-[0.8]"].filter(Boolean).join(' ')}
          >
            <Text className={"flex-1 text-blanco text-[13px] font-[800]"}>
              Siguiente: datos de lectura
            </Text>
            <Text className={"text-blanco text-[21px] ml-[10px]"}>→</Text>
          </Pressable>

          {registro.estadoMedidor === null && (
            <Text className={"text-[#5A788D] text-[11px] text-center mt-[9px]"}>
              Selecciona el estado observado para continuar.
            </Text>
          )}
        </>
      )}

      <Text className={"text-[#7190A3] text-[9px] font-[800] tracking-[1.2px] text-center mt-[24px]"}>LECTURA ÁGIL · EPMAPS</Text>
    </RouteScreen>
  );
}
