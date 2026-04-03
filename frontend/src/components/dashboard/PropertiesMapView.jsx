import { useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import styles from './PropertiesPage.module.css'

const CASA_CENTER = [33.5731, -7.5898]

function MapBounds({ properties, selectedId }) {
  const map = useMap()

  useEffect(() => {
    if (properties.length === 0) return
    if (!selectedId) {
      const bounds = L.latLngBounds(properties.map((p) => [p.lat, p.lng]))
      map.fitBounds(bounds, { padding: [48, 48] })
    } else {
      const p = properties.find((x) => x.id === selectedId)
      if (p) map.setView([p.lat, p.lng], 15)
    }
  }, [map, properties, selectedId])

  return null
}

export default function PropertiesMapView({ properties, selectedId, onSelectProperty }) {
  return (
    <div className={styles.mapJsWrap}>
      <MapContainer
        center={CASA_CENTER}
        zoom={12}
        className={styles.leafletMap}
        scrollWheelZoom
        style={{ height: '100%', width: '100%', minHeight: '320px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBounds properties={properties} selectedId={selectedId} />
        {properties.map((p) => {
          const selected = selectedId === p.id
          return (
            <CircleMarker
              key={p.id}
              center={[p.lat, p.lng]}
              radius={selected ? 11 : 8}
              pathOptions={{
                fillColor: p.taken ? '#dc2626' : '#16a34a',
                fillOpacity: 0.95,
                color: '#ffffff',
                weight: selected ? 3 : 2,
              }}
              eventHandlers={{
                click: () => onSelectProperty?.(p.id),
              }}
            >
              <Tooltip direction="top" offset={[0, -6]} opacity={0.92} permanent={false}>
                {p.shortName || p.title}
              </Tooltip>
            </CircleMarker>
          )
        })}
      </MapContainer>
    </div>
  )
}
