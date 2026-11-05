import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Campo } from '../../../components/Campo';
import { useConexion } from '../../../contexts/ConexionContext';
import { useRegistro } from '../../../contexts/RegistroContext';
import type { ErroresRegistro } from '../../../domain/tipos';
import { validarRegistro } from '../../../domain/validaciones';
import { interpretarConsultaMedidor, useMedidorQuery } from '../../../hooks/useMedidorQuery';

/** Errores que corresponden a los campos de este paso (R5). */
const CAMPOS_PASO: readonly (keyof ErroresRegistro)[] = [
  'lectura',
  'lecturaAnterior',
  'motivo',
  'descripcion',
];

export default function DatosLecturaScreen() {
  const {
    registro,
    cargandoBorrador,
    actualizarDatos,
    definirPaso,
  } = useRegistro();

  const { enLinea } = useConexion();

  const [errores, setErrores] = useState<
    Partial<Record<'lectura' | 'motivo' | 'descripcion', string>>
  >({});

  const codigoMedidor = registro.codigoMedidor;
  const estado = registro.estadoMedidor;
  const datos = registro.datos;

  // La consulta compartida por clave evita descargas duplicadas y permite
  // servir los datos persistidos sin conexión (ADR-015).
  const consultaMedidor = useMedidorQuery(codigoMedidor ?? '', enLinea);

  const consulta = interpretarConsultaMedidor(consultaMedidor, {
    codigoNormalizado: codigoMedidor ?? '',
    codigoValido: codigoMedidor !== null,
    enLinea,
    restaurando: false,
  });

  const medidorOficina =
    consulta.resultado?.estado === 'encontrado'
      ? consulta.resultado.medidor
      : null;

  // El paso actual se guarda en el borrador (ADR-004).
  useEffect(() => {
    if (!cargandoBorrador) {
      definirPaso('datos_lectura');
    }
  }, [cargandoBorrador, definirPaso]);

  // La lectura anterior de la oficina sirve de referencia y para comparar.
  useEffect(() => {
    const medidor = consultaMedidor.data?.medidor;

    if (
      medidor !== undefined &&
      medidor.ultimaLectura !== null &&
      datos.lecturaAnterior === null
    ) {
      actualizarDatos({ lecturaAnterior: medidor.ultimaLectura });
    }

    // datos.lecturaAnterior cambia al rellenarse: la condición impide bucles.
  }, [consultaMedidor.data, datos.lecturaAnterior, actualizarDatos]);

  function avanzar(): void {
    if (estado === null) {
      return;
    }

    const resultadoValidacion = validarRegistro(estado, datos);
    const erroresPaso: typeof errores = {};

    for (const campo of CAMPOS_PASO) {
      const mensaje = resultadoValidacion[campo];

      if (
        mensaje !== undefined &&
        (campo === 'lectura' ||
          campo === 'motivo' ||
          campo === 'descripcion')
      ) {
        erroresPaso[campo] = mensaje;
      }
    }

    setErrores(erroresPaso);

    if (Object.keys(erroresPaso).length > 0) {
      return;
    }

    // La lectura cambia: la confirmación y la anomalía se recalculan
    // en el siguiente paso.
    actualizarDatos({
      consumoAnomalo: null,
      confirmacionAnomalia: false,
    });

    definirPaso('revision_consumo');
    router.push('/registro/revision_consumo');
  }

  const lecturaAnterior =
    datos.lecturaAnterior !== null &&
    datos.lecturaAnterior !== undefined
      ? String(datos.lecturaAnterior)
      : medidorOficina === null || medidorOficina.ultimaLectura === null
        ? 'Sin dato previo'
        : String(medidorOficina.ultimaLectura);

  const nombreEstado =
    estado === 'normal'
      ? 'Normal'
      : estado === 'inaccesible'
        ? 'Inaccesible'
        : 'Dañado';

  if (cargandoBorrador) {
    return (
      <View className={"flex-1 bg-[#EAF4F8] justify-center items-center px-[28px]"}>
        <View className={"w-[62px] h-[62px] rounded-[21px] bg-[#062B52] items-center justify-center mb-[18px]"}>
          <Text className={"text-[#63D2F0] text-[22px] font-[900]"}>02</Text>
        </View>
        <Text className={"text-[#062B52] text-[22px] font-[800] text-center"}>Datos de lectura</Text>
        <Text className={"text-[16px] font-[400] leading-[22px] text-[#617A90] text-center mt-[8px] mb-[20px]"}>
          Recuperando el registro guardado…
        </Text>
      </View>
    );
  }

  if (codigoMedidor === null || estado === null) {
    return (
      <View className={"flex-1 bg-[#EAF4F8] justify-center items-center px-[28px]"}>
        <View className={"w-[62px] h-[62px] rounded-[21px] bg-[#062B52] items-center justify-center mb-[18px]"}>
          <Text className={"text-[#63D2F0] text-[22px] font-[900]"}>!</Text>
        </View>
        <Text className={"text-[#062B52] text-[22px] font-[800] text-center"}>Falta información previa</Text>
        <Text className={"text-[16px] font-[400] leading-[22px] text-[#617A90] text-center mt-[8px] mb-[20px]"}>
          Primero consulta un medidor e indica su estado desde el asistente.
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/medidor')}
          className={["shadow-[0px_4px_8px_rgba(6,43,82,0.15)] min-h-[54px] mt-[23px] px-[18px] rounded-[17px] bg-[#087FC4] flex-row items-center justify-center gap-[10px]", "active:bg-[#075D92]"].filter(Boolean).join(' ')}
        >
          <Text className={"text-[14px] font-[500] leading-[20px] text-blanco text-center shrink"}>
            Consultar medidor
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className={"flex-1 bg-[#EAF4F8]"}>
      <ScrollView
        contentContainerClassName={"pb-[24px]"}
        showsVerticalScrollIndicator={false}
      >
        {/* Encabezado visual */}
        <View className={"bg-[#062B52] rounded-bl-[30px] rounded-br-[30px] overflow-hidden px-[24px] pt-[24px] pb-[30px]"}>
          <View className={"absolute w-[210px] h-[210px] rounded-[105px] bg-[rgba(34,178,224,0.13)] -top-[105px] -right-[50px]"} />
          <View className={"absolute w-[150px] h-[150px] rounded-[75px] bg-[rgba(0,207,190,0.10)] -bottom-[80px] left-[42%]"} />

          <View className={"flex-row items-center gap-[8px] mb-[26px]"}>
            <View className={"w-[8px] h-[8px] rounded-[4px] bg-[#22B2E0]"} />
            <Text className={"text-[11px] font-[500] leading-[20px] text-blanco tracking-[1.2px]"}>
              LECTURA ÁGIL · EPMAPS
            </Text>
          </View>

          <Text className={"text-[11px] font-[500] leading-[20px] text-[#8EDCF5] tracking-[1.4px] mb-[9px]"}>PASO 2 DE 5 · LECTURA</Text>

          <Text className={"text-blanco text-[31px] font-[800] -tracking-[0.8px]"}>
            Datos de{' '}
            <Text className={"text-[#63D2F0]"}>lectura</Text>
          </Text>

          <Text className={"text-[16px] font-[400] leading-[22px] text-[#D5EAF7] mt-[10px] max-w-[320px]"}>
            Registra lo observado en el medidor según su estado.
          </Text>

          <View className={"flex-row gap-[6px] mt-[24px]"}>
            {[1, 2, 3, 4, 5].map((paso) => (
              <View
                key={paso}
                className={(paso <= 2 ? "flex-1 h-[4px] rounded-[2px] bg-[#63D2F0]" : "flex-1 h-[4px] rounded-[2px] bg-[rgba(255,255,255,0.22)]")}
              />
            ))}
          </View>
        </View>

        {/* Contenido del formulario */}
        <View className={"px-[20px] pt-[22px]"}>
          <View className={"shadow-[0px_5px_12px_rgba(18,59,90,0.06)] bg-blanco rounded-[22px] border-[1px] border-[#D8E8F1] p-[17px] flex-row items-center gap-[12px]"}>
            <View className={"w-[45px] h-[45px] rounded-[15px] items-center justify-center bg-[#E5F5FC]"}>
              <Text className={"text-[#087FC4] text-[21px] font-[800]"}>M</Text>
            </View>

            <View className={"flex-1"}>
              <Text className={"text-[10px] font-[500] leading-[20px] text-[#617A90] tracking-[0.7px]"}>
                CÓDIGO DEL MEDIDOR
              </Text>
              <Text className={"text-[#062B52] text-[20px] font-[800] mt-[4px]"}>
                {codigoMedidor}
              </Text>
            </View>

            <View
              className={`rounded-[30px] px-[11px] py-[7px] ${
                estado === 'normal'
                  ? 'bg-[#E6F6EF]'
                  : estado === 'inaccesible'
                    ? 'bg-[#FFF4DF]'
                    : 'bg-[#FCE9EC]'
              }`}
            >
              <Text
                className={`text-[11px] font-[800] ${
                  estado === 'normal'
                    ? 'text-[#087F62]'
                    : estado === 'inaccesible'
                      ? 'text-[#A96500]'
                      : 'text-[#C7354F]'
                }`}
              >
                {nombreEstado}
              </Text>
            </View>
          </View>

          <View className={"mt-[25px] mb-[14px]"}>
            <Text className={"text-[#062B52] text-[19px] font-[800]"}>
              Información del registro
            </Text>
            <Text className={"text-[16px] font-[400] leading-[21px] text-[#617A90] mt-[5px]"}>
              Completa los campos correspondientes al estado registrado.
            </Text>
          </View>

          <View className={"shadow-[0px_4px_10px_rgba(18,59,90,0.04)] bg-blanco rounded-[22px] border-[1px] border-[#D8E8F1] p-[18px] gap-[14px]"}>
            {estado === 'inaccesible' ? (
              <>
                <View className={"flex-row items-start gap-[10px] p-[13px] rounded-[15px] bg-[#EDF7FC] border-[1px] border-[#D6ECF7]"}>
                  <Text className={"w-[22px] h-[22px] rounded-[11px] overflow-hidden text-center align-middle text-[#087FC4] bg-[#D7EFFA] text-[13px] font-[800]"}>i</Text>
                  <Text className={"text-[16px] font-[400] leading-[21px] flex-1 text-[#17324D]"}>
                    Un medidor inaccesible no admite lectura. Indica el
                    motivo por el que no se pudo leer.
                  </Text>
                </View>

                <Campo
                  etiqueta="MOTIVO DE LA INACCESIBILIDAD"
                  error={errores.motivo ?? null}
                  multiline
                  maxLength={300}
                  onChangeText={(texto) =>
                    actualizarDatos({ motivo: texto })
                  }
                  placeholder="Ej: medidor bajo tierra con agua acumulada"
                  valor={datos.motivo ?? ''}
                />
              </>
            ) : (
              <>
                {estado === 'danado' && (
                  <View className={"flex-row items-start gap-[10px] p-[13px] rounded-[15px] bg-[#EDF7FC] border-[1px] border-[#D6ECF7]"}>
                    <Text className={"w-[22px] h-[22px] rounded-[11px] overflow-hidden text-center align-middle text-[#087FC4] bg-[#D7EFFA] text-[13px] font-[800]"}>!</Text>
                    <Text className={"text-[16px] font-[400] leading-[21px] flex-1 text-[#17324D]"}>
                      Describe el daño observado. La lectura es opcional.
                    </Text>
                  </View>
                )}

                {estado === 'normal' && (
                  <Text className={"text-[16px] font-[400] leading-[21px] text-[#617A90]"}>
                    Ingresa la lectura numérica que muestra el medidor.
                  </Text>
                )}

                <Campo
                  etiqueta="LECTURA ACTUAL"
                  ayuda={`Lectura anterior de referencia: ${lecturaAnterior}`}
                  error={errores.lectura ?? null}
                  keyboardType="numeric"
                  maxLength={9}
                  onChangeText={(texto) =>
                    actualizarDatos({ lectura: texto })
                  }
                  placeholder="Ej: 1254"
                  valor={
                    typeof datos.lectura === 'number'
                      ? String(datos.lectura)
                      : datos.lectura ?? ''
                  }
                />

                {estado === 'danado' && (
                  <Campo
                    etiqueta="DESCRIPCIÓN DEL DAÑO"
                    error={errores.descripcion ?? null}
                    multiline
                    maxLength={300}
                    onChangeText={(texto) =>
                      actualizarDatos({ descripcion: texto })
                    }
                    placeholder="Ej: tapa rota y vidrio fracturado"
                    valor={datos.descripcion ?? ''}
                  />
                )}
              </>
            )}
          </View>

          {consulta.resultado?.estado === 'sin_cache_sin_conexion' && (
            <View className={"flex-row items-start gap-[12px] mt-[16px] p-[15px] rounded-[18px] bg-[#FFF4DF] border-[1px] border-[#F0D7A7]"}>
              <Text className={"w-[25px] h-[25px] rounded-[13px] text-center align-middle overflow-hidden text-[#A96500] bg-[#FFE7B5] font-[900]"}>!</Text>
              <View className={"flex-1 gap-[4px]"}>
                <Text className={"text-[#805000] text-[14px] font-[800]"}>
                  Verificación pendiente
                </Text>
                <Text className={"text-[16px] font-[400] leading-[20px] text-[#805000]"}>
                  Sin datos de oficina: la lectura quedará pendiente de
                  verificar.
                </Text>
              </View>
            </View>
          )}

          {!enLinea && (
            <View className={"flex-row items-center self-start gap-[8px] mt-[15px] px-[12px] py-[8px] rounded-[20px] bg-[#FFF4DF]"}>
              <View className={"w-[7px] h-[7px] rounded-[4px] bg-[#A96500]"} />
              <Text className={"text-[#A96500] text-[12px] font-[700]"}>
                Modo sin conexión
              </Text>
            </View>
          )}

          <Pressable
            accessibilityRole="button"
            onPress={avanzar}
            className={["shadow-[0px_4px_8px_rgba(6,43,82,0.15)] min-h-[54px] mt-[23px] px-[18px] rounded-[17px] bg-[#087FC4] flex-row items-center justify-center gap-[10px]", "active:bg-[#075D92]"].filter(Boolean).join(' ')}
          >
            <Text className={"text-[14px] font-[500] leading-[20px] text-blanco text-center shrink"}>
              Siguiente: revisión del consumo
            </Text>
            <Text className={"text-blanco text-[20px] font-[700]"}>→</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/registro/estado_medidor')}
            className={["min-h-[48px] mt-[10px] rounded-[16px] border-[1px] border-[#C9DFEB] bg-[rgba(255,255,255,0.72)] items-center justify-center px-[14px]", "active:bg-[#DCEEF6]"].filter(Boolean).join(' ')}
          >
            <Text className={"text-[#062B52] text-[13px] font-[700]"}>
              ← Volver al estado del medidor
            </Text>
          </Pressable>

          <Text className={"text-[12px] font-[500] leading-[16px] text-[#7890A3] text-center mt-[23px] mb-[8px]"}>
            EPMAPS · Registro de lectura de medidores
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
