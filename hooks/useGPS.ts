'use client';

import { useState, useEffect } from 'react';

export interface GPSPosition {
  lat: number;
  lng: number;
  accuracy: number;
}

export interface GPSState {
  position: GPSPosition | null;
  error: string | null;
  loading: boolean;
}

export function useGPS(watch: boolean = false): GPSState {
  const [state, setState] = useState<GPSState>({
    position: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setState({ position: null, error: 'GPS를 지원하지 않는 브라우저입니다.', loading: false });
      return;
    }

    const onSuccess = (pos: GeolocationPosition) => {
      setState({
        position: {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        },
        error: null,
        loading: false,
      });
    };

    const onError = (err: GeolocationPositionError) => {
      setState({ position: null, error: err.message, loading: false });
    };

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    };

    if (watch) {
      const id = navigator.geolocation.watchPosition(onSuccess, onError, options);
      return () => navigator.geolocation.clearWatch(id);
    } else {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
    }
  }, [watch]);

  return state;
}
