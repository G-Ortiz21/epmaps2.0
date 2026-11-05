
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { RouteScreen } from '../../../components/RouteScreen';
import { useConexion } from '../../../contexts/ConexionContext';
import { useRegistro } from '../../../contexts/RegistroContext';
import { useSesion } from '../../../contexts/SesionContext';
import { calcularConsumo } from '../../../domain/consumo';
import { crearPeriodoLocal } from '../../../domain/identidadLectura';
import { determinarEstadoVerificacion } from '../../../domain/reglasLectura';
import { validarRegistro } from '../../../domain/validaciones';
import { useMedidorQuery } from '../../../hooks/useMedidorQuery';
import { obtenerRutaFoto } from '../../../services/fotoService';
import { guardarLecturaLocal, LecturaYaRegistradaError } from '../../../services/registroService';



const ETIQUETAS_ESTADO = {
  normal: 'Normal',
  inaccesible: 'Inaccesible',
  danado: 'Dañado',
} as const;

export default function ResumenScreen() {
  const { registro, cargandoBorrador, definirPaso, reiniciarRegistro } =
    useRegistro();
  const { tecnicoCodigo } = useSesion();
  const { enLinea } = useConexion();

  const [guardando, setGuardando] = useState(false);
  const [guardada, setGuardada] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [faltantes, setFaltantes] = useState<string[]>([]);

  const codigoMedidor = registro.codigoMedidor;
  const estado = registro.estadoMedidor;
  const datos = registro.datos;

  // Los datos de oficina sirven de referencia: vienen de la consulta
  // compartida (caché persistida u oficina, ADR-015). Sin ellos, el resumen
  // usa lo registrado por el técnico.
  const consultaMedidor = useMedidorQuery(codigoMedidor ?? '', enLinea);
  const medidor = consultaMedidor.data?.medidor ?? null;

  useEffect(() => {
    if (!cargandoBorrador) {
      definirPaso('resumen');
    }
  }, [cargandoBorrador, definirPaso]);

  if (cargandoBorrador) {
    return (
      <RouteScreen
        title="Resumen del registro"
        description="Recuperando el registro guardado…"
        kicker="PASO 5 DE 5 · RESUMEN"
        showPendingNotice={false}
      />
    );
  }

  // 2. Después, mostrar el éxito aunque el registro ya se haya reiniciado.
if (guardada) {
  return (
    <View className={"shadow-[0px_4px_10px_rgba(6,43,82,0.06)] bg-blanco border-[#9ADBC5] rounded-[24px] border-[1px] gap-[12px] p-[16px] items-start"}>
      <View className={"w-[54px] h-[54px] rounded-[18px] bg-[#E1F6ED] items-center justify-center"}>
        <Text className={"text-[#087F62] text-[30px] font-[900]"}>✓</Text>
      </View>

      <Text className={"text-[20px] font-[800] leading-[26px] text-[#087F62]"}>
        ¡Lectura registrada!
      </Text>

      <Text className={"text-[16px] font-[400] leading-[23px] text-[#245B4B]"}>
        La lectura se guardó correctamente en el dispositivo.
        Quedará pendiente de sincronización hasta que haya conexión.
      </Text>

      <Pressable
        className={"shadow-[0px_4px_8px_rgba(8,127,196,0.2)] items-center bg-[#087FC4] rounded-[18px] justify-center mt-[8px] min-h-[48px] px-[16px] py-[12px]"}
        onPress={() => router.replace('/inicio')}
      >
        <Text className={"text-[15px] font-[800] leading-[20px] text-blanco text-center"}>
          Volver al inicio
        </Text>
      </Pressable>
    </View>
  );
}

  if (codigoMedidor === null || estado === null) {
    return (
      <RouteScreen
        title="Resumen del registro"
        description="Primero completa los pasos anteriores del asistente."
        kicker="PASO 5 DE 5 · RESUMEN"
        showPendingNotice={false}
        links={[{ label: 'Consultar medidor', href: '/medidor' }]}
      />
    );
  }

  const periodo = crearPeriodoLocal(new Date());

  const lecturaActual =
    datos.lectura === null ||
    datos.lectura === undefined ||
    datos.lectura === ''
      ? null
      : Number(datos.lectura);

  const lecturaAnterior =
    datos.lecturaAnterior ?? medidor?.ultimaLectura ?? null;

  const consumo = calcularConsumo(lecturaActual, lecturaAnterior);

  const verificacion = determinarEstadoVerificacion({
    lectura: lecturaActual,
    lecturaAnterior,
    enLinea,
  });

  const rutaFoto = datos.fotoNombre
    ? obtenerRutaFoto(datos.fotoNombre)
    : null;

  async function guardar(): Promise<void> {
    if (codigoMedidor === null || estado === null) {
      return;
    }

    const estadoTecnico = estado;

    setGuardando(true);
    setMensaje(null);

    const errores = validarRegistro(estadoTecnico, datos);
    const camposFaltantes = Object.values(errores);

    if (camposFaltantes.length > 0) {
      setFaltantes(camposFaltantes);
      setGuardando(false);
      return;
    }

    setFaltantes([]);

    try {
      await guardarLecturaLocal({
        codigoMedidor,
        estadoMedidor: estadoTecnico,
        datos,
        tecnicoCodigo,
        enLinea,
        promedioMensual: medidor?.promedioMensual ?? null,
      });

      reiniciarRegistro();
      setGuardada(true);
    } catch (error: unknown) {
      if (error instanceof LecturaYaRegistradaError) {
        setMensaje(
          'Ya existe una lectura de este medidor en el mes actual. No se guardó una segunda.',
        );
      } else {
        setMensaje(
          'No se pudo guardar la lectura en el dispositivo. Inténtalo de nuevo.',
        );
      }
    } finally {
      setGuardando(false);
    }
  }

  if (guardada) {
    return (
      <View className={"flex-1 bg-[#EAF4F8]"}>
        <View className={"bg-[#062B52] rounded-bl-[30px] rounded-br-[30px] px-[24px] pt-[54px] pb-[28px] overflow-hidden"}>
          <View className={"absolute w-[190px] h-[190px] rounded-[95px] bg-[rgba(34,178,224,0.15)] -top-[90px] -right-[45px]"} />
          <View className={"absolute w-[130px] h-[130px] rounded-[65px] bg-[rgba(0,207,190,0.12)] -bottom-[65px] left-[30px]"} />

          <Text className={"text-[#A8E8F8] text-[12px] font-[800] tracking-[1.6px] mb-[22px]"}>LECTURA ÁGIL · EPMAPS</Text>
          <Text className={"text-[#A8E8F8] text-[11px] font-[800] tracking-[1.4px] mb-[10px]"}>PASO 5 DE 5 · RESUMEN</Text>
          <Text className={"text-blanco text-[29px] font-[800] leading-[36px] mb-[10px]"}>
            Lectura <Text className={"text-[#53D6E8]"}>guardada</Text>
          </Text>
          <Text className={"text-[#D5EAF7] text-[14px] leading-[22px] max-w-[340px]"}>
            Tu registro quedó almacenado en este dispositivo.
          </Text>
        </View>

        <ScrollView
          contentContainerClassName={"p-[20px] pb-[36px] gap-[16px]"}
          showsVerticalScrollIndicator={false}
        >
          <View className={"shadow-[0px_4px_10px_rgba(6,43,82,0.06)] bg-blanco border-[#9ADBC5] rounded-[24px] border-[1px] gap-[12px] p-[16px] items-start"}>
            <View className={"w-[54px] h-[54px] rounded-[18px] bg-[#E1F6ED] items-center justify-center"}>
              <Text className={"text-[#087F62] text-[30px] font-[900]"}>✓</Text>
            </View>

            <Text className={"text-[20px] font-[800] leading-[26px] text-[#087F62]"}>
              Guardada en el dispositivo
            </Text>

            <Text className={"text-[16px] font-[400] leading-[23px] text-[#245B4B]"}>
              Aún no se ha enviado a la oficina. La aplicación la enviará
              cuando haya conexión.
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/inicio')}
            className={["shadow-[0px_4px_8px_rgba(8,127,196,0.2)] items-center bg-[#087FC4] rounded-[18px] justify-center mt-[8px] min-h-[48px] px-[16px] py-[12px]", "active:bg-[#075D92] active:scale-[0.99]"].filter(Boolean).join(' ')}
          >
            <Text className={"text-[15px] font-[800] leading-[20px] text-blanco text-center"}>Volver al inicio</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className={"flex-1 bg-[#EAF4F8]"}>
      <View className={"bg-[#062B52] rounded-bl-[30px] rounded-br-[30px] px-[24px] pt-[54px] pb-[28px] overflow-hidden"}>
        <View className={"absolute w-[190px] h-[190px] rounded-[95px] bg-[rgba(34,178,224,0.15)] -top-[90px] -right-[45px]"} />
        <View className={"absolute w-[130px] h-[130px] rounded-[65px] bg-[rgba(0,207,190,0.12)] -bottom-[65px] left-[30px]"} />

        <Text className={"text-[#A8E8F8] text-[12px] font-[800] tracking-[1.6px] mb-[22px]"}>LECTURA ÁGIL · EPMAPS</Text>
        <Text className={"text-[#A8E8F8] text-[11px] font-[800] tracking-[1.4px] mb-[10px]"}>PASO 5 DE 5 · RESUMEN</Text>

        <Text className={"text-blanco text-[29px] font-[800] leading-[36px] mb-[10px]"}>
          Resumen del <Text className={"text-[#53D6E8]"}>registro</Text>
        </Text>

        <Text className={"text-[#D5EAF7] text-[14px] leading-[22px] max-w-[340px]"}>
          Revisa la información antes de guardar la lectura en el dispositivo.
        </Text>

        <View className={"flex-row gap-[6px] mt-[22px]"}>
          <View className={"flex-1 h-[4px] rounded-[4px] bg-[#53D6E8]"} />
          <View className={"flex-1 h-[4px] rounded-[4px] bg-[#53D6E8]"} />
          <View className={"flex-1 h-[4px] rounded-[4px] bg-[#53D6E8]"} />
          <View className={"flex-1 h-[4px] rounded-[4px] bg-[#53D6E8]"} />
          <View className={"flex-1 h-[4px] rounded-[4px] bg-blanco"} />
        </View>
      </View>

      <ScrollView
        contentContainerClassName={"p-[20px] pb-[36px] gap-[16px]"}
        showsVerticalScrollIndicator={false}
      >
        <View className={"shadow-[0px_5px_12px_rgba(6,43,82,0.07)] bg-blanco border-[#D7E8F1] rounded-[24px] border-[1px] gap-[12px] p-[16px]"}>
          <View className={"flex-row items-center gap-[14px]"}>
            <View className={"w-[48px] h-[48px] rounded-[16px] bg-[#E5F5FC] items-center justify-center"}>
              <Text className={"text-[#087FC4] text-[21px] font-[900]"}>M</Text>
            </View>

            <View className={"flex-1 gap-[4px]"}>
              <Text className={"text-[#5A7185] text-[10px] font-[800] tracking-[1px]"}>CÓDIGO DEL MEDIDOR</Text>
              <Text className={"font-mono text-[22px] font-[800] leading-[20px] text-[#062B52]"}>{codigoMedidor}</Text>
            </View>
          </View>

          <View className={"h-[1px] bg-[#EAF1F5]"} />

          <View className={"bg-[#EAF7FC] rounded-[16px] p-[12px] gap-[5px]"}>
            <Text className={"text-[#5A7185] text-[10px] font-[800] tracking-[0.8px]"}>PERÍODO DEL REGISTRO</Text>
            <Text className={"text-[#087FC4] text-[15px] font-[800]"}>{periodo}</Text>
          </View>

          <Fila
            etiqueta="ESTADO DEL MEDIDOR"
            valor={ETIQUETAS_ESTADO[estado]}
          />

          <Fila
            etiqueta="LECTURA ACTUAL"
            valor={
              lecturaActual === null
                ? 'Sin lectura'
                : String(lecturaActual)
            }
          />

          <Fila
            etiqueta="LECTURA ANTERIOR"
            valor={
              lecturaAnterior === null
                ? 'Sin dato previo'
                : String(lecturaAnterior)
            }
          />

          <Fila
            etiqueta="CONSUMO"
            valor={consumo === null ? 'No calculable' : String(consumo)}
          />

          {estado === 'inaccesible' && datos.motivo != null && (
            <Fila etiqueta="MOTIVO" valor={datos.motivo} />
          )}

          {estado === 'danado' && datos.descripcion != null && (
            <Fila etiqueta="DAÑO DESCRITO" valor={datos.descripcion} />
          )}

          <Fila
            etiqueta="FOTOGRAFÍA"
            valor={
              datos.fotoNombre === null
                ? 'Sin fotografía'
                : rutaFoto === null
                  ? 'Archivo no disponible'
                  : 'Adjunta'
            }
          />

          <View className={"gap-[8px] bg-[#F5F9FC] p-[12px] rounded-[14px]"}>
            <Text className={"text-[12px] font-[700] leading-[16px] text-[#5A7185] tracking-[0.5px]"}>VERIFICACIÓN</Text>

            <Text
              className={(verificacion === 'verificada' ? "text-[13px] font-[700] leading-[20px] text-[#087F62]" : "text-[13px] font-[700] leading-[20px] text-[#A96500]")}
            >
              {verificacion === 'verificada'
                ? '✓ Datos completos para verificar'
                : 'Pendiente de verificar con los datos de oficina'}
            </Text>
          </View>
        </View>

        {rutaFoto !== null && (
          <View className={"gap-[10px]"}>
            <Text className={"text-[#062B52] text-[16px] font-[800]"}>Fotografía adjunta</Text>
            <Image
              source={{ uri: rutaFoto }}
              className={"rounded-[20px] h-[192px] w-full border-[1px] border-[#D7E8F1] bg-blanco"}
              resizeMode="cover"
            />
          </View>
        )}

        {faltantes.length > 0 && (
          <View className={"bg-[#FFF8E9] border-[#F0C36D] rounded-[20px] border-[1px] gap-[8px] p-[16px]"} accessibilityRole="summary">
            <Text className={"text-[16px] font-[500] leading-[20px] text-[#A96500]"}>Falta completar</Text>

            {faltantes.map((texto, indice) => (
              <Text key={`${indice}-${texto}`} className={"text-[16px] font-[400] leading-[22px] text-[#714B12]"}>
                • {texto}
              </Text>
            ))}
          </View>
        )}

        {mensaje !== null && (
          <Text accessibilityRole="alert" className={"text-[16px] font-[400] leading-[22px] text-[#C7354F] bg-[#FFF0F2] border-[#F2C6CF] border-[1px] rounded-[16px] p-[12px]"}>
            {mensaje}
          </Text>
        )}

        <View className={"flex-row items-start gap-[10px] bg-[#E5F5FC] rounded-[16px] p-[14px]"}>
          <Text className={"text-[#087FC4] text-[16px] font-[900]"}>i</Text>
          <Text className={"text-[12px] font-[500] leading-[20px] text-[#45647B] flex-1"}>
            Guardar no envía la lectura. Quedará pendiente hasta que la oficina
            la reciba.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={guardando}
          onPress={() => void guardar()}
          className={[(guardando ? "shadow-[0px_4px_8px_rgba(8,127,196,0)] items-center bg-[#087FC4] rounded-[18px] justify-center mt-[8px] min-h-[48px] px-[16px] py-[12px] opacity-[0.55]" : "shadow-[0px_4px_8px_rgba(8,127,196,0.2)] items-center bg-[#087FC4] rounded-[18px] justify-center mt-[8px] min-h-[48px] px-[16px] py-[12px]"), "active:bg-[#075D92] active:scale-[0.99]"].filter(Boolean).join(' ')}
        >
          <Text className={"text-[15px] font-[800] leading-[20px] text-blanco text-center"}>
            {guardando
              ? 'Guardando…'
              : 'Guardar lectura en el dispositivo'}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/registro/fotografia')}
          className={["items-center bg-blanco border-[#B7D9E9] border-[1px] rounded-[18px] justify-center min-h-[48px] px-[16px] py-[12px]", "active:bg-[#E5F5FC]"].filter(Boolean).join(' ')}
        >
          <Text className={"text-[#075D92] text-[14px] font-[800] text-center"}>
            Volver a la fotografía
          </Text>
        </Pressable>

        <Text className={"text-[#7893A5] text-[10px] font-[700] tracking-[1.1px] text-center mt-[8px]"}>
          LECTURA ÁGIL · REGISTRO DE CONSUMO
        </Text>
      </ScrollView>
    </View>
  );
}

function Fila({
  etiqueta,
  valor,
}: {
  etiqueta: string;
  valor: string;
}) {
  return (
    <View className={"gap-[4px] py-[4px] border-b-[1px] border-b-[#EAF1F5]"}>
      <Text className={"text-[12px] font-[700] leading-[16px] text-[#5A7185] tracking-[0.5px]"}>{etiqueta}</Text>
      <Text className={"text-[16px] font-[600] leading-[23px] text-[#123550]"}>{valor}</Text>
    </View>
  );
}
