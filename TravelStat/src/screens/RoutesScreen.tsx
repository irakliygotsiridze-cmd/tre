import { useMemo } from 'react';
import { Platform, StyleSheet, View, ScrollView } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Text, Card, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useVisitsStore } from '@/store/useVisitsStore';
import { useVisitCitiesStore } from '@/store/useVisitCitiesStore';
import { useCitiesStore } from '@/store/useCitiesStore';
import { useCountriesStore } from '@/store/useCountriesStore';
import { fmtDate } from '@/utils/dates';
import { TRANSPORT_ICON, type TransportMode } from '@/utils/types';

interface Segment {
  visitId: number;
  visitDate: string;
  countryCode: string;
  fromCityId: number;
  toCityId: number;
  fromName: string;
  toName: string;
  fromCoord: { latitude: number; longitude: number };
  toCoord: { latitude: number; longitude: number };
  transport: TransportMode | null;
}

export default function RoutesScreen() {
  const visits = useVisitsStore(s => s.visits);
  const byVisit = useVisitCitiesStore(s => s.byVisit);
  const cityById = useCitiesStore(s => s.byId);
  const byCode = useCountriesStore(s => s.byCode);

  const segments: Segment[] = useMemo(() => {
    const out: Segment[] = [];
    for (const v of visits) {
      const chain = byVisit.get(v.id) ?? [];
      for (let i = 1; i < chain.length; i++) {
        const a = cityById.get(chain[i - 1].city_id);
        const b = cityById.get(chain[i].city_id);
        if (!a || !b) continue;
        out.push({
          visitId: v.id,
          visitDate: v.start_date,
          countryCode: v.country_code,
          fromCityId: a.id,
          toCityId: b.id,
          fromName: a.name,
          toName: b.name,
          fromCoord: { latitude: a.lat, longitude: a.lng },
          toCoord: { latitude: b.lat, longitude: b.lng },
          transport: (chain[i].transport ?? null) as TransportMode | null,
        });
      }
    }
    return out;
  }, [visits, byVisit, cityById]);

  // Initial region: roughly the centroid of all segment endpoints, or world view if empty.
  const initialRegion = useMemo(() => {
    if (segments.length === 0) {
      return { latitude: 20, longitude: 0, latitudeDelta: 100, longitudeDelta: 100 };
    }
    const lats: number[] = [];
    const lngs: number[] = [];
    for (const s of segments) {
      lats.push(s.fromCoord.latitude, s.toCoord.latitude);
      lngs.push(s.fromCoord.longitude, s.toCoord.longitude);
    }
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(5, (maxLat - minLat) * 1.5),
      longitudeDelta: Math.max(5, (maxLng - minLng) * 1.5),
    };
  }, [segments]);

  const cityMarkers = useMemo(() => {
    const m = new Map<number, { id: number; lat: number; lng: number; name: string }>();
    for (const s of segments) {
      m.set(s.fromCityId, { id: s.fromCityId, lat: s.fromCoord.latitude, lng: s.fromCoord.longitude, name: s.fromName });
      m.set(s.toCityId, { id: s.toCityId, lat: s.toCoord.latitude, lng: s.toCoord.longitude, name: s.toName });
    }
    return Array.from(m.values());
  }, [segments]);

  return (
    <View style={{ flex: 1 }}>
      <MapView
        key={`${initialRegion.latitude}-${initialRegion.longitude}-${initialRegion.latitudeDelta}`}
        style={{ flex: 1 }}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        pitchEnabled={false}
        rotateEnabled={false}
        showsBuildings={false}
      >
        {segments.map((s, i) => (
          <Polyline
            key={`${s.visitId}-${i}`}
            coordinates={[s.fromCoord, s.toCoord]}
            strokeColor="#0a84ff"
            strokeWidth={2}
            geodesic
          />
        ))}
        {cityMarkers.map(m => (
          <Marker
            key={m.id}
            coordinate={{ latitude: m.lat, longitude: m.lng }}
            title={m.name}
            pinColor="red"
          />
        ))}
      </MapView>

      <Card style={s.legendCard} elevation={4}>
        <Card.Content style={{ paddingVertical: 8 }}>
          <Text variant="labelMedium">{segments.length} segment{segments.length === 1 ? '' : 's'}</Text>
        </Card.Content>
      </Card>

      <Card style={s.bottomCard} elevation={4}>
        <ScrollView style={{ maxHeight: 220 }}>
          {segments.length === 0 ? (
            <Card.Content>
              <Text style={{ opacity: 0.7 }}>
                Add a visit in Timeline with two or more cities to see routes here.
              </Text>
            </Card.Content>
          ) : (
            segments.map((seg, i) => {
              const country = byCode[seg.countryCode];
              const iconName = (TRANSPORT_ICON[(seg.transport ?? 'other') as TransportMode] ?? 'arrow-right') as any;
              return (
                <View key={i}>
                  {i > 0 && <Divider />}
                  <View style={s.segRow}>
                    <MaterialCommunityIcons name={iconName} size={20} color="#0a84ff" style={{ marginRight: 8 }} />
                    <View style={{ flex: 1 }}>
                      <Text>{seg.fromName} → {seg.toName}</Text>
                      <Text style={{ fontSize: 12, opacity: 0.6 }}>
                        {country?.flag} {country?.name ?? seg.countryCode} · {fmtDate(seg.visitDate)} · {seg.transport ?? 'unspecified'}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </Card>
    </View>
  );
}

const s = StyleSheet.create({
  legendCard: { position: 'absolute', top: 8, left: 8 },
  bottomCard: { position: 'absolute', bottom: 0, left: 0, right: 0, borderRadius: 0 },
  segRow: { flexDirection: 'row', alignItems: 'center', padding: 12 },
});
