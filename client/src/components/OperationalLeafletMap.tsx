import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

export interface OperationalMapSite {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: "healthy" | "warning" | "critical";
  availability: number;
  traffic: number;
  congestion: number;
  cells4g: number;
  cells5g: number;
  customers: number;
  complaints: number;
  churn: number;
  fiber: number;
  salesOpportunities: number;
  revenueRisk: number;
  throughput: number;
}

type OperationalMapProps = {
  sites: OperationalMapSite[];
  selectedSiteId: string | null;
  layers: Record<string, boolean>;
  onSelect: (site: OperationalMapSite) => void;
  onReady?: () => void;
};

const statusColors = {
  healthy: "var(--status-healthy)",
  warning: "var(--status-warning)",
  critical: "var(--status-critical)",
} as const;

export default function OperationalLeafletMap({ sites, selectedSiteId, layers, onSelect, onReady }: OperationalMapProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clustersRef = useRef<L.MarkerClusterGroup | null>(null);
  const overlaysRef = useRef<L.LayerGroup | null>(null);
  const fitOnceRef = useRef(false);

  useEffect(() => {
    if (!hostRef.current) return;
    const map = L.map(hostRef.current, { zoomControl: true, scrollWheelZoom: true }).setView([31.24, 36.5], 7);
    const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution }).addTo(map);
    clustersRef.current = L.markerClusterGroup({
      chunkedLoading: true,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 42,
      iconCreateFunction: cluster => L.divIcon({
        className: "operational-cluster-icon",
        html: `<span>${cluster.getChildCount()}</span>`,
        iconSize: [38, 38],
      }),
    }).addTo(map);
    overlaysRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    requestAnimationFrame(() => { map.invalidateSize(); onReady?.(); });
    return () => {
      map.remove();
      mapRef.current = null;
      clustersRef.current = null;
      overlaysRef.current = null;
      fitOnceRef.current = false;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !sites.length || fitOnceRef.current) return;
    map.fitBounds(L.latLngBounds(sites.map(site => [site.lat, site.lng] as L.LatLngTuple)), { padding: [30, 30], maxZoom: 8 });
    fitOnceRef.current = true;
  }, [sites]);

  useEffect(() => {
    const clusters = clustersRef.current;
    const overlays = overlaysRef.current;
    if (!clusters || !overlays) return;
    clusters.clearLayers();
    overlays.clearLayers();

    for (const site of sites) {
      if (layers.sites) {
        const selected = site.id === selectedSiteId;
        const color = statusColors[site.status];
        const marker = L.marker([site.lat, site.lng], {
          title: `${site.id} · ${site.name}`,
          icon: L.divIcon({
            className: "operational-site-icon",
            html: `<span style="--site-color:${color};--site-size:${selected ? 18 : 13}px"></span>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          }),
        }).bindTooltip(`<b>${site.id}</b><br>${site.name}<br>${site.status} · ${site.congestion}% congestion`, { direction: "top", opacity: 0.96 });
        marker.on("click", () => onSelect(site));
        clusters.addLayer(marker);
      }

      const layerRadii: Array<[string, number, string, number]> = [
        ["fourG", 900, "var(--status-info)", 0.12],
        ["fiveG", 450, "var(--status-info)", 0.15],
        ["fiber", 300, "var(--status-warning)", 0.15],
        ["complaints", Math.max(260, site.complaints * 4), "var(--status-critical)", 0.19],
        ["churn", Math.max(220, site.churn * 120), "var(--status-warning)", 0.17],
        ["customers", Math.max(300, Math.sqrt(site.customers) * 14), "var(--accent)", 0.12],
        ["revenueRisk", Math.max(280, site.revenueRisk / 650), "var(--status-critical)", 0.19],
        ["sales", Math.max(220, site.salesOpportunities * 42), "var(--accent)", 0.14],
      ];
      for (const [key, radius, color, opacity] of layerRadii) {
        if (!layers[key]) continue;
        L.circle([site.lat, site.lng], { radius, color, weight: 1, opacity: 0.52, fillColor: color, fillOpacity: opacity, interactive: false }).addTo(overlays);
      }
    }
  }, [layers, onSelect, selectedSiteId, sites]);

  useEffect(() => {
    const map = mapRef.current;
    const selected = sites.find(site => site.id === selectedSiteId);
    if (map && selected) map.flyTo([selected.lat, selected.lng], Math.max(map.getZoom(), 9), { duration: 0.35 });
  }, [selectedSiteId, sites]);

  return <div ref={hostRef} className="operational-leaflet-map" aria-label="Interactive telecom network map of Jordan" role="application" />;
}
