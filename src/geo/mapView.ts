import maplibregl from 'maplibre-gl';

export function initMap(container: string | HTMLElement, center: [number, number], zoom = 15): maplibregl.Map {
  return new maplibregl.Map({
    container,
    style: 'https://demotiles.maplibre.org/style.json',
    center,
    zoom,
  });
}

export function addPropertyBoundary(map: maplibregl.Map, coordinates: [number, number][], id = 'property') {
  if (map.getSource(id)) {
    (map.getSource(id) as maplibregl.GeoJSONSource).setData({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [coordinates] },
      properties: {},
    });
    return;
  }

  map.addSource(id, {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [coordinates] },
      properties: {},
    },
  });

  map.addLayer({
    id: `${id}-fill`,
    type: 'fill',
    source: id,
    paint: { 'fill-color': '#00BFFF', 'fill-opacity': 0.2 },
  });

  map.addLayer({
    id: `${id}-line`,
    type: 'line',
    source: id,
    paint: { 'line-color': '#00BFFF', 'line-width': 2 },
  });
}
