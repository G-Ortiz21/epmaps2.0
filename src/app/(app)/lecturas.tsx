import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';

import { obtenerTodasLasLecturas } from '../../data/repositories/lecturasRepository';
import type { LecturaLocal } from '../../domain/tipos';
const clasesDinamicas: Record<string, Record<string, string>> = {
  backgroundColor: {
    "#087FC4": "bg-[#087FC4]",
    "#DDF4FF": "bg-[#DDF4FF]",
    "#B8E8FA": "bg-[#B8E8FA]",
    "#087F62": "bg-[#087F62]",
    "#D9F7E9": "bg-[#D9F7E9]",
    "#B5EBD3": "bg-[#B5EBD3]",
    "#A96500": "bg-[#A96500]",
    "#FFF0C8": "bg-[#FFF0C8]",
    "#F5DDA0": "bg-[#F5DDA0]",
    "#C7354F": "bg-[#C7354F]",
    "#FFE0E5": "bg-[#FFE0E5]",
    "#F5C0CA": "bg-[#F5C0CA]",
    "#FFFFFF": "bg-blanco",
    "#20B9C6": "bg-[#20B9C6]",
    "#69879A": "bg-[#69879A]",
    "#0875A7": "bg-[#0875A7]",
    "#D1F1FF": "bg-[#D1F1FF]",
  },
  color: {
    "#087FC4": "text-[#087FC4]",
    "#DDF4FF": "text-[#DDF4FF]",
    "#B8E8FA": "text-[#B8E8FA]",
    "#087F62": "text-[#087F62]",
    "#D9F7E9": "text-[#D9F7E9]",
    "#B5EBD3": "text-[#B5EBD3]",
    "#A96500": "text-[#A96500]",
    "#FFF0C8": "text-[#FFF0C8]",
    "#F5DDA0": "text-[#F5DDA0]",
    "#C7354F": "text-[#C7354F]",
    "#FFE0E5": "text-[#FFE0E5]",
    "#F5C0CA": "text-[#F5C0CA]",
    "#FFFFFF": "text-blanco",
    "#20B9C6": "text-[#20B9C6]",
    "#69879A": "text-[#69879A]",
    "#0875A7": "text-[#0875A7]",
    "#D1F1FF": "text-[#D1F1FF]",
  },
  borderColor: {
    "#087FC4": "border-[#087FC4]",
    "#DDF4FF": "border-[#DDF4FF]",
    "#B8E8FA": "border-[#B8E8FA]",
    "#087F62": "border-[#087F62]",
    "#D9F7E9": "border-[#D9F7E9]",
    "#B5EBD3": "border-[#B5EBD3]",
    "#A96500": "border-[#A96500]",
    "#FFF0C8": "border-[#FFF0C8]",
    "#F5DDA0": "border-[#F5DDA0]",
    "#C7354F": "border-[#C7354F]",
    "#FFE0E5": "border-[#FFE0E5]",
    "#F5C0CA": "border-[#F5C0CA]",
    "#FFFFFF": "border-blanco",
    "#20B9C6": "border-[#20B9C6]",
    "#69879A": "border-[#69879A]",
    "#0875A7": "border-[#0875A7]",
    "#D1F1FF": "border-[#D1F1FF]",
  },
};



type Filtro = 'todas' | 'pendiente' | 'enviando' | 'enviada' | 'error';
type Tono = 'azul' | 'verde' | 'ambar' | 'rojo';

const FILTROS: { label: string; value: Filtro; icon: string }[] = [
  { label: 'Todas', value: 'todas', icon: '▦' },
  { label: 'Pendientes', value: 'pendiente', icon: '◷' },
  { label: 'Enviando', value: 'enviando', icon: '↗' },
  { label: 'Enviadas', value: 'enviada', icon: '✓' },
  { label: 'Errores', value: 'error', icon: '!' },
];

const ESTADOS: Record<LecturaLocal['syncEstado'], string> = {
  pendiente: 'Pendiente',
  enviando: 'Enviando',
  enviada: 'Enviada',
  error: 'Error de envío',
};

const TONOS: Record<Tono, { texto: string; fondo: string; borde: string }> = {
  azul: { texto: '#087FC4', fondo: '#DDF4FF', borde: '#B8E8FA' },
  verde: { texto: '#087F62', fondo: '#D9F7E9', borde: '#B5EBD3' },
  ambar: { texto: '#A96500', fondo: '#FFF0C8', borde: '#F5DDA0' },
  rojo: { texto: '#C7354F', fondo: '#FFE0E5', borde: '#F5C0CA' },
};

function tonoEstado(estado: LecturaLocal['syncEstado']): Tono {
  if (estado === 'enviada') return 'verde';
  if (estado === 'pendiente') return 'ambar';
  if (estado === 'error') return 'rojo';
  return 'azul';
}

function formatearNumero(valor: number) {
  return new Intl.NumberFormat('es-EC', {
    maximumFractionDigits: 2,
  }).format(valor);
}

function etiquetaVerificacion(estado: LecturaLocal['verificacion']) {
  if (estado === 'verificada') return 'Verificada';
  if (estado === 'requiere_accion') return 'Requiere acción';
  return 'Pendiente';
}

export default function LecturasScreen() {
  const [lecturas, setLecturas] = useState<LecturaLocal[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarLecturas = useCallback(async () => {
    try {
      const resultado = await obtenerTodasLasLecturas();
      setLecturas(resultado);
      setError(null);
    } catch {
      setError(
        'No se pudo consultar el historial local. Inténtalo de nuevo.',
      );
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let activa = true;

      async function cargarAlEntrar() {
        setCargando(true);
        try {
          const resultado = await obtenerTodasLasLecturas();
          if (activa) {
            setLecturas(resultado);
            setError(null);
          }
        } catch {
          if (activa) {
            setError(
              'No se pudo consultar el historial local. Comprueba la base de datos e inténtalo de nuevo.',
            );
          }
        } finally {
          if (activa) setCargando(false);
        }
      }

      void cargarAlEntrar();
      return () => {
        activa = false;
      };
    }, []),
  );

  const resumen = useMemo(
    () => ({
      total: lecturas.length,
      pendiente: lecturas.filter((l) => l.syncEstado === 'pendiente').length,
      enviando: lecturas.filter((l) => l.syncEstado === 'enviando').length,
      enviada: lecturas.filter((l) => l.syncEstado === 'enviada').length,
      error: lecturas.filter((l) => l.syncEstado === 'error').length,
    }),
    [lecturas],
  );

  const filtradas = useMemo(() => {
    const termino = busqueda.trim().toUpperCase();

    return lecturas.filter((lectura) => {
      const coincideTexto =
        !termino ||
        lectura.medidorCodigo.toUpperCase().includes(termino) ||
        lectura.periodo.toUpperCase().includes(termino);

      const coincideEstado =
        filtro === 'todas' || lectura.syncEstado === filtro;

      return coincideTexto && coincideEstado;
    });
  }, [lecturas, busqueda, filtro]);

  async function actualizar() {
    setActualizando(true);
    try {
      await cargarLecturas();
    } finally {
      setActualizando(false);
    }
  }

  return (
    <View className={"flex-1 bg-[#EAF4F8]"}>
      <ScrollView
        contentContainerClassName={"pb-[48px]"}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={actualizando}
            onRefresh={actualizar}
            tintColor="#FFFFFF"
            colors={['#20B9C6']}
          />
        }
      >
        {/* Encabezado con capas translúcidas */}
        <View className={"bg-[#062B52] px-[16px] pt-[36px] pb-[36px] rounded-bl-[30px] rounded-br-[30px] overflow-hidden"}>
          <View pointerEvents="none" className={"absolute -top-[95px] -right-[60px] w-[250px] h-[250px] rounded-[125px] bg-[rgba(34,178,224,0.16)] border-[1px] border-[rgba(179,239,255,0.2)]"} />
          <View pointerEvents="none" className={"absolute -bottom-[110px] -left-[50px] w-[220px] h-[220px] rounded-[110px] bg-[rgba(0,207,190,0.12)] border-[1px] border-[rgba(179,239,255,0.15)]"} />

          <View className={"flex-row items-center gap-[8px] mb-[16px]"}>
            <View className={"w-[34px] h-[34px] rounded-[12px] items-center justify-center bg-[rgba(255,255,255,0.13)] border-[1px] border-[rgba(255,255,255,0.25)]"}>
              <Text className={"text-[#8DEBFF] text-[24px] font-[700]"}>◇</Text>
            </View>
            <Text className={"text-[11px] font-[500] leading-[20px] text-[#BDEBFA] tracking-[1.1px]"}>LECTURA ÁGIL · EPMAPS</Text>
          </View>

          <Text className={"text-[28px] font-[700] leading-[35px] text-blanco mb-[8px]"}>Historial de lecturas</Text>
          <Text className={"text-[16px] font-[400] leading-[22px] text-[#D5EAF7]"}>
            Controla tus registros, consumos y estados de sincronización.
          </Text>

          <View className={"self-start flex-row items-center gap-[4px] mt-[16px] px-[8px] py-[6px] rounded-[99px] bg-[rgba(255,255,255,0.09)] border-[1px] border-[rgba(255,255,255,0.18)]"}>
            <View className={"w-[7px] h-[7px] rounded-[4px] bg-[#20B990]"} />
            <Text className={"text-[#DDF8FF] text-[9px] font-[700] tracking-[0.7px]"}>
              REGISTROS DEL DISPOSITIVO
            </Text>
          </View>
        </View>

        {/* Indicadores */}
        <View className={"shadow-[0px_8px_18px_rgba(7,60,104,0.12)] mx-[12px] -mt-[12px] p-[8px] rounded-[25px] flex-row gap-[5px] bg-[rgba(255,255,255,0.76)] border-[1px] border-blanco"}>
          <Resumen
            icono="▤"
            etiqueta="Total"
            valor={resumen.total}
            tono="total"
          />
          <Resumen
            icono="◷"
            etiqueta="Pendientes"
            valor={resumen.pendiente}
            tono="ambar"
          />
          <Resumen
            icono="↗"
            etiqueta="Enviando"
            valor={resumen.enviando}
            tono="azul"
          />
          <Resumen
            icono="✓"
            etiqueta="Enviadas"
            valor={resumen.enviada}
            tono="verde"
          />
          <Resumen
            icono="!"
            etiqueta="Errores"
            valor={resumen.error}
            tono="rojo"
          />
        </View>

        {/* Búsqueda y filtros */}
        <View className={"shadow-[0px_5px_14px_rgba(12,82,123,0.07)] mx-[12px] mt-[16px] p-[12px] rounded-[24px] bg-[rgba(255,255,255,0.70)] border-[1px] border-blanco"}>
          <View className={"min-h-[52px] flex-row items-center px-[12px] rounded-[18px] bg-[rgba(255,255,255,0.78)] border-[1px] border-[#C8E3EF]"}>
            <Text className={"text-[28px] text-[#34799A] mr-[8px]"}>⌕</Text>
            <TextInput
              value={busqueda}
              onChangeText={setBusqueda}
              placeholder="Código de medidor o período..."
              placeholderTextColor="#69879A"
              className={"flex-1 text-texto text-[14px] py-[8px]"}
              autoCapitalize="characters"
              accessibilityLabel="Buscar lecturas por medidor o período"
              returnKeyType="search"
            />
            {busqueda.length > 0 && (
              <Pressable
                onPress={() => setBusqueda('')}
                accessibilityRole="button"
                accessibilityLabel="Limpiar búsqueda"
                className={"w-[30px] h-[30px] items-center justify-center rounded-[15px] bg-[#E3F1F7]"}
              >
                <Text className={"text-[#245D7A] text-[22px]"}>×</Text>
              </Pressable>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName={"gap-[8px] pt-[12px] pb-[2px]"}
          >
            {FILTROS.map((item) => {
              const activo = filtro === item.value;

              return (
                <Pressable
                  key={item.value}
                  onPress={() => setFiltro(item.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activo }}
                  className={(activo ? "shadow-[0px_4px_8px_rgba(8,127,196,0.2)] min-h-[39px] flex-row items-center gap-[6px] px-[12px] rounded-[99px] bg-[#087FC4] border-[1px] border-[#087FC4]" : "min-h-[39px] flex-row items-center gap-[6px] px-[12px] rounded-[99px] bg-[rgba(255,255,255,0.72)] border-[1px] border-[#D1E6F0]")}
                >
                  <Text
                    className={(activo ? "text-blanco text-[15px] font-[700]" : "text-[#47748E] text-[15px] font-[700]")}
                  >
                    {item.icon}
                  </Text>
                  <Text
                    className={(activo ? "text-blanco text-[12px] font-[600]" : "text-[#345F7A] text-[12px] font-[600]")}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Lista */}
        <View className={"mt-[24px] mb-[12px] mx-[16px] flex-row items-center justify-between"}>
          <View>
            <Text className={"text-[19px] font-[600] leading-[26px] text-[#103E66]"}>Registros guardados</Text>
            <Text className={"text-[12px] font-[400] leading-[24px] text-[#5A788D] mt-[3px]"}>
              {filtradas.length}{' '}
              {filtradas.length === 1
                ? 'registro encontrado'
                : 'registros encontrados'}
            </Text>
          </View>

          <View className={"min-w-[42px] h-[36px] px-[8px] items-center justify-center rounded-[13px] bg-[#DDF4FA] border-[1px] border-[#BCE7F3]"}>
            <Text className={"text-[#0877A5] text-[15px] font-[800]"}>
              {String(filtradas.length).padStart(2, '0')}
            </Text>
          </View>
        </View>

        {cargando ? (
          <View className={"mx-[12px] items-center px-[16px] py-[36px] rounded-[24px] bg-[rgba(255,255,255,0.76)] border-[1px] border-blanco"}>
            <ActivityIndicator size="large" color="#087FC4" />
            <Text className={"text-[#103E66] text-[17px] font-[800] text-center"}>Cargando historial</Text>
            <Text className={"text-[#5A788D] text-[13px] leading-[20px] text-center mt-[8px] max-w-[320px]"}>
              Consultando los registros almacenados en el dispositivo.
            </Text>
          </View>
        ) : error ? (
          <View className={"mx-[12px] items-center px-[16px] py-[36px] rounded-[24px] bg-[rgba(255,255,255,0.76)] border-[1px] border-blanco"}>
            <View className={"w-[58px] h-[58px] rounded-[21px] bg-[#FFE1E6] items-center justify-center mb-[12px]"}>
              <Text className={"text-[#C7354F] text-[28px] font-[800]"}>!</Text>
            </View>
            <Text className={"text-[#103E66] text-[17px] font-[800] text-center"}>No se pudo cargar</Text>
            <Text className={"text-[#5A788D] text-[13px] leading-[20px] text-center mt-[8px] max-w-[320px]"}>{error}</Text>
            <Pressable
              onPress={() => {
                setCargando(true);
                void cargarLecturas().finally(() => setCargando(false));
              }}
              className={"mt-[12px] px-[16px] py-[8px] rounded-[99px] bg-[#087FC4]"}
              accessibilityRole="button"
            >
              <Text className={"text-blanco text-[13px] font-[700]"}>Intentar de nuevo</Text>
            </Pressable>
          </View>
        ) : filtradas.length === 0 ? (
          <View className={"mx-[12px] items-center px-[16px] py-[36px] rounded-[24px] bg-[rgba(255,255,255,0.76)] border-[1px] border-blanco"}>
            <View className={"w-[58px] h-[58px] rounded-[21px] bg-[#DDF5FC] items-center justify-center mb-[12px]"}>
              <Text className={"text-[#087FC4] text-[35px] font-[700]"}>◇</Text>
            </View>
            <Text className={"text-[#103E66] text-[17px] font-[800] text-center"}>
              {lecturas.length === 0
                ? 'Todavía no hay lecturas'
                : 'No hay coincidencias'}
            </Text>
            <Text className={"text-[#5A788D] text-[13px] leading-[20px] text-center mt-[8px] max-w-[320px]"}>
              {lecturas.length === 0
                ? 'Cuando registres una lectura, aparecerá aquí con su estado de sincronización.'
                : 'Prueba con otro código, período o filtro.'}
            </Text>
            {lecturas.length > 0 && (
              <Pressable
                onPress={() => {
                  setBusqueda('');
                  setFiltro('todas');
                }}
                className={"mt-[12px] px-[16px] py-[8px] rounded-[99px] bg-[#087FC4]"}
                accessibilityRole="button"
              >
                <Text className={"text-blanco text-[13px] font-[700]"}>Limpiar filtros</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View className={"px-[12px] gap-[12px]"}>
            {filtradas.map((lectura) => (
              <TarjetaLectura
                key={lectura.claveUnica}
                lectura={lectura}
              />
            ))}
          </View>
        )}

        <View className={"mt-[16px] mx-[12px] p-[12px] rounded-[18px] flex-row items-center gap-[8px] bg-[rgba(222,244,251,0.76)] border-[1px] border-blanco"}>
          <View className={"w-[34px] h-[34px] rounded-[12px] items-center justify-center bg-blanco"}>
            <Text className={"text-[#087FC4] text-[23px] font-[700]"}>↻</Text>
          </View>
          <View className={"flex-1"}>
            <Text className={"text-[#16496D] text-[12px] font-[800]"}>Historial local</Text>
            <Text className={"text-[#5A788D] text-[11px] mt-[3px]"}>
              Desliza hacia abajo para actualizar la lista.
            </Text>
          </View>
          <View className={"w-[7px] h-[7px] rounded-[4px] bg-[#20B990]"} />
        </View>
      </ScrollView>
    </View>
  );
}

function Resumen({
  icono,
  etiqueta,
  valor,
  tono,
}: {
  icono: string;
  etiqueta: string;
  valor: number;
  tono: 'total' | Tono;
}) {
  const color =
    tono === 'total' ? '#0875A7' : TONOS[tono].texto;
  const fondo =
    tono === 'total' ? '#D1F1FF' : TONOS[tono].fondo;

  return (
    <View className={(tono === 'total' ? "flex-1 min-w-[0px] items-start px-[5px] py-[8px] rounded-[16px] bg-[#EAF8FF] border-[1px] border-[#B5E8F7]" : "flex-1 min-w-[0px] items-start px-[5px] py-[8px] rounded-[16px] bg-[rgba(255,255,255,0.52)] border-[1px] border-[rgba(255,255,255,0.8)]")}>
      <View className={["w-[28px] h-[28px] rounded-[14px] items-center justify-center mb-[8px]", clasesDinamicas.backgroundColor[fondo]].filter(Boolean).join(' ')}>
        <Text className={["text-[16px] font-[800]", clasesDinamicas.color[color]].filter(Boolean).join(' ')}>{icono}</Text>
      </View>
      <Text className={"text-[10px] leading-[13px] text-[#45627A] font-[600] min-h-[26px]"}>{etiqueta}</Text>
      <Text className={["text-[22px] leading-[27px] font-[800]", clasesDinamicas.color[color]].filter(Boolean).join(' ')}>{valor}</Text>
    </View>
  );
}

function TarjetaLectura({ lectura }: { lectura: LecturaLocal }) {
  const tono = tonoEstado(lectura.syncEstado);
  const paleta = TONOS[tono];
  const requiereAccion = lectura.verificacion === 'requiere_accion';

  return (
    <View className={"shadow-[0px_7px_16px_rgba(10,69,106,0.09)] rounded-[24px] p-[12px] bg-[rgba(255,255,255,0.82)] border-[1px] border-blanco overflow-hidden"}>
      <View className={"flex-row items-center gap-[8px] pb-[12px]"}>
        <View
          className={["w-[49px] h-[49px] rounded-[18px] items-center justify-center relative border-[1px]", [clasesDinamicas.backgroundColor[paleta.fondo], clasesDinamicas.borderColor[paleta.borde]].filter(Boolean).join(' ')].filter(Boolean).join(' ')}
        >
          <Text className={["text-[31px] font-[700]", clasesDinamicas.color[paleta.texto]].filter(Boolean).join(' ')}>◇</Text>
          <View className={["absolute right-[1px] bottom-[1px] w-[10px] h-[10px] rounded-[5px] border-[2px] border-blanco", clasesDinamicas.backgroundColor[paleta.texto]].filter(Boolean).join(' ')} />
        </View>

        <View className={"flex-1 min-w-[0px]"}>
          <Text className={"text-[#0A355E] text-[15px] font-[800]"}>{lectura.medidorCodigo}</Text>
          <Text className={"text-[#587990] text-[11px] mt-[5px]"}>▦  Período: {lectura.periodo}</Text>
        </View>

        <View
          className={["flex-row items-center gap-[4px] px-[7px] py-[7px] rounded-[99px] border-[1px]", [clasesDinamicas.backgroundColor[paleta.fondo], clasesDinamicas.borderColor[paleta.borde]].filter(Boolean).join(' ')].filter(Boolean).join(' ')}
        >
          <Text className={["text-[12px] font-[900]", clasesDinamicas.color[paleta.texto]].filter(Boolean).join(' ')}>
            {lectura.syncEstado === 'enviada'
              ? '✓'
              : lectura.syncEstado === 'error'
                ? '!'
                : lectura.syncEstado === 'enviando'
                  ? '↗'
                  : '◷'}
          </Text>
          <Text className={["text-[10px] font-[800]", clasesDinamicas.color[paleta.texto]].filter(Boolean).join(' ')}>
            {ESTADOS[lectura.syncEstado]}
          </Text>
        </View>
      </View>

      <View className={"flex-row items-stretch pt-[12px] border-t-[1px] border-t-[#DCEBF1] gap-[4px]"}>
        <Dato
          icono="◉"
          etiqueta="Lectura"
          valor={
            lectura.lectura == null
              ? '—'
              : `${formatearNumero(lectura.lectura)} m³`
          }
        />
        <View className={"w-[1px] bg-[#DCEBF1] my-[2px]"} />
        <Dato
          icono="▥"
          etiqueta="Consumo"
          valor={
            lectura.consumo == null
              ? '—'
              : `${formatearNumero(lectura.consumo)} m³`
          }
        />
        <View className={"w-[1px] bg-[#DCEBF1] my-[2px]"} />
        <Dato
          icono={requiereAccion ? '!' : '✓'}
          etiqueta="Verificación"
          valor={etiquetaVerificacion(lectura.verificacion)}
          advertencia={requiereAccion}
        />
      </View>

      {(lectura.consumoAnomalo || lectura.ultimoError) && (
        <View
          className={(lectura.ultimoError ? "flex-row items-start gap-[8px] mt-[12px] p-[8px] rounded-[12px] bg-[#FFF0F1]" : "flex-row items-start gap-[8px] mt-[12px] p-[8px] rounded-[12px] bg-[#FFF6DF]")}
        >
          <Text className={"text-[#A96500] font-[900]"}>
            {lectura.ultimoError ? '!' : '↗'}
          </Text>
          <Text className={"flex-1 text-[#80511A] text-[11px] leading-[16px]"}>
            {lectura.ultimoError ||
              'Consumo fuera del rango habitual. Revisa la lectura.'}
          </Text>
        </View>
      )}
    </View>
  );
}

function Dato({
  icono,
  etiqueta,
  valor,
  advertencia = false,
}: {
  icono: string;
  etiqueta: string;
  valor: string;
  advertencia?: boolean;
}) {
  return (
    <View className={"flex-1 min-w-[0px] px-[2px]"}>
      <View
        className={(advertencia ? "w-[28px] h-[28px] rounded-[14px] bg-[#FFF0C8] items-center justify-center mb-[4px]" : "w-[28px] h-[28px] rounded-[14px] bg-[#E0F3FA] items-center justify-center mb-[4px]")}
      >
        <Text
          className={(advertencia ? "text-[#A96500] text-[14px] font-[800]" : "text-[#0877AD] text-[14px] font-[800]")}
        >
          {icono}
        </Text>
      </View>
      <Text className={"text-[#5A788D] text-[10px] mb-[4px]"}>{etiqueta}</Text>
      <Text
        numberOfLines={2}
        className={(advertencia ? "text-[#A96500] text-[11px] leading-[15px] font-[800]" : "text-[#103E66] text-[11px] leading-[15px] font-[800]")}
      >
        {valor}
      </Text>
    </View>
  );
}
