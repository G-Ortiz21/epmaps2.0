
import { useEffect, useRef } from 'react';
import { useConexion } from '../contexts/ConexionContext';
import { sincronizarLecturasPendientes } from '../sync/syncEngine';

export default function SincronizacionAutomatica() {
  const { enLinea } = useConexion();
  const sincronizacionAnterior = useRef(false);

  useEffect(() => {
    if (!enLinea) {
      sincronizacionAnterior.current = false;
      return;
    }

    if (sincronizacionAnterior.current) {
      return;
    }

    sincronizacionAnterior.current = true;

    void sincronizarLecturasPendientes()
      .then((resultado) => {
        console.info('Resultado de sincronización:', resultado);
      })
      .catch((error: unknown) => {
        console.error('Error en la sincronización automática:', error);
      });
  }, [enLinea]);

  return null;
}
