import { createContext, useContext, type ReactNode } from 'react';
import { useNetworkState } from 'expo-network';

export interface EstadoConexion {
  conectado: boolean;
  internetAlcanzable: boolean | null;
  enLinea: boolean;
}

const ConexionContext = createContext<EstadoConexion | null>(null);

export function ConexionProvider({ children }: { children: ReactNode }) {
  const networkState = useNetworkState();
  const conectado = networkState.isConnected === true;
  const internetAlcanzable = networkState.isInternetReachable ?? null;

  return (
    <ConexionContext.Provider
      value={{
        conectado,
        internetAlcanzable,
        enLinea: conectado && internetAlcanzable !== false,
      }}
    >
      {children}
    </ConexionContext.Provider>
  );
}

export function useConexion(): EstadoConexion {
  const context = useContext(ConexionContext);
  if (context === null) {
    throw new Error('useConexion debe utilizarse dentro de ConexionProvider.');
  }
  return context;
}