import { useEffect, useRef, useState } from "react";
import { restaurant } from "../../data/restaurant";

type MapStatus = "waiting" | "ready" | "failed";

const LOAD_TIMEOUT_MS = 15000;

const PIN = `<svg viewBox="0 0 40 52" aria-hidden="true" focusable="false"><path d="M20 1C9.500 1 1 9.300 1 19.600 1 33.500 20 51 20 51s19-17.500 19-31.400C39 9.300 30.500 1 20 1z" fill="#c4060c" stroke="#f0a83a" stroke-width="2.500"/><path d="M20 9c1.200 6 4.800 9.600 10.800 10.800-6 1.200-9.600 4.800-10.800 10.800-1.200-6-4.800-9.600-10.800-10.800C15.200 18.600 18.800 15 20 9z" fill="#f8d596"/></svg>`;

/** Open source map (MapLibre GL with OpenFreeMap tiles). Its code loads only when the map nears the screen. */
export function RestaurantMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<MapStatus>("waiting");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let removeMap: (() => void) | undefined;
    let loadTimer: ReturnType<typeof setTimeout> | undefined;

    const start = async () => {
      try {
        const [{ Map, Marker, NavigationControl, Popup, setWorkerUrl }, { mapStyle }, { default: workerUrl }] =
          await Promise.all([
            import("maplibre-gl"),
            import("../../data/mapStyle"),
            // MapLibre 6 ships its worker as a separate file, so the bundler has to be told about it.
            import("maplibre-gl/dist/maplibre-gl-worker.mjs?url"),
            import("maplibre-gl/dist/maplibre-gl.css"),
          ]);
        if (cancelled) return;

        setWorkerUrl(workerUrl);
        const map = new Map({
          container,
          style: mapStyle,
          center: restaurant.mapCenter,
          zoom: 15.4,
          minZoom: 9,
          maxZoom: 18,
          cooperativeGestures: true,
          dragRotate: false,
          pitchWithRotate: false,
        });
        removeMap = () => map.remove();
        map.touchZoomRotate.disableRotation();
        map.addControl(new NavigationControl({ showCompass: false }), "top-right");

        const pin = document.createElement("div");
        pin.className = "map-pin";
        pin.innerHTML = PIN;

        const label = document.createElement("div");
        const name = document.createElement("strong");
        name.textContent = restaurant.name;
        label.append(name, restaurant.addressLines[0]);

        const marker = new Marker({ element: pin, anchor: "bottom" })
          .setLngLat(restaurant.mapCenter)
          .setPopup(new Popup({ offset: 46, closeButton: false, closeOnClick: false }).setDOMContent(label))
          .addTo(map);

        // If the tiles or worker never arrive, offer directions rather than an endless loading message.
        loadTimer = setTimeout(() => {
          if (!cancelled && !map.loaded()) setStatus("failed");
        }, LOAD_TIMEOUT_MS);

        map.once("load", () => {
          clearTimeout(loadTimer);
          if (cancelled) return;
          setStatus("ready");
          marker.togglePopup();
        });
      } catch {
        // Older devices without WebGL land here and get the address link instead.
        if (!cancelled) setStatus("failed");
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          void start();
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(container);

    return () => {
      cancelled = true;
      observer.disconnect();
      clearTimeout(loadTimer);
      removeMap?.();
    };
  }, []);

  return (
    <div className="location__map">
      <div
        ref={containerRef}
        className="location__canvas"
        role="region"
        aria-label={`Map showing ${restaurant.name} at ${restaurant.addressInline}`}
      />
      {status === "waiting" ? <p className="location__status">Loading map</p> : null}
      {status === "failed" ? (
        <p className="location__status">
          The map could not load.{" "}
          <a className="link-red" href={restaurant.directionsUrl} target="_blank" rel="noopener noreferrer">
            Open directions
          </a>
        </p>
      ) : null}
    </div>
  );
}
