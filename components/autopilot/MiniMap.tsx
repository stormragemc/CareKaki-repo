"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapMarker {
  lat: number;
  lng: number;
  label: string;
  rank?: number;
  address?: string;
  distance_km?: number | null;
  postal_code?: string;
  phone?: string;
  extra?: string;
}

interface MiniMapProps {
  center: { lat: number; lng: number };
  markers: MapMarker[];
  height?: string;
}

const USER_ICON = L.divIcon({
  html: '<div style="width:12px;height:12px;background:#3b82f6;border:2px solid white;border-radius:50%;box-shadow:0 0 6px rgba(59,130,246,0.6)"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  className: "",
});

function makeRankIcon(rank: number, color: string) {
  return L.divIcon({
    html: `<div style="width:22px;height:22px;background:${color};border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;box-shadow:0 1px 4px rgba(0,0,0,0.4)">${rank}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    className: "",
  });
}

export default function MiniMap({ center, markers, height = "180px" }: MiniMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [selected, setSelected] = useState<MapMarker | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: true,
    }).setView([center.lat, center.lng], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

    L.marker([center.lat, center.lng], { icon: USER_ICON })
      .addTo(map)
      .bindPopup("Patient location");

    const bounds = L.latLngBounds([[center.lat, center.lng]]);

    markers.forEach((m) => {
      const icon = makeRankIcon(m.rank ?? 1, "#14b8a6");
      const marker = L.marker([m.lat, m.lng], { icon }).addTo(map);
      marker.on("click", () => {
        setSelected(m);
        map.panTo([m.lat, m.lng]);
      });
      bounds.extend([m.lat, m.lng]);
    });

    if (markers.length > 0) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [center.lat, center.lng, markers]);

  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => mapRef.current?.invalidateSize(), 100);
    }
  }, [fullscreen]);

  return (
    <>
      <div
        className={
          fullscreen
            ? "fixed inset-0 z-[9999] bg-black flex flex-col"
            : "relative"
        }
      >
        {/* Top bar (fullscreen only) */}
        {fullscreen && (
          <div className="flex items-center justify-between px-4 py-3 bg-black/90 border-b border-white/10 shrink-0 z-[10001]">
            <span className="text-sm font-semibold text-white">Map View</span>
            <button
              onClick={() => { setFullscreen(false); setSelected(null); }}
              className="text-white/60 hover:text-white text-sm px-2 py-1 rounded transition-colors"
            >
              ✕ Close
            </button>
          </div>
        )}

        {/* Map container — always the same DOM node */}
        <div
          ref={containerRef}
          style={fullscreen ? { flex: 1 } : { height, width: "100%" }}
          className={fullscreen ? "" : "rounded-lg overflow-hidden border border-white/10"}
        />

        {/* Expand button (inline only) */}
        {!fullscreen && (
          <button
            onClick={() => setFullscreen(true)}
            className="absolute top-2 right-2 z-[1000] bg-black/70 hover:bg-black text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm transition-colors"
          >
            ⤢
          </button>
        )}

        {/* Bottom sheet (fullscreen only) */}
        {fullscreen && selected && (
          <div className="absolute bottom-0 left-0 right-0 z-[10000] transition-transform duration-300 ease-out">
            <div className="bg-[#1a1a1a] border-t border-white/10 rounded-t-2xl px-5 pt-4 pb-6 max-h-[40vh] overflow-y-auto">
              <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="shrink-0 w-7 h-7 rounded-full bg-brand-teal/20 text-brand-teal text-xs font-bold flex items-center justify-center">
                    {selected.rank ?? "•"}
                  </span>
                  <span className="text-base font-semibold text-white">{selected.label}</span>
                </div>
                <button onClick={() => setSelected(null)} className="text-white/40 hover:text-white text-lg leading-none">✕</button>
              </div>
              <div className="flex flex-col gap-2 pl-9">
                {selected.address && (
                  <div className="flex items-start gap-2">
                    <span className="text-white/30 text-xs mt-0.5">📍</span>
                    <span className="text-sm text-white/70">{selected.address}</span>
                  </div>
                )}
                {selected.distance_km != null && (
                  <div className="flex items-center gap-2">
                    <span className="text-white/30 text-xs">📏</span>
                    <span className="text-sm text-white/70">{selected.distance_km} km away</span>
                  </div>
                )}
                {selected.postal_code && (
                  <div className="flex items-center gap-2">
                    <span className="text-white/30 text-xs">✉️</span>
                    <span className="text-sm text-white/70">Postal {selected.postal_code}</span>
                  </div>
                )}
                {selected.phone && (
                  <div className="flex items-center gap-2">
                    <span className="text-white/30 text-xs">📞</span>
                    <span className="text-sm text-white/70">{selected.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
