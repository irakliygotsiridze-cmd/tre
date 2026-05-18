import { memo, useMemo } from 'react';
import { Polygon } from 'react-native-maps';
import { useCountriesStore } from '@/store/useCountriesStore';
import {
  POLYGON_DEFAULT, POLYGON_STROKE, POLYGON_STROKE_W, POLYGON_VISITED, POLYGON_WISHLIST,
} from './colors';
import type { IsoCode } from '@/utils/types';

interface Ring {
  iso: IsoCode;
  coords: { latitude: number; longitude: number }[];
}

function flattenFeature(f: any): Ring[] {
  const iso: IsoCode =
    f.properties?.ISO_A2_EH ??
    f.properties?.ISO_A2 ??
    '';
  if (!iso || iso === '-99') return [];

  const out: Ring[] = [];
  const push = (rings: number[][][]) => {
    for (const ring of rings) {
      out.push({
        iso,
        coords: ring.map(([lng, lat]) => ({ latitude: lat, longitude: lng })),
      });
    }
  };

  if (f.geometry?.type === 'Polygon') {
    push(f.geometry.coordinates);
  } else if (f.geometry?.type === 'MultiPolygon') {
    for (const poly of f.geometry.coordinates) push(poly);
  }
  return out;
}

interface PolyProps {
  ring: Ring;
  visited: boolean;
  wishlist: boolean;
  onPress: (iso: IsoCode) => void;
}

const CountryPolygon = memo(function CountryPolygon({ ring, visited, wishlist, onPress }: PolyProps) {
  const fill = visited ? POLYGON_VISITED : wishlist ? POLYGON_WISHLIST : POLYGON_DEFAULT;
  return (
    <Polygon
      coordinates={ring.coords}
      fillColor={fill}
      strokeColor={POLYGON_STROKE}
      strokeWidth={POLYGON_STROKE_W}
      tappable
      onPress={() => onPress(ring.iso)}
    />
  );
});

interface Props {
  onCountryPress: (iso: IsoCode) => void;
}

export default function CountryLayer({ onCountryPress }: Props) {
  const geojson = useCountriesStore(s => s.geojson);
  const visited = useCountriesStore(s => s.visited);
  const wishlist = useCountriesStore(s => s.wishlist);

  const rings = useMemo<Ring[]>(() => {
    const all: Ring[] = [];
    for (const f of (geojson?.features ?? [])) all.push(...flattenFeature(f));
    return all;
  }, [geojson]);

  return (
    <>
      {rings.map((r, i) => (
        <CountryPolygon
          key={`${r.iso}-${i}`}
          ring={r}
          visited={visited.has(r.iso)}
          wishlist={wishlist.has(r.iso)}
          onPress={onCountryPress}
        />
      ))}
    </>
  );
}
