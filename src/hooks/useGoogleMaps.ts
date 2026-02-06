/// <reference types="@types/google.maps" />
import { useState, useEffect, useCallback } from 'react';

declare global {
  interface Window {
    google: typeof google;
    initGoogleMaps: () => void;
  }
}

interface UseGoogleMapsOptions {
  apiKey: string;
  libraries?: string[];
}

export const useGoogleMaps = ({ apiKey, libraries = ['drawing', 'geometry'] }: UseGoogleMapsOptions) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    // Check if already loaded
    if (window.google?.maps) {
      setIsLoaded(true);
      return;
    }

    // Check if script is already in DOM
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsLoaded(true));
      return;
    }

    // Create callback function
    window.initGoogleMaps = () => {
      setIsLoaded(true);
    };

    // Load the script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libraries.join(',')}&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      setLoadError(new Error('Failed to load Google Maps script'));
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup callback
      delete window.initGoogleMaps;
    };
  }, [apiKey, libraries]);

  // Check if a point is inside a polygon
  const isPointInPolygon = useCallback((point: google.maps.LatLngLiteral, polygon: google.maps.LatLngLiteral[]): boolean => {
    if (!window.google?.maps?.geometry) return false;
    
    const googlePolygon = new google.maps.Polygon({ paths: polygon });
    const googlePoint = new google.maps.LatLng(point.lat, point.lng);
    
    return google.maps.geometry.poly.containsLocation(googlePoint, googlePolygon);
  }, []);

  // Calculate polygon center
  const getPolygonCenter = useCallback((polygon: google.maps.LatLngLiteral[]): google.maps.LatLngLiteral => {
    if (polygon.length === 0) return { lat: 0, lng: 0 };
    
    const bounds = new google.maps.LatLngBounds();
    polygon.forEach(point => bounds.extend(point));
    const center = bounds.getCenter();
    
    return { lat: center.lat(), lng: center.lng() };
  }, []);

  // Calculate distance between two points (in km)
  const getDistance = useCallback((point1: google.maps.LatLngLiteral, point2: google.maps.LatLngLiteral): number => {
    if (!window.google?.maps?.geometry) return 0;
    
    const p1 = new google.maps.LatLng(point1.lat, point1.lng);
    const p2 = new google.maps.LatLng(point2.lat, point2.lng);
    
    return google.maps.geometry.spherical.computeDistanceBetween(p1, p2) / 1000;
  }, []);

  return {
    isLoaded,
    loadError,
    isPointInPolygon,
    getPolygonCenter,
    getDistance,
  };
};
