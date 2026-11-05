
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';
import {
  eliminarBorrador,
  guardarBorrador,
  obtenerBorrador,
} from '../data/repositories/borradorRepository';
import type {
  BorradorRegistro,
  DatosRegistroLectura,
  EstadoMedidor,
  PasoRegistro,
} from '../domain/tipos';
import { eliminarFoto } from '../services/fotoService';

export interface EstadoRegistro {
  codigoMedidor: string | null;
  estadoMedidor: EstadoMedidor | null;
  paso: PasoRegistro;
  datos: DatosRegistroLectura;
}

interface ContextoRegistro {
  registro: EstadoRegistro;
  cargandoBorrador: boolean;
  hayRegistroPendiente: boolean;
  definirCodigoMedidor: (codigo: string | null) => void;
  definirEstadoMedidor: (estado: EstadoMedidor | null) => void;
  definirPaso: (paso: PasoRegistro) => void;
  actualizarDatos: (cambios: Partial<DatosRegistroLectura>) => void;
  reiniciarRegistro: () => void;
  descartarRegistro: () => Promise<void>;
}

const RegistroContext = createContext<ContextoRegistro | null>(null);

const ESTADO_INICIAL: EstadoRegistro = {
  codigoMedidor: null,
  estadoMedidor: null,
  paso: 'estado_medidor',
  datos: {},
};

const RETARDO_GUARDADO_MS = 300;

function existeRegistroIniciado(
  borrador: BorradorRegistro | null,
): boolean {
  if (borrador === null) {
    return false;
  }

  return (
    borrador.estadoMedidor !== null ||
    borrador.codigoMedidor !== null ||
    borrador.datos.lectura != null ||
    borrador.datos.motivo != null ||
    borrador.datos.descripcion != null ||
    borrador.datos.fotoNombre != null
  );
}

export function RegistroProvider({ children }: { children: ReactNode }) {
  const [registro, setRegistro] =
    useState<EstadoRegistro>(ESTADO_INICIAL);
  const [cargandoBorrador, setCargandoBorrador] = useState(true);
  const [hayRegistroPendiente, setHayRegistroPendiente] = useState(false);

  const cargadoRef = useRef(false);
  const registroRef = useRef(registro);
  const pasoPrevioRef = useRef<PasoRegistro | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    registroRef.current = registro;
  }, [registro]);

  useEffect(() => {
    let vigente = true;

    void obtenerBorrador()
      .then((borrador) => {
        if (!vigente) {
          return;
        }

        if (borrador !== null && existeRegistroIniciado(borrador)) {
          const registroRecuperado: EstadoRegistro = {
            codigoMedidor: borrador.codigoMedidor,
            estadoMedidor: borrador.estadoMedidor,
            paso: borrador.paso,
            datos: borrador.datos,
          };

          registroRef.current = registroRecuperado;
          setRegistro(registroRecuperado);
          pasoPrevioRef.current = borrador.paso;
          setHayRegistroPendiente(true);
        }

        cargadoRef.current = true;
        setCargandoBorrador(false);
      })
      .catch((error: unknown) => {
        if (!vigente) {
          return;
        }

        console.error(
          'No se pudo leer el borrador del registro.',
          error,
        );

        cargadoRef.current = true;
        setCargandoBorrador(false);
      });

    return () => {
      vigente = false;

      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  async function escribirBorrador(
    estado: EstadoRegistro,
  ): Promise<void> {
    try {
      await guardarBorrador({
        codigoMedidor: estado.codigoMedidor,
        estadoMedidor: estado.estadoMedidor,
        paso: estado.paso,
        datos: estado.datos,
      });
    } catch (error: unknown) {
      console.error(
        'No se pudo guardar el borrador del registro.',
        error,
      );
    }
  }

  function cancelarRetardo(): void {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  useEffect(() => {
    if (!cargadoRef.current) {
      return;
    }

    const cambioDePaso =
      pasoPrevioRef.current !== null &&
      pasoPrevioRef.current !== registro.paso;

    pasoPrevioRef.current = registro.paso;
    cancelarRetardo();

    if (cambioDePaso) {
      void escribirBorrador(registro);
      return;
    }

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void escribirBorrador(registroRef.current);
    }, RETARDO_GUARDADO_MS);
  }, [registro]);

  useEffect(() => {
    const suscripcion = AppState.addEventListener(
      'change',
      (estadoApp) => {
        if (
          estadoApp !== 'background' ||
          !cargadoRef.current
        ) {
          return;
        }

        cancelarRetardo();
        void escribirBorrador(registroRef.current);
      },
    );

    return () => {
      suscripcion.remove();
    };
  }, []);

  const definirCodigoMedidor = useCallback(
    (codigo: string | null) => {
      setRegistro((anterior) => ({
        ...anterior,
        codigoMedidor: codigo,
      }));
    },
    [],
  );

  const definirEstadoMedidor = useCallback(
    (estado: EstadoMedidor | null) => {
      setRegistro((anterior) => ({
        ...anterior,
        estadoMedidor: estado,
      }));
    },
    [],
  );

  const definirPaso = useCallback((paso: PasoRegistro) => {
    setRegistro((anterior) => ({
      ...anterior,
      paso,
    }));
  }, []);

  const actualizarDatos = useCallback(
    (cambios: Partial<DatosRegistroLectura>) => {
      setRegistro((anterior) => ({
        ...anterior,
        datos: {
          ...anterior.datos,
          ...cambios,
        },
      }));
    },
    [],
  );

  const reiniciarRegistro = useCallback(() => {
    cancelarRetardo();
    pasoPrevioRef.current = null;
    registroRef.current = ESTADO_INICIAL;
    setRegistro(ESTADO_INICIAL);
    setHayRegistroPendiente(false);
  }, []);

  const descartarRegistro = useCallback(async () => {
    cancelarRetardo();

    const fotoNombre = registroRef.current.datos.fotoNombre;

    if (typeof fotoNombre === 'string' && fotoNombre.length > 0) {
      try {
        await eliminarFoto(fotoNombre);
      } catch (error: unknown) {
        console.error(
          'No se pudo eliminar la fotografía del registro.',
          error,
        );
      }
    }

    await eliminarBorrador();

    pasoPrevioRef.current = null;
    registroRef.current = ESTADO_INICIAL;
    setRegistro(ESTADO_INICIAL);
    setHayRegistroPendiente(false);
  }, []);

  const valor = useMemo<ContextoRegistro>(
    () => ({
      registro,
      cargandoBorrador,
      hayRegistroPendiente,
      definirCodigoMedidor,
      definirEstadoMedidor,
      definirPaso,
      actualizarDatos,
      reiniciarRegistro,
      descartarRegistro,
    }),
    [
      registro,
      cargandoBorrador,
      hayRegistroPendiente,
      definirCodigoMedidor,
      definirEstadoMedidor,
      definirPaso,
      actualizarDatos,
      reiniciarRegistro,
      descartarRegistro,
    ],
  );

  return (
    <RegistroContext.Provider value={valor}>
      {children}
    </RegistroContext.Provider>
  );
}

export function useRegistro(): ContextoRegistro {
  const context = useContext(RegistroContext);

  if (context === null) {
    throw new Error(
      'useRegistro debe utilizarse dentro de RegistroProvider.',
    );
  }

  return context;
}
