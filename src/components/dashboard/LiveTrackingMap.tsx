import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Circle, Truck, MapPin, Package as PackageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/supabase";

export type TrackingStatus = "ordered" | "processing" | "out_for_delivery" | "arrived";

const STEPS: { key: TrackingStatus; label: string; icon: any }[] = [
  { key: "ordered", label: "Ordered", icon: PackageIcon },
  { key: "processing", label: "Processing", icon: Circle },
  { key: "out_for_delivery", label: "Out for Delivery", icon: Truck },
  { key: "arrived", label: "Arrived", icon: MapPin },
];

const STATUS_TO_STEP: Record<string, TrackingStatus> = {
  pending: "ordered",
  confirmed: "processing",
  printing: "processing",
  out_for_delivery: "out_for_delivery",
  delivered: "arrived",
};

// Load Google Maps JS API once.
let mapsPromise: Promise<void> | null = null;
function loadGoogleMaps(): Promise<void> {
  if (mapsPromise) return mapsPromise;
  const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as string | undefined;
  const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID as string | undefined;
  if (!key) return Promise.reject(new Error("Google Maps browser key missing"));

  mapsPromise = new Promise((resolve, reject) => {
    if ((window as any).google?.maps) return resolve();
    (window as any).__initMap = () => resolve();
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=__initMap${channel ? `&channel=${channel}` : ""}`;
    s.async = true;
    s.defer = true;
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });
  return mapsPromise;
}

export type LiveTrackingMapProps = {
  orderId?: string;
  initialStatus?: string;
  destination?: { lat: number; lng: number; label?: string };
  courier?: { lat: number; lng: number };
};

export function LiveTrackingMap({
  orderId,
  initialStatus = "confirmed",
  destination = { lat: 19.3854, lng: 72.8322, label: "Vartak Polytechnic Campus" },
  courier,
}: LiveTrackingMapProps) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const destMarker = useRef<any>(null);
  const courierMarker = useRef<any>(null);
  const [status, setStatus] = useState<string>(initialStatus);
  const [courierPos, setCourierPos] = useState(courier);
  const [error, setError] = useState<string | null>(null);

  // Load & init map
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (cancelled || !mapEl.current) return;
        const google = (window as any).google;
        mapRef.current = new google.maps.Map(mapEl.current, {
          center: destination,
          zoom: 14,
          disableDefaultUI: true,
          zoomControl: true,
          styles: [
            { featureType: "poi", stylers: [{ visibility: "off" }] },
            { featureType: "transit", stylers: [{ visibility: "off" }] },
          ],
        });
        destMarker.current = new google.maps.Marker({
          position: destination,
          map: mapRef.current,
          title: destination.label || "Delivery",
        });
      })
      .catch((e) => setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [destination.lat, destination.lng]);

  // Courier marker updates
  useEffect(() => {
    if (!mapRef.current || !courierPos) return;
    const google = (window as any).google;
    if (!courierMarker.current) {
      courierMarker.current = new google.maps.Marker({
        position: courierPos,
        map: mapRef.current,
        title: "Courier",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#2563eb",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 3,
        },
      });
    } else {
      courierMarker.current.setPosition(courierPos);
    }
  }, [courierPos]);

  // Realtime subscription to order status
  useEffect(() => {
    if (!orderId) return;
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        (payload: any) => {
          const row = payload.new;
          if (row?.status) setStatus(row.status);
          if (row?.courier_lat && row?.courier_lng) {
            setCourierPos({ lat: Number(row.courier_lat), lng: Number(row.courier_lng) });
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const activeStep = STATUS_TO_STEP[status] || "ordered";
  const activeIdx = STEPS.findIndex((s) => s.key === activeStep);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft">
      <div className="relative h-72 sm:h-80 bg-muted">
        <div ref={mapEl} className="absolute inset-0" />
        {error && (
          <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground p-4 text-center">
            {error}
          </div>
        )}
        {/* Overlay chip */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-3">
          <div className="rounded-2xl bg-background/90 backdrop-blur px-3 py-2 shadow-soft flex items-center gap-2 min-w-0">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground shrink-0">
              <Truck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground leading-tight">Live tracking</p>
              <p className="truncate text-sm font-semibold">{destination.label}</p>
            </div>
          </div>
          {orderId && (
            <span className="rounded-full bg-background/90 backdrop-blur px-3 py-1.5 text-xs font-medium shadow-soft">
              #{orderId}
            </span>
          )}
        </div>
      </div>

      {/* Progress stepper */}
      <div className="p-4 sm:p-5 border-t border-border/60 bg-card">
        <div className="relative flex items-center justify-between gap-1">
          <div className="absolute top-4 left-4 right-4 h-0.5 bg-border" />
          <div
            className="absolute top-4 left-4 h-0.5 bg-primary transition-all duration-500"
            style={{ width: `calc(${(activeIdx / (STEPS.length - 1)) * 100}% - ${activeIdx === 0 ? 0 : activeIdx === STEPS.length - 1 ? 32 : 16}px)` }}
          />
          {STEPS.map((step, i) => {
            const done = i <= activeIdx;
            const current = i === activeIdx;
            const Icon = step.icon;
            return (
              <div key={step.key} className="relative z-10 flex flex-col items-center gap-1.5 flex-1 min-w-0">
                <div
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-full border-2 transition-all",
                    done
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-background border-border text-muted-foreground",
                    current && "ring-4 ring-primary/20 scale-110",
                  )}
                >
                  {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
                </div>
                <span
                  className={cn(
                    "text-[10px] sm:text-xs font-medium text-center leading-tight",
                    done ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
