<template>
  <div class="map-wrap">
    <div :id="mapId" class="map" />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  mapId: { type: String, default: 'quote-map' },
  customer: { type: Object, default: null }, // {lng,lat}
  suppliers: { type: Array, default: () => [] }, // [{id,lng,lat,name}]
  activeSupplierId: { type: [String, Number], default: null }
})

const emit = defineEmits(['selectSupplier'])

const mapRef = ref(null)
const customerMarkerRef = ref(null)
const supplierMarkersRef = ref(new Map())
const radiusCircleRef = ref(null)

function isValidNumber(n) {
  return typeof n === 'number' && isFinite(n)
}

function safeDestroyMap() {
  try {
    if (mapRef.value) mapRef.value.destroy()
  } catch (e) {}
  mapRef.value = null
  customerMarkerRef.value = null
  supplierMarkersRef.value = new Map()
  radiusCircleRef.value = null
}

function ensureMap() {
  if (!window.AMap) return
  if (mapRef.value) return

  mapRef.value = new AMap.Map(props.mapId, {
    zoom: 6,
    center: [114, 32],
    viewMode: '3D'
  })
}

function upsertCustomerMarker() {
  if (!mapRef.value || !props.customer) return
  const { lng, lat } = props.customer
  if (!isValidNumber(lng) || !isValidNumber(lat)) return

  if (!customerMarkerRef.value) {
    customerMarkerRef.value = new AMap.Marker({
      position: [lng, lat],
      icon: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png'
    })
    mapRef.value.add(customerMarkerRef.value)
  } else {
    customerMarkerRef.value.setPosition([lng, lat])
  }

  mapRef.value.setCenter([lng, lat])
}

function setRadiusCircle(radiusKm) {
  if (!mapRef.value || !props.customer) return
  const { lng, lat } = props.customer
  if (!isValidNumber(lng) || !isValidNumber(lat)) return
  const r = Number(radiusKm)
  if (!isFinite(r) || r <= 0) return

  if (radiusCircleRef.value) {
    try {
      mapRef.value.remove(radiusCircleRef.value)
    } catch (e) {}
    radiusCircleRef.value = null
  }

  try {
    radiusCircleRef.value = new AMap.Circle({
      center: [lng, lat],
      radius: r * 1000,
      strokeColor: '#16a34a',
      strokeWeight: 2,
      strokeOpacity: 0.9,
      fillColor: '#16a34a',
      fillOpacity: 0.10
    })
    mapRef.value.add(radiusCircleRef.value)
  } catch (e) {
    // ignore
  }
}

function rebuildSupplierMarkers() {
  if (!mapRef.value) return

  // clear old
  for (const m of supplierMarkersRef.value.values()) {
    try {
      mapRef.value.remove(m)
    } catch (e) {}
  }
  supplierMarkersRef.value = new Map()

  for (const s of props.suppliers || []) {
    if (!s) continue
    if (!isValidNumber(Number(s.lng)) || !isValidNumber(Number(s.lat))) continue
    const marker = new AMap.Marker({
      position: [Number(s.lng), Number(s.lat)],
      icon: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png'
    })
    marker.on('click', () => emit('selectSupplier', s.id))
    supplierMarkersRef.value.set(s.id, marker)
    mapRef.value.add(marker)
  }
}

function highlightActiveSupplier() {
  if (!mapRef.value) return
  const id = props.activeSupplierId
  if (id === null || id === undefined) return
  const marker = supplierMarkersRef.value.get(id)
  if (!marker) return
  try {
    const pos = marker.getPosition()
    if (pos) mapRef.value.panTo(pos)
  } catch (e) {}
}

onMounted(() => {
  ensureMap()
  upsertCustomerMarker()
  rebuildSupplierMarkers()
  highlightActiveSupplier()
})

watch(
  () => props.customer,
  () => {
    ensureMap()
    upsertCustomerMarker()
  },
  { deep: true }
)

watch(
  () => props.suppliers,
  () => {
    ensureMap()
    rebuildSupplierMarkers()
  },
  { deep: true }
)

watch(
  () => props.activeSupplierId,
  () => {
    highlightActiveSupplier()
  }
)

// allow parent to call via ref? (not needed yet)
defineExpose({
  panToSupplier(id) {
    const marker = supplierMarkersRef.value.get(id)
    if (!marker || !mapRef.value) return
    try {
      mapRef.value.panTo(marker.getPosition())
    } catch (e) {}
  },
  setRadiusCircle
})

onBeforeUnmount(() => safeDestroyMap())
</script>

<style scoped>
.map-wrap {
  height: 100%;
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.6);
  box-shadow: var(--shadow);
}
.map {
  width: 100%;
  height: 100%;
}
</style>

