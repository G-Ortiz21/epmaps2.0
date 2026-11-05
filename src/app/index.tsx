import { Redirect } from 'expo-router';
import { useSesion } from '../contexts/SesionContext';

export default function IndexRoute() {
  const { estado } = useSesion();

  const destino =
    estado === 'autenticado'
      ? '/inicio'
      : estado === 'sin_verificar'
        ? '/verificar-correo'
        : '/login';

  return <Redirect href={destino} />;
}
