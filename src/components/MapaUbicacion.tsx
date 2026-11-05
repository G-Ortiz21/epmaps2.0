import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { UbicacionLectura } from '../domain/tipos';
import { crearUbicacionManual } from '../domain/ubicacion';

const MAPA_HTML = `<!doctype html>
<html lang="es">
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>html,body,#map{height:100%;margin:0;background:#eaf4f8}.leaflet-container{font-family:Arial,sans-serif}</style>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
</head>
<body><div id="map"></div>
<script>
(function(){
  if (!window.L) {
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'map-error'}));
    return;
  }
  var map = L.map('map', {zoomControl:true}).setView([-0.1807,-78.4678], 15);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom:19,
    attribution:'© OpenStreetMap contributors'
  }).addTo(map);
  var marker = null;
  var selectable = false;
  function report(lat, lng) {
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'selection',latitude:lat,longitude:lng}));
  }
  function setPoint(lat, lng, reportSelection) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return;
    if (marker) {
      marker.setLatLng([lat,lng]);
      if (selectable) marker.dragging.enable(); else marker.dragging.disable();
    } else {
      marker = L.marker([lat,lng], {draggable:selectable}).addTo(map);
      marker.on('dragend', function(){
        var point = marker.getLatLng();
        report(point.lat, point.lng);
      });
    }
    map.setView([lat,lng], Math.max(map.getZoom(), 16));
    if (reportSelection) report(lat,lng);
  }
  window.configurePoint = function(point, canSelect) {
    selectable = canSelect === true;
    if (point && Number.isFinite(point.latitude) && Number.isFinite(point.longitude)) {
      setPoint(point.latitude, point.longitude, false);
    }
    if (marker) {
      if (selectable) marker.dragging.enable(); else marker.dragging.disable();
    }
  };
  map.on('click', function(event){
    if (selectable) setPoint(event.latlng.lat,event.latlng.lng,true);
  });
  window.ReactNativeWebView.postMessage(JSON.stringify({type:'map-ready'}));
})();
</script></body></html>`;

interface MapaUbicacionProps {
  ubicacion: UbicacionLectura | null;
  seleccionable: boolean;
  onSeleccionar?: (ubicacion: UbicacionLectura) => void;
}

export function MapaUbicacion({
  ubicacion,
  seleccionable,
  onSeleccionar,
}: MapaUbicacionProps) {
  const webViewRef = useRef<WebView>(null);
  const [mapaListo, setMapaListo] = useState(false);
  const [mapaError, setMapaError] = useState(false);
  const [latitudTexto, setLatitudTexto] = useState('');
  const [longitudTexto, setLongitudTexto] = useState('');
  const [errorManual, setErrorManual] = useState<string | null>(null);

  useEffect(() => {
    if (!mapaListo) return;
    const point = ubicacion
      ? { latitude: ubicacion.latitud, longitude: ubicacion.longitud }
      : null;
    webViewRef.current?.injectJavaScript(
      `window.configurePoint(${JSON.stringify(point)},${JSON.stringify(seleccionable)});true;`,
    );
  }, [mapaListo, seleccionable, ubicacion]);

  function recibirMensaje(event: WebViewMessageEvent): void {
    let mensaje: unknown;
    try {
      mensaje = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }

    if (typeof mensaje !== 'object' || mensaje === null || Array.isArray(mensaje)) {
      return;
    }

    const registro = mensaje as Record<string, unknown>;
    if (registro.type === 'map-ready') {
      setMapaListo(true);
      setMapaError(false);
      return;
    }
    if (registro.type === 'map-error') {
      setMapaError(true);
      return;
    }
    if (
      registro.type !== 'selection' ||
      !seleccionable ||
      typeof registro.latitude !== 'number' ||
      typeof registro.longitude !== 'number'
    ) {
      return;
    }

    try {
      onSeleccionar?.(crearUbicacionManual(registro.latitude, registro.longitude));
      setLatitudTexto(String(registro.latitude));
      setLongitudTexto(String(registro.longitude));
      setErrorManual(null);
    } catch {
      setErrorManual('El mapa devolvió coordenadas inválidas.');
    }
  }

  function usarCoordenadasIngresadas(): void {
    if (latitudTexto.trim() === '' || longitudTexto.trim() === '') {
      setErrorManual('Ingresa latitud y longitud para seleccionar el punto.');
      return;
    }

    const latitud = Number(latitudTexto);
    const longitud = Number(longitudTexto);
    try {
      const punto = crearUbicacionManual(latitud, longitud);
      onSeleccionar?.(punto);
      setErrorManual(null);
    } catch {
      setErrorManual('Usa latitud entre -90 y 90 y longitud entre -180 y 180.');
    }
  }

  return (
    <View className="gap-3">
      <View className="h-[260px] overflow-hidden rounded-[16px] border border-borde bg-superficie">
        <WebView
          ref={webViewRef}
          accessibilityLabel="Mapa de OpenStreetMap"
          originWhitelist={['https://localhost']}
          source={{ html: MAPA_HTML, baseUrl: 'https://localhost/' }}
          javaScriptEnabled
          domStorageEnabled={false}
          allowFileAccess={false}
          onMessage={recibirMensaje}
          onError={() => setMapaError(true)}
          onShouldStartLoadWithRequest={(request) =>
            request.url === 'about:blank' || request.url.startsWith('https://localhost/')
          }
          className="flex-1"
        />
        {mapaError ? (
          <View pointerEvents="none" className="absolute inset-x-2 top-2 rounded-lg bg-fondo/95 p-2">
            <Text className="text-xs text-texto-secundario">
              El mapa requiere conexión. También puedes ingresar las coordenadas manualmente.
            </Text>
          </View>
        ) : null}
      </View>

      {seleccionable ? (
        <View className="gap-2">
          <Text className="text-sm font-semibold text-texto">
            Toca o arrastra el marcador, o ingresa coordenadas
          </Text>
          <View className="flex-row gap-2">
            <TextInput
              accessibilityLabel="Latitud manual"
              keyboardType="numbers-and-punctuation"
              onChangeText={setLatitudTexto}
              placeholder="Latitud"
              value={latitudTexto}
              className="min-h-[48px] flex-1 rounded-xl border border-borde bg-superficie px-3 text-texto"
            />
            <TextInput
              accessibilityLabel="Longitud manual"
              keyboardType="numbers-and-punctuation"
              onChangeText={setLongitudTexto}
              placeholder="Longitud"
              value={longitudTexto}
              className="min-h-[48px] flex-1 rounded-xl border border-borde bg-superficie px-3 text-texto"
            />
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={usarCoordenadasIngresadas}
            className="min-h-[48px] items-center justify-center rounded-xl border border-borde bg-superficie px-4"
          >
            <Text className="font-semibold text-texto">Usar coordenadas ingresadas</Text>
          </Pressable>
          {errorManual ? (
            <Text accessibilityRole="alert" className="text-sm text-error">{errorManual}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}