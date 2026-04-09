'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Hotel } from '@/types/hotel';

type HotelMapProps = {
  hotels: Hotel[];
};

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function loadGoogleMaps(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!GOOGLE_MAPS_API_KEY) {
      reject(new Error('Google Maps API key is not configured.'));
      return;
    }
    if (typeof window !== 'undefined' && window.google?.maps) {
      resolve();
      return;
    }
    const existing = document.getElementById('google-maps-script');
    if (existing) {
      if (window.google?.maps) {
        resolve();
      } else {
        existing.addEventListener('load', () => resolve());
      }
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (e) =>
      reject(new Error(`Google Maps failed to load: ${e}`));
    document.head.appendChild(script);
  });
}

export function HotelMap({ hotels }: HotelMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [error, setError] = useState('');

  const initMap = useCallback(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const hotelsWithCoords = hotels.filter(
      (h) => h.latitude > 0 && h.longitude > 0,
    );
    if (hotelsWithCoords.length === 0) return;

    const map = new google.maps.Map(mapRef.current, {
      zoom: 11,
      center: { lat: 35.6812, lng: 139.7671 },
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });
    mapInstanceRef.current = map;
    infoWindowRef.current = new google.maps.InfoWindow();

    const bounds = new google.maps.LatLngBounds();

    for (const hotel of hotelsWithCoords) {
      const position = { lat: hotel.latitude, lng: hotel.longitude };
      bounds.extend(position);

      const priceLabel =
        hotel.price > 0 ? `¥${hotel.price.toLocaleString()}` : '–';

      const marker = new google.maps.Marker({
        map,
        position,
        title: hotel.name,
        label: {
          text: priceLabel,
          color: '#ffffff',
          fontSize: '11px',
          fontWeight: '600',
        },
        icon: {
          path: 'M-20,-8 L20,-8 L20,8 L0,14 L-20,8 Z',
          fillColor: '#1a6b8a',
          fillOpacity: 0.95,
          strokeColor: '#114e65',
          strokeWeight: 1,
          scale: 1,
          labelOrigin: new google.maps.Point(0, 0),
        },
      });

      marker.addListener('click', () => {
        const priceText =
          hotel.priceType === 'minimum' && hotel.price > 0
            ? `¥${hotel.price.toLocaleString()}〜`
            : hotel.priceType === 'vacancy' && hotel.price > 0
              ? `¥${hotel.price.toLocaleString()}/泊`
              : '';
        const ratingText =
          hotel.googleRating > 0
            ? `★${hotel.googleRating.toFixed(1)} (${hotel.googleReviewCount.toLocaleString()})`
            : '';

        infoWindowRef.current?.setContent(`
          <div style="font-family:sans-serif;max-width:240px;padding:4px">
            <p style="margin:0 0 4px;font-size:11px;color:#6b7280">${escapeHtml(hotel.area)}</p>
            <p style="margin:0 0 6px;font-size:14px;font-weight:500">${escapeHtml(hotel.name)}</p>
            ${priceText ? `<p style="margin:0 0 2px;font-size:16px;font-weight:500">${escapeHtml(priceText)}</p>` : ''}
            ${ratingText ? `<p style="margin:0 0 6px;font-size:11px;color:#6b7280">${escapeHtml(ratingText)}</p>` : ''}
            <a href="${escapeHtml(hotel.hotelInformationUrl)}" target="_blank" rel="noopener noreferrer nofollow sponsored"
               style="display:inline-block;background:#1f2937;color:#fff;padding:4px 12px;border-radius:6px;font-size:12px;text-decoration:none">
              詳細を見る
            </a>
          </div>
        `);
        infoWindowRef.current?.open(map, marker);
      });

      markersRef.current.push(marker);
    }

    if (hotelsWithCoords.length > 1) {
      map.fitBounds(bounds, 50);
    } else {
      map.setCenter(bounds.getCenter());
      map.setZoom(14);
    }
  }, [hotels]);

  useEffect(() => {
    // Reset map when hotels change
    for (const marker of markersRef.current) {
      marker.setMap(null);
    }
    markersRef.current = [];
    mapInstanceRef.current = null;

    loadGoogleMaps()
      .then(() => initMap())
      .catch((e) =>
        setError(
          e instanceof Error ? e.message : 'マップの読み込みに失敗しました',
        ),
      );
  }, [initMap]);

  if (error) {
    return (
      <div className="flex h-[500px] items-center justify-center rounded-lg bg-border/20 text-sm text-muted">
        {error}
      </div>
    );
  }

  if (!hotels.some((hotel) => hotel.latitude > 0 && hotel.longitude > 0)) {
    return (
      <div className="flex h-[500px] items-center justify-center rounded-lg bg-border/20 text-sm text-muted">
        地図表示に必要な位置情報がまだ揃っていません。
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={mapRef} className="h-[500px] w-full rounded-lg" />
    </div>
  );
}
