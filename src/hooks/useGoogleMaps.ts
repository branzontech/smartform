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
    // Don't load if no API key provided
    if (!apiKey) {
      console.log('useGoogleMaps: No API key provided, waiting...');
      return;
    }

    // Check if already loaded with the correct key
    if (window.google?.maps) {
      // Verify it was loaded with a key (not empty)
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]') as HTMLScriptElement;
      if (existingScript && existingScript.src.includes(`key=${apiKey}`)) {
        setIsLoaded(true);
        return;
      }
      // If loaded with wrong/empty key, remove and reload
      if (existingScript && existingScript.src.includes('key=&')) {
        console.log('useGoogleMaps: Removing script loaded with empty key');
        existingScript.remove();
        // Clear the google object to force reload
        // @ts-ignore
        delete window.google;
      } else {
        setIsLoaded(true);
        return;
      }
    }

    // Check if script is already loading in DOM with correct key
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"][src*="key=${apiKey}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsLoaded(true));
      return;
    }

    // Remove any script with empty key
    const emptyKeyScript = document.querySelector('script[src*="maps.googleapis.com"][src*="key=&"]');
    if (emptyKeyScript) {
      console.log('useGoogleMaps: Removing script with empty key');
      emptyKeyScript.remove();
    }

    console.log('useGoogleMaps: Loading Google Maps with key:', apiKey.substring(0, 10) + '...');

    // Create callback function
    window.initGoogleMaps = () => {
      console.log('useGoogleMaps: Google Maps loaded successfully');
      setIsLoaded(true);
    };

    // Load the script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libraries.join(',')}&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      console.error('useGoogleMaps: Failed to load Google Maps script');
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
