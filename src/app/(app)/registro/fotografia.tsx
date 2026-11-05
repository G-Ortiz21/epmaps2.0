import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { MapaUbicacion } from '../../../components/MapaUbicacion';
import LottieLocation, { type EstadoAnimacionUbicacion } from '../../../components/animations/LottieLocation';
import { useRegistro } from '../../../contexts/RegistroContext';
import type { UbicacionLectura } from '../../../domain/tipos';
import { requiereFoto } from '../../../domain/reglasLectura';
import { crearUbicacionManual, validarUbicacion } from '../../../domain/ubicacion';
import {
  CamaraNoDisponibleError,
  capturarFoto,
  nombreFotoDeLectura,
  obtenerRutaFoto,
  PermisoCamaraDenegadoError,
  recuperarFotoPendiente,
} from '../../../services/fotoService';
import { capturarUbicacionGPS, ErrorUbicacion } from '../../../services/ubicacionService';

export default function FotografiaScreen() {
  const { registro, cargandoBorrador, actualizarDatos, definirPaso } =
    useRegistro();

  const [tomandoFoto, setTomandoFoto] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [permisoDenegado, setPermisoDenegado] = useState(false);
  const [ubicacionCandidata, setUbicacionCandidata] = useState<UbicacionLectura | null>(null);
  const [modoManual, setModoManual] = useState(false);
  const [capturandoGPS, setCapturandoGPS] = useState(false);
  const [estadoUbicacion, setEstadoUbicacion] =
    useState<EstadoAnimacionUbicacion>('buscando');
  const [errorUbicacion, setErrorUbicacion] = useState<string | null>(null);
  const [intentoGPS, setIntentoGPS] = useState(0);
  const secuenciaGPSRef = useRef(0);

  const codigoMedidor = registro.codigoMedidor;
  const estado = registro.estadoMedidor;
  const datos = registro.datos;

  const ubicacionConfirmada = validarUbicacion(datos.ubicacion)
    ? datos.ubicacion
    : null;

  const capturarGPS = useCallback(async () => {
    const secuencia = ++secuenciaGPSRef.current;
    setCapturandoGPS(true);
    setEstadoUbicacion('buscando');
    setErrorUbicacion(null);
    setUbicacionCandidata(null);
    actualizarDatos({ ubicacion: null });

    try {
      const resultado = await capturarUbicacionGPS();
      if (secuencia !== secuenciaGPSRef.current) return;
      setUbicacionCandidata(resultado);
      setEstadoUbicacion('gps');
    } catch (error: unknown) {
      if (secuencia !== secuenciaGPSRef.current) return;
      setEstadoUbicacion('error');
      setErrorUbicacion(
        error instanceof ErrorUbicacion
          ? error.message
          : 'No se pudo obtener la ubicación GPS.',
      );
    } finally {
      if (secuencia === secuenciaGPSRef.current) {
        setCapturandoGPS(false);
      }
    }
  }, [actualizarDatos]);

  useEffect(() => {
    if (
      cargandoBorrador ||
      codigoMedidor === null ||
      modoManual ||
      ubicacionConfirmada !== null
    ) {
      return;
    }

    void capturarGPS();
  }, [
    cargandoBorrador,
    codigoMedidor,
    intentoGPS,
    modoManual,
    ubicacionConfirmada,
    capturarGPS,
  ]);

  function seleccionarManualmente(): void {
    const puntoActual = ubicacionCandidata ?? ubicacionConfirmada;
    setModoManual(true);
    setEstadoUbicacion('manual');
    setErrorUbicacion(null);
    actualizarDatos({ ubicacion: null });
    setUbicacionCandidata(
      puntoActual === null
        ? null
        : crearUbicacionManual(puntoActual.latitud, puntoActual.longitud),
    );
  }

  function confirmarUbicacion(): void {
    if (!validarUbicacion(ubicacionCandidata)) {
      setErrorUbicacion('Selecciona una ubicación válida antes de confirmarla.');
      return;
    }

    actualizarDatos({ ubicacion: ubicacionCandidata });
    setModoManual(false);
    setEstadoUbicacion(ubicacionCandidata.origenUbicacion);
    setErrorUbicacion(null);
  }

  function reintentarGPS(): void {
    setModoManual(false);
    setUbicacionCandidata(null);
    actualizarDatos({ ubicacion: null });
    setIntentoGPS((anterior) => anterior + 1);
  }

  useEffect(() => {
    if (!cargandoBorrador) {
      definirPaso('fotografia');
    }
  }, [cargandoBorrador, definirPaso]);

  const nombreArchivo =
    codigoMedidor === null ? null : nombreFotoDeLectura(codigoMedidor);

  // Recupera una fotografía pendiente si Android cerró la aplicación
  // durante la captura (ADR-007).
  useEffect(() => {
    let vigente = true;

    if (
      nombreArchivo === null ||
      cargandoBorrador ||
      datos.fotoNombre !== null
    ) {
      return () => {
        vigente = false;
      };
    }

    void recuperarFotoPendiente(nombreArchivo)
      .then((nombre) => {
        if (vigente && nombre !== null) {
          actualizarDatos({ fotoNombre: nombre });
        }
      })
      .catch(() => {
        // No hay una fotografía pendiente que recuperar.
      });

    return () => {
      vigente = false;
    };
    // Se conserva el comportamiento original: consultar al cargar el borrador.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nombreArchivo, cargandoBorrador]);

  if (cargandoBorrador) {
    return (
      <View className={"flex-1 bg-[#EAF4F8]"}>
        <View className={"bg-[#062B52] rounded-bl-[30px] rounded-br-[30px] overflow-hidden px-[24px] pt-[22px] pb-[27px]"}>
          <Text className={"text-[#22B2E0] text-[12px] font-[800] tracking-[1.5px]"}>LECTURA ÁGIL · EPMAPS</Text>
          <Text className={"text-[#B8D8EC] text-[11px] font-[700] tracking-[1.2px] mt-[24px]"}>PASO 4 DE 5 · FOTOGRAFÍA</Text>
          <Text className={"text-blanco text-[30px] font-[800] -tracking-[0.7px] mt-[7px]"}>Fotografía</Text>
          <Text className={"text-[#D5EAF7] text-[14px] leading-[21px] mt-[8px] max-w-[320px]"}>
            Recuperando el registro guardado…
          </Text>
        </View>
        <View className={"p-[20px] pb-[34px] gap-[16px]"}>
          <View className={"bg-blanco rounded-[22px] p-[18px] gap-[10px] border-[1px] border-[#E1EDF4]"}>
            <Text className={"text-[#17324D] text-[14px] leading-[21px]"}>Recuperando los datos del registro…</Text>
          </View>
        </View>
      </View>
    );
  }

  if (codigoMedidor === null || estado === null) {
    return (
      <View className={"flex-1 bg-[#EAF4F8]"}>
        <View className={"bg-[#062B52] rounded-bl-[30px] rounded-br-[30px] overflow-hidden px-[24px] pt-[22px] pb-[27px]"}>
          <Text className={"text-[#22B2E0] text-[12px] font-[800] tracking-[1.5px]"}>LECTURA ÁGIL · EPMAPS</Text>
          <Text className={"text-[#B8D8EC] text-[11px] font-[700] tracking-[1.2px] mt-[24px]"}>PASO 4 DE 5 · FOTOGRAFÍA</Text>
          <Text className={"text-blanco text-[30px] font-[800] -tracking-[0.7px] mt-[7px]"}>Fotografía</Text>
          <Text className={"text-[#D5EAF7] text-[14px] leading-[21px] mt-[8px] max-w-[320px]"}>
            Completa los pasos anteriores para adjuntar evidencia.
          </Text>
        </View>

        <View className={"p-[20px] pb-[34px] gap-[16px]"}>
          <View className={"bg-blanco rounded-[22px] p-[18px] gap-[10px] border-[1px] border-[#E1EDF4]"}>
            <Text className={"text-[#17324D] text-[14px] leading-[21px]"}>
              Primero consulta un medidor y completa los datos de lectura.
            </Text>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/medidor')}
              className={["min-h-[54px] bg-[#087FC4] rounded-[17px] items-center justify-center px-[18px] py-[14px]", "active:bg-[#075D92]"].filter(Boolean).join(' ')}
            >
              <Text className={"text-blanco text-[14px] font-[800] text-center"}>Consultar medidor</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  const obligatoria = requiereFoto(estado, datos.consumoAnomalo ?? null);

  const motivoObligatoria =
    estado === 'danado'
      ? 'Obligatoria por medidor dañado'
      : datos.consumoAnomalo === true
        ? 'Obligatoria por consumo anómalo'
        : 'La fotografía es opcional en este registro';

  const rutaFoto = datos.fotoNombre
    ? obtenerRutaFoto(datos.fotoNombre)
    : null;

  async function tomar(): Promise<void> {
    if (nombreArchivo === null) {
      return;
    }

    setTomandoFoto(true);
    setMensaje(null);
    setPermisoDenegado(false);

    try {
      const nombre = await capturarFoto(nombreArchivo);

      if (nombre !== null) {
        actualizarDatos({ fotoNombre: nombre });
      }
    } catch (error: unknown) {
      if (error instanceof PermisoCamaraDenegadoError) {
        setPermisoDenegado(true);
        setMensaje(
          'La aplicación necesita acceso a la cámara. Concede el permiso desde los ajustes del teléfono.',
        );
      } else if (error instanceof CamaraNoDisponibleError) {
        setMensaje('No se encontró una cámara disponible en este dispositivo.');
      } else {
        setMensaje('No se pudo capturar la fotografía. Inténtalo de nuevo.');
      }
    } finally {
      setTomandoFoto(false);
    }
  }

  function avanzar(): void {
    if (obligatoria && datos.fotoNombre === null) {
      setMensaje('La fotografía es obligatoria para este registro.');
      return;
    }

    setMensaje(null);
    definirPaso('resumen');
    router.push('/registro/resumen');
  }

  return (
    <View className={"flex-1 bg-[#EAF4F8]"}>
      <View className={"bg-[#062B52] rounded-bl-[30px] rounded-br-[30px] overflow-hidden px-[24px] pt-[22px] pb-[27px]"}>
        <View className={"absolute w-[190px] h-[190px] rounded-[95px] bg-[rgba(34,178,224,0.12)] -top-[95px] -right-[45px]"} />
        <View className={"absolute w-[130px] h-[130px] rounded-[65px] bg-[rgba(0,207,190,0.10)] -bottom-[75px] left-[90px]"} />

        <Text className={"text-[#22B2E0] text-[12px] font-[800] tracking-[1.5px]"}>LECTURA ÁGIL · EPMAPS</Text>
        <Text className={"text-[#B8D8EC] text-[11px] font-[700] tracking-[1.2px] mt-[24px]"}>PASO 4 DE 5 · EVIDENCIA</Text>
        <Text className={"text-blanco text-[30px] font-[800] -tracking-[0.7px] mt-[7px]"}>Fotografía</Text>
        <Text className={"text-[#D5EAF7] text-[14px] leading-[21px] mt-[8px] max-w-[320px]"}>
          Adjunta una imagen del medidor como evidencia del registro.
        </Text>

        <View className={"flex-row items-center gap-[12px] mt-[22px]"}>
          <View className={"h-[5px] flex-1 bg-[rgba(255,255,255,0.2)] rounded-[5px] overflow-hidden"}>
            <View className={"w-[80%] h-full bg-[#22B2E0] rounded-[5px]"} />
          </View>
          <Text className={"text-[#D5EAF7] text-[11px] font-[700]"}>4 de 5 pasos</Text>
        </View>
      </View>

      <ScrollView
        className={"flex-1"}
        contentContainerClassName={"p-[20px] pb-[34px] gap-[16px]"}
        showsVerticalScrollIndicator={false}
      >
        <View className={"flex-row items-center bg-blanco rounded-[22px] p-[16px] gap-[12px] border-[1px] border-[#E1EDF4]"}>
          <View className={"w-[48px] h-[48px] rounded-[16px] items-center justify-center bg-[#E5F5FC]"}>
            <Text className={"text-[#087FC4] text-[17px] font-[800]"}>04</Text>
          </View>

          <View className={"flex-1 gap-[5px]"}>
            <Text className={"text-[#5A7185] text-[10px] font-[800] tracking-[1px]"}>CÓDIGO DEL MEDIDOR</Text>
            <Text className={"text-[#062B52] text-[20px] font-[800]"}>{codigoMedidor}</Text>
          </View>

          <View
            className={(obligatoria ? "rounded-[12px] px-[10px] py-[7px] bg-[#FFF4DE]" : "rounded-[12px] px-[10px] py-[7px] bg-[#E6F6F0]")}
          >
            <Text
              className={(obligatoria ? "text-[11px] font-[800] text-[#A96500]" : "text-[11px] font-[800] text-[#087F62]")}
            >
              {obligatoria ? 'Requerida' : 'Opcional'}
            </Text>
          </View>
        </View>

        <View
          className={(obligatoria ? "bg-blanco rounded-[22px] p-[18px] gap-[10px] border-[1px] border-[#E1EDF4] border-l-[4px] border-l-[#E7A12B]" : "bg-blanco rounded-[22px] p-[18px] gap-[10px] border-[1px] border-[#E1EDF4] border-l-[4px] border-l-[#22A783]")}
        >
          <View className={"flex-row items-center gap-[9px]"}>
            <View
              className={(obligatoria ? "w-[9px] h-[9px] rounded-[5px] bg-[#E7A12B]" : "w-[9px] h-[9px] rounded-[5px] bg-[#22A783]")}
            />
            <Text
              className={(obligatoria ? "flex-1 text-[14px] font-[800] leading-[20px] text-[#A96500]" : "flex-1 text-[14px] font-[800] leading-[20px] text-[#087F62]")}
            >
              {motivoObligatoria}
            </Text>
          </View>

          <Text className={"text-[#5A7185] text-[13px] leading-[20px]"}>
            {obligatoria
              ? 'Asegúrate de que la imagen permita identificar el estado del medidor.'
              : 'Puedes adjuntar una fotografía para respaldar la información registrada.'}
          </Text>
        </View>

        <View className="gap-4 rounded-[22px] border border-borde bg-superficie p-4">
          <View className="gap-1">
            <Text className="text-[18px] font-bold text-texto">UBICACIÓN DE LA LECTURA</Text>
            <Text className="text-sm leading-5 text-texto-secundario">
              Guarda el punto donde tomaste la lectura. Puedes usar GPS o elegirlo manualmente.
            </Text>
          </View>

          {capturandoGPS ? (
            <LottieLocation estado="buscando" />
          ) : ubicacionConfirmada !== null ? (
            <LottieLocation estado={ubicacionConfirmada.origenUbicacion} />
          ) : ubicacionCandidata?.origenUbicacion === 'manual' ? (
            <LottieLocation estado="manual" />
          ) : errorUbicacion !== null ? (
            <LottieLocation estado="error" />
          ) : null}

          {ubicacionConfirmada !== null ? (
            <View className="gap-1 rounded-xl bg-fondo p-3">
              <Text className="text-sm font-semibold text-texto">
                Origen: {ubicacionConfirmada.origenUbicacion === 'gps' ? 'GPS' : 'Selección manual'}
              </Text>
              <Text className="text-xs text-texto-secundario">
                {ubicacionConfirmada.latitud.toFixed(6)}, {ubicacionConfirmada.longitud.toFixed(6)}
              </Text>
              {ubicacionConfirmada.precisionGps !== null ? (
                <Text className="text-xs text-texto-secundario">
                  Precisión GPS: ±{Math.round(ubicacionConfirmada.precisionGps)} m
                </Text>
              ) : null}
            </View>
          ) : ubicacionCandidata !== null ? (
            <View className="gap-1 rounded-xl bg-fondo p-3">
              <Text className="text-sm font-semibold text-texto">
                Punto {ubicacionCandidata.origenUbicacion === 'gps' ? 'GPS' : 'manual'} por confirmar
              </Text>
              <Text className="text-xs text-texto-secundario">
                {ubicacionCandidata.latitud.toFixed(6)}, {ubicacionCandidata.longitud.toFixed(6)}
              </Text>
              {ubicacionCandidata.precisionGps !== null ? (
                <Text className="text-xs text-texto-secundario">
                  Precisión GPS: ±{Math.round(ubicacionCandidata.precisionGps)} m
                </Text>
              ) : null}
            </View>
          ) : null}

          {errorUbicacion !== null ? (
            <Text accessibilityRole="alert" className="text-sm leading-5 text-error">
              {errorUbicacion}
            </Text>
          ) : null}

          <View className="flex-row flex-wrap gap-2">
            <Pressable
              accessibilityRole="button"
              disabled={capturandoGPS}
              onPress={reintentarGPS}
              className="min-h-[48px] flex-1 items-center justify-center rounded-xl bg-marca px-3"
            >
              <Text className="text-center text-sm font-bold text-blanco">
                {capturandoGPS ? 'Buscando ubicación…' : 'Obtener GPS'}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={seleccionarManualmente}
              className="min-h-[48px] flex-1 items-center justify-center rounded-xl border border-borde bg-superficie px-3"
            >
              <Text className="text-center text-sm font-bold text-texto">
                {modoManual ? 'Ajustar punto manual' : 'Seleccionar manualmente'}
              </Text>
            </Pressable>
          </View>

          {(modoManual || ubicacionCandidata !== null || ubicacionConfirmada !== null) ? (
            <MapaUbicacion
              ubicacion={ubicacionCandidata ?? ubicacionConfirmada}
              seleccionable={modoManual}
              onSeleccionar={setUbicacionCandidata}
            />
          ) : null}

          {ubicacionCandidata !== null ? (
            <Pressable
              accessibilityRole="button"
              onPress={confirmarUbicacion}
              className="min-h-[50px] items-center justify-center rounded-xl border border-exito bg-exito/10 px-4"
            >
              <Text className="text-sm font-bold text-exito">Confirmar ubicación</Text>
            </Pressable>
          ) : null}

          {ubicacionConfirmada === null && ubicacionCandidata === null ? (
            <Text className="text-xs leading-5 text-texto-secundario">
              La lectura no podrá guardarse hasta confirmar una ubicación válida. El mapa base requiere conexión; puedes usar GPS sin Internet.
            </Text>
          ) : null}
        </View>

        <View className={"gap-[5px] mt-[2px]"}>
          <Text className={"text-[#062B52] text-[19px] font-[800]"}>Evidencia fotográfica</Text>
          <Text className={"text-[#5A7185] text-[13px] leading-[19px]"}>
            {datos.fotoNombre !== null
              ? 'Revisa la imagen guardada o vuelve a tomarla.'
              : 'Toma una fotografía directamente desde la cámara del dispositivo.'}
          </Text>
        </View>

        <View className={"bg-blanco border-[#D8E7F0] rounded-[24px] border-[1px] p-[12px] overflow-hidden"}>
          {datos.fotoNombre !== null && rutaFoto !== null ? (
            <>
              <Image
                source={{ uri: rutaFoto }}
                className={"w-full h-[270px] rounded-[16px] bg-[#EAF1F5]"}
                resizeMode="cover"
              />
              <View className={"self-start mt-[12px] rounded-[10px] bg-[#E6F6F0] px-[12px] py-[8px]"}>
                <Text className={"text-[#087F62] text-[12px] font-[800]"}>
                  Fotografía adjunta
                </Text>
              </View>
            </>
          ) : (
            <View className={"min-h-[200px] items-center justify-center p-[20px] gap-[12px]"}>
              <View className={"w-[62px] h-[62px] rounded-[22px] bg-[#E5F5FC] items-center justify-center"}>
                <Text className={"text-[#087FC4] text-[36px] font-[400] leading-[40px]"}>+</Text>
              </View>
              <Text className={"text-[#17324D] text-[14px] font-[700] text-center leading-[21px]"}>
                {datos.fotoNombre !== null
                  ? 'La fotografía guardada ya no está disponible en el dispositivo.'
                  : 'Todavía no hay una fotografía adjunta'}
              </Text>
              <Text className={"text-[#5A7185] text-[12px] text-center leading-[18px]"}>
                Utiliza el botón inferior para abrir la cámara.
              </Text>
            </View>
          )}
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={tomandoFoto}
          onPress={() => void tomar()}
          className={[(tomandoFoto ? "min-h-[54px] bg-[#087FC4] rounded-[17px] items-center justify-center px-[18px] py-[14px] opacity-[0.6]" : "min-h-[54px] bg-[#087FC4] rounded-[17px] items-center justify-center px-[18px] py-[14px]"), "active:bg-[#075D92]"].filter(Boolean).join(' ')}
        >
          <Text className={"text-blanco text-[14px] font-[800] text-center"}>
            {tomandoFoto
              ? 'Abriendo la cámara…'
              : datos.fotoNombre !== null
                ? 'Repetir fotografía'
                : 'Tomar fotografía'}
          </Text>
        </Pressable>

        {permisoDenegado && (
          <View className={"bg-[#FFF4DE] border-[#F0D69F] border-[1px] rounded-[16px] p-[15px] gap-[6px]"}>
            <Text className={"text-[#A96500] text-[13px] font-[800]"}>Permiso de cámara denegado</Text>
            <Text className={"text-[#17324D] text-[13px] leading-[19px]"}>
              {obligatoria
                ? 'Mientras no concedas el permiso, este registro no puede avanzar.'
                : 'Puedes continuar sin fotografía porque es opcional.'}
            </Text>
          </View>
        )}

        {mensaje !== null && (
          <View className={"bg-[#FFF0F2] border-[#F3C5CE] border-[1px] rounded-[15px] p-[14px]"}>
            <Text accessibilityRole="alert" className={"text-[#C7354F] text-[13px] font-[600] leading-[20px]"}>
              {mensaje}
            </Text>
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          onPress={avanzar}
          className={["min-h-[54px] bg-blanco border-[#A8D5E9] border-[1px] rounded-[17px] items-center justify-center px-[16px] py-[12px]", "active:bg-[#E5F3FA]"].filter(Boolean).join(' ')}
        >
          <Text className={"text-[#062B52] text-[14px] font-[800] text-center"}>
            {obligatoria && datos.fotoNombre === null
              ? 'Se requiere la fotografía para continuar'
              : 'Siguiente: resumen'}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/registro/revision_consumo')}
          className={"items-center justify-center p-[12px]"}
        >
          <Text className={"text-[#5A7185] text-[13px] font-[700]"}>
            ← Volver a revisión del consumo
          </Text>
        </Pressable>

        <Text className={"text-[#5A7185] text-[11px] leading-[17px] text-center mt-[2px]"}>
          Verifica la evidencia antes de continuar con el resumen del registro.
        </Text>
      </ScrollView>
    </View>
  );
}
