import { Text, View } from 'react-native';
import type { MedidorOficina } from '../domain/tipos';

interface MedidorCardProps {
  medidor: MedidorOficina;
  origen: 'oficina' | 'cache_local';
  consultadoEn: string;
}

export function MedidorCard({
  medidor,
  origen,
  consultadoEn,
}: MedidorCardProps) {
  return (
    <View className="gap-3 rounded-xl border border-borde bg-superficie p-4">
      <Text className="text-xs font-medium leading-4 text-marca-oscura">
        DATOS DEL MEDIDOR
      </Text>
      <Text className="font-mono text-[15px] font-medium leading-5 text-marca-oscura">
        {medidor.codigo}
      </Text>
      <Text className="text-xl font-semibold leading-[26px] text-texto">
        {medidor.direccion}
      </Text>

      <Dato etiqueta="SECTOR" valor={medidor.sector ?? 'No disponible'} />
      <Dato
        etiqueta="NÚMERO DE CUENTA"
        valor={medidor.numeroCuenta ?? 'No disponible'}
      />
      <Dato etiqueta="ESTADO DE OFICINA" valor={medidor.estadoOficina} />

      <View className="gap-3 rounded-lg bg-superficie-suave p-3">
        <Dato
          etiqueta="ÚLTIMA LECTURA"
          valor={
            medidor.ultimaLectura === null
              ? 'No disponible'
              : String(medidor.ultimaLectura)
          }
        />
        <Dato
          etiqueta="FECHA DE LECTURA"
          valor={medidor.fechaUltimaLectura ?? 'No disponible'}
        />
        <Dato
          etiqueta="PROMEDIO MENSUAL"
          valor={
            medidor.promedioMensual === null
              ? 'No disponible'
              : String(medidor.promedioMensual)
          }
        />
      </View>

      <View
        className={`gap-1 border-l-[3px] pl-3 ${origen === 'oficina' ? 'border-exito' : 'border-informacion'}`}
        accessibilityRole="summary"
      >
        <Text className="text-sm font-medium leading-5 text-texto">
          {origen === 'oficina'
            ? 'Datos consultados en la oficina'
            : 'Datos de caché local'}
        </Text>
        <Text className="text-base leading-6 text-texto-secundario">
          Consulta local: {new Date(consultadoEn).toLocaleString()}
        </Text>
      </View>
    </View>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View className="gap-1">
      <Text className="text-xs font-medium leading-4 text-texto-secundario">
        {etiqueta}
      </Text>
      <Text className="text-base leading-6 text-texto">{valor}</Text>
    </View>
  );
}
