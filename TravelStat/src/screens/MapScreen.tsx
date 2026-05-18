import WorldMap from '@/map/WorldMap';

export default function MapScreen() {
  return <WorldMap onCountryPress={(iso) => console.log('tapped country', iso)} />;
}
