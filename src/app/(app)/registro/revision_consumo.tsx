import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useConexion } from '../../../contexts/ConexionContext';
import { useRegistro } from '../../../contexts/RegistroContext';
import { calcularConsumo, esAnomalo } from '../../../domain/consumo';
import { useMedidorQuery } from '../../../hooks/useMedidorQuery';

export default function RevisionConsumoScreen() {
  const {
    registro,
    cargandoBorrador,
    actualizarDatos,
    definirPaso,
  } = useRegistro();

  const { enLinea } = useConexion();

  const [errorConfirmacion, setErrorConfirmacion] = useState<string | null>(
    null,
  );

  const codigoMedidor = registro.codigoMedidor;
  const estado = registro.estadoMedidor;
  const datos = registro.datos;

  // Los datos de oficina vienen de la consulta compartida: caché persistida
  // sin conexión u oficina cuando hay red (ADR-015).
  const consultaMedidor = useMedidorQuery(codigoMedidor ?? '', enLinea);
  const medidor = consultaMedidor.data?.medidor ?? null;

  useEffect(() => {
    if (!cargandoBorrador) {
      definirPaso('revision_consumo');
    }
  }, [cargandoBorrador, definirPaso]);

  if (cargandoBorrador) {
    return (
      <View className={"flex-1 bg-[#EAF4F8] justify-center items-center px-[28px]"}>
        <View className={"w-[62px] h-[62px] rounded-[21px] bg-[#062B52] items-center justify-center mb-[18px]"}>
          <Text className={"text-[#63D2F0] text-[22px] font-[900]"}>03</Text>
        </View>
        <Text className={"text-[#062B52] text-[22px] font-[800] text-center"}>Revisión del consumo</Text>
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
        <Text className={"text-[#062B52] text-[22px] font-[800] text-center"}>Completa los pasos anteriores</Text>
        <Text className={"text-[16px] font-[400] leading-[22px] text-[#617A90] text-center mt-[8px] mb-[20px]"}>
          Primero completa los datos de lectura del asistente.
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/medidor')}
          className={["shadow-[0px_4px_8px_rgba(6,43,82,0.15)] min-h-[54px] mt-[23px] px-[18px] rounded-[17px] bg-[#087FC4] flex-row items-center justify-center gap-[10px]", "active:bg-[#075D92]"].filter(Boolean).join(' ')}
        >
          <Text className={"text-[14px] font-[500] leading-[20px] text-blanco text-center shrink"}>Consultar medidor</Text>
        </Pressable>
      </View>
    );
  }

  const lecturaActual =
    datos.lectura === null ||
    datos.lectura === undefined ||
    datos.lectura === ''
      ? null
      : Number(datos.lectura);

  const lecturaAnterior =
    datos.lecturaAnterior ?? medidor?.ultimaLectura ?? null;

  const promedioMensual = medidor?.promedioMensual ?? null;
  const consumo = calcularConsumo(lecturaActual, lecturaAnterior);
  const anomalo = esAnomalo(consumo, promedioMensual);

  function avanzar(): void {
    if (anomalo === true && datos.confirmacionAnomalia !== true) {
      setErrorConfirmacion('Confirma que revisaste el consumo anómalo.');
      return;
    }

    setErrorConfirmacion(null);
    actualizarDatos({ consumoAnomalo: anomalo });
    definirPaso('fotografia');
    router.push('/registro/fotografia');
  }

  const contenidoSinLectura = lecturaActual === null;

  return (
    <View className={"flex-1 bg-[#EAF4F8]"}>
      <ScrollView
        contentContainerClassName={"pb-[24px]"}
        showsVerticalScrollIndicator={false}
      >
        <View className={"bg-[#062B52] rounded-bl-[30px] rounded-br-[30px] overflow-hidden px-[24px] pt-[24px] pb-[30px]"}>
          <View className={"absolute w-[210px] h-[210px] rounded-[105px] bg-[rgba(34,178,224,0.13)] -top-[105px] -right-[50px]"} />
          <View className={"absolute w-[150px] h-[150px] rounded-[75px] bg-[rgba(0,207,190,0.10)] -bottom-[80px] left-[42%]"} />

          <View className={"flex-row items-center gap-[8px] mb-[26px]"}>
            <View className={"w-[8px] h-[8px] rounded-[4px] bg-[#63D2F0]"} />
            <Text className={"text-[11px] font-[500] leading-[20px] text-blanco tracking-[1.2px]"}>LECTURA ÁGIL · EPMAPS</Text>
          </View>

          <Text className={"text-[11px] font-[500] leading-[20px] text-[#8EDCF5] tracking-[1.4px] mb-[9px]"}>PASO 3 DE 5 · CONSUMO</Text>

          <Text className={"text-blanco text-[30px] font-[800] -tracking-[0.8px]"}>
            Revisión del{' '}
            <Text className={"text-[#63D2F0]"}>consumo</Text>
          </Text>

          <Text className={"text-[16px] font-[400] leading-[22px] text-[#D5EAF7] mt-[10px]"}>
            Comprueba los valores calculados antes de continuar con el registro.
          </Text>

          <View className={"flex-row gap-[6px] mt-[24px]"}>
            {[1, 2, 3, 4, 5].map((paso) => (
              <View
                key={paso}
                className={(paso <= 3 ? "flex-1 h-[4px] rounded-[2px] bg-[#63D2F0]" : "flex-1 h-[4px] rounded-[2px] bg-[rgba(255,255,255,0.22)]")}
              />
            ))}
          </View>
        </View>

        <View className={"px-[20px] pt-[22px]"}>
          <View className={"shadow-[0px_5px_12px_rgba(18,59,90,0.06)] bg-blanco rounded-[22px] border-[1px] border-[#D8E8F1] p-[17px] flex-row items-center gap-[12px]"}>
            <View className={"w-[45px] h-[45px] rounded-[15px] items-center justify-center bg-[#E5F5FC]"}>
              <Text className={"text-[#087FC4] text-[21px] font-[800]"}>M</Text>
            </View>

            <View className={"flex-1"}>
              <Text className={"text-[10px] font-[500] leading-[20px] text-[#617A90] tracking-[0.7px]"}>CÓDIGO DEL MEDIDOR</Text>
              <Text className={"text-[#062B52] text-[20px] font-[800] mt-[4px]"}>{codigoMedidor}</Text>
            </View>

            <View className={"bg-[#E5F5FC] rounded-[20px] px-[11px] py-[7px]"}>
              <Text className={"text-[#087FC4] text-[11px] font-[800]"}>Paso 3</Text>
            </View>
          </View>

          {contenidoSinLectura ? (
            <>
              <View className={"items-center bg-blanco border-[1px] border-[#D8E8F1] rounded-[23px] p-[23px] mt-[20px]"}>
                <View className={"w-[52px] h-[52px] rounded-[18px] bg-[#E5F5FC] items-center justify-center mb-[15px]"}>
                  <Text className={"text-[#087FC4] text-[25px] font-[900]"}>i</Text>
                </View>

                <Text className={"text-[#062B52] text-[18px] font-[800] text-center"}>
                  No hay consumo que calcular
                </Text>

                <Text className={"text-[16px] font-[400] leading-[22px] text-[#617A90] text-center mt-[9px]"}>
                  Este registro no incluye una lectura numérica porque el
                  medidor está{' '}
                  {estado === 'inaccesible' ? 'inaccesible' : 'dañado'}.
                  No se calculará consumo ni anomalía.
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={avanzar}
                className={["shadow-[0px_4px_8px_rgba(6,43,82,0.15)] min-h-[54px] mt-[23px] px-[18px] rounded-[17px] bg-[#087FC4] flex-row items-center justify-center gap-[10px]", "active:bg-[#075D92]"].filter(Boolean).join(' ')}
              >
                <Text className={"text-[14px] font-[500] leading-[20px] text-blanco text-center shrink"}>
                  Siguiente: fotografía
                </Text>
                <Text className={"text-blanco text-[20px] font-[700]"}>→</Text>
              </Pressable>
            </>
          ) : (
            <>
              <View className={"mt-[25px] mb-[14px]"}>
                <Text className={"text-[#062B52] text-[19px] font-[800]"}>Resumen de lecturas</Text>
                <Text className={"text-[16px] font-[400] leading-[21px] text-[#617A90] mt-[5px]"}>
                  Valores utilizados para calcular el consumo.
                </Text>
              </View>

              <View className={"bg-blanco rounded-[22px] border-[1px] border-[#D8E8F1] px-[18px] py-[6px]"}>
                <View className={"flex-row items-center justify-between py-[16px] gap-[12px]"}>
                  <View className={"flex-1 gap-[7px]"}>
                    <Text className={"text-[10px] font-[500] leading-[20px] text-[#617A90] tracking-[0.8px]"}>LECTURA ANTERIOR</Text>
                    <Text className={"text-[#062B52] text-[21px] font-[800]"}>
                      {lecturaAnterior ?? 'Sin dato previo'}
                    </Text>
                  </View>
                  <View className={"w-[38px] h-[38px] rounded-[13px] bg-[#EDF3F7] items-center justify-center"}>
                    <Text className={"text-[#617A90] text-[12px] font-[800]"}>01</Text>
                  </View>
                </View>

                <View className={"h-[1px] bg-[#E8F0F5]"} />

                <View className={"flex-row items-center justify-between py-[16px] gap-[12px]"}>
                  <View className={"flex-1 gap-[7px]"}>
                    <Text className={"text-[10px] font-[500] leading-[20px] text-[#617A90] tracking-[0.8px]"}>LECTURA ACTUAL</Text>
                    <Text className={"text-[#062B52] text-[21px] font-[800]"}>{lecturaActual}</Text>
                  </View>
                  <View className={"w-[38px] h-[38px] rounded-[13px] bg-[#E2F5FC] items-center justify-center"}>
                    <Text className={"text-[#087FC4] text-[12px] font-[800]"}>02</Text>
                  </View>
                </View>
              </View>

              <View className={"bg-[#062B52] rounded-[24px] p-[22px] mt-[17px] overflow-hidden"} accessibilityRole="summary">
                <View className={"flex-row items-center gap-[9px]"}>
                  <View className={"w-[8px] h-[8px] rounded-[4px] bg-[#63D2F0]"} />
                  <Text className={"text-[11px] font-[500] leading-[20px] text-[#B8D9EB] tracking-[1px]"}>
                    CONSUMO CALCULADO
                  </Text>
                </View>

                <Text className={"text-blanco text-[38px] font-[900] mt-[15px]"}>
                  {consumo === null ? 'No calculable' : String(consumo)}
                </Text>

                <Text className={"text-[#9CC9E1] text-[12px] mt-[4px]"}>
                  {consumo === null
                    ? 'Falta una lectura anterior válida'
                    : 'Unidades de consumo'}
                </Text>

                <View className={"h-[1px] bg-[rgba(255,255,255,0.17)] my-[16px]"} />

                <Text className={"text-[16px] font-[400] leading-[21px] text-[#D5EAF7]"}>
                  {consumo === null
                    ? 'Sin lectura anterior no se puede calcular el consumo. Al volver la conexión, la oficina permitirá verificarlo.'
                    : 'Lectura actual menos lectura anterior.'}
                </Text>
              </View>

              <View className={"flex-row items-center gap-[13px] bg-blanco rounded-[20px] border-[1px] border-[#D8E8F1] p-[16px] mt-[15px]"}>
                <View className={"w-[42px] h-[42px] rounded-[14px] bg-[#E5F5FC] items-center justify-center"}>
                  <Text className={"text-[#087FC4] text-[22px] font-[800]"}>↗</Text>
                </View>
                <View className={"flex-1 gap-[5px]"}>
                  <Text className={"text-[10px] font-[500] leading-[20px] text-[#617A90] tracking-[0.5px]"}>
                    PROMEDIO MENSUAL DE REFERENCIA
                  </Text>
                  <Text className={"text-[#062B52] text-[18px] font-[800]"}>
                    {promedioMensual === null
                      ? 'No disponible'
                      : String(promedioMensual)}
                  </Text>
                </View>
              </View>

              {anomalo === true && (
                <View className={"bg-blanco border-[#F0D7A7] border-[1px] rounded-[22px] p-[17px] mt-[17px] gap-[16px]"} accessibilityRole="summary">
                  <View className={"flex-row items-start gap-[12px]"}>
                    <View className={"w-[36px] h-[36px] rounded-[12px] bg-[#FFF4DF] items-center justify-center"}>
                      <Text className={"text-[#A96500] text-[20px] font-[900]"}>!</Text>
                    </View>
                    <View className={"flex-1 gap-[6px]"}>
                      <Text className={"text-[#A96500] text-[16px] font-[800]"}>Consumo anómalo</Text>
                      <Text className={"text-[16px] font-[400] leading-[21px] text-[#17324D]"}>
                        El consumo supera el triple del promedio mensual.
                        Revisa la lectura y confirma que la verificaste.
                        Este registro exigirá una fotografía.
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{
                      checked: datos.confirmacionAnomalia === true,
                    }}
                    onPress={() => {
                      actualizarDatos({
                        confirmacionAnomalia:
                          datos.confirmacionAnomalia !== true,
                      });
                      setErrorConfirmacion(null);
                    }}
                    className={(datos.confirmacionAnomalia === true ? "min-h-[54px] flex-row items-center gap-[11px] px-[13px] py-[12px] rounded-[15px] border-[1px] border-[#087F62] bg-[#E6F6EF]" : "min-h-[54px] flex-row items-center gap-[11px] px-[13px] py-[12px] rounded-[15px] border-[1px] border-[#D8E8F1] bg-[#F7FAFC]")}
                  >
                    <View
                      className={(datos.confirmacionAnomalia === true ? "w-[23px] h-[23px] rounded-[7px] border-[1.5px] border-[#087F62] items-center justify-center bg-[#087F62]" : "w-[23px] h-[23px] rounded-[7px] border-[1.5px] border-[#9CB2C2] items-center justify-center")}
                    >
                      {datos.confirmacionAnomalia === true && (
                        <Text className={"text-blanco text-[15px] font-[900]"}>✓</Text>
                      )}
                    </View>

                    <Text className={"flex-1 text-[#17324D] text-[13px] font-[700] leading-[19px]"}>
                      {datos.confirmacionAnomalia === true
                        ? 'Confirmado: revisé el consumo anómalo'
                        : 'Confirmar que revisé el consumo anómalo'}
                    </Text>
                  </Pressable>

                  {errorConfirmacion !== null && (
                    <Text accessibilityRole="alert" className={"text-[16px] font-[400] leading-[20px] text-[#C7354F]"}>
                      {errorConfirmacion}
                    </Text>
                  )}
                </View>
              )}

              {anomalo === false && (
                <View className={"flex-row items-start gap-[12px] p-[16px] mt-[17px] rounded-[19px] border-[1px] border-[#B9E5D3] bg-[#E6F6EF]"}>
                  <View className={"w-[32px] h-[32px] rounded-[11px] bg-[#C9EFDF] items-center justify-center"}>
                    <Text className={"text-[#087F62] text-[18px] font-[900]"}>✓</Text>
                  </View>
                  <View className={"flex-1 gap-[5px]"}>
                    <Text className={"text-[#087F62] text-[14px] font-[800]"}>
                      Consumo dentro del rango esperado
                    </Text>
                    <Text className={"text-[16px] font-[400] leading-[20px] text-[#285D4D]"}>
                      El consumo no supera el triple del promedio mensual.
                    </Text>
                  </View>
                </View>
              )}

              <Pressable
                accessibilityRole="button"
                onPress={avanzar}
                className={["shadow-[0px_4px_8px_rgba(6,43,82,0.15)] min-h-[54px] mt-[23px] px-[18px] rounded-[17px] bg-[#087FC4] flex-row items-center justify-center gap-[10px]", "active:bg-[#075D92]"].filter(Boolean).join(' ')}
              >
                <Text className={"text-[14px] font-[500] leading-[20px] text-blanco text-center shrink"}>
                  Siguiente: fotografía
                </Text>
                <Text className={"text-blanco text-[20px] font-[700]"}>→</Text>
              </Pressable>
            </>
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
            onPress={() => router.push('/registro/datos_lectura')}
            className={["min-h-[48px] mt-[12px] rounded-[16px] border-[1px] border-[#C9DFEB] bg-[rgba(255,255,255,0.72)] items-center justify-center px-[14px]", "active:bg-[#DCEEF6]"].filter(Boolean).join(' ')}
          >
            <Text className={"text-[#062B52] text-[13px] font-[700]"}>
              ← Volver a los datos de lectura
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
