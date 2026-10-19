/// <reference types="@types/google.maps" />
/**
 * Mapa limpio, al estilo de las apps de transporte (el mismo del software de
 * rutas de profesionales): sin negocios ni transporte público, calles blancas,
 * agua azul claro y parques verdes. Solo quedan los nombres que orientan.
 */
export const MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#f2f4f7" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8a929e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }, { weight: 3 }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.neighborhood", elementType: "labels.text.fill", stylers: [{ color: "#a3abb6" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#5f6772" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ visibility: "on" }, { color: "#d3efcf" }] },
  { featureType: "landscape.man_made", elementType: "geometry", stylers: [{ color: "#eef1f5" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#e8f3e3" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#dfe4ea" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9aa2ad" }] },
  { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#d2d9e1" }] },
  { featureType: "road.local", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#acd8f6" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#6f9fc6" }] },
];

/** Centro por defecto (Cartagena) mientras no hay puntos que encuadrar. */
export const DEFAULT_CENTER = { lat: 10.391, lng: -75.4794 };
