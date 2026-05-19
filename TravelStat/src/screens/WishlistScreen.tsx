import { useMemo, useState } from 'react';
import { FlatList, View, ScrollView } from 'react-native';
import { Searchbar, IconButton, Divider, Text, SegmentedButtons, List } from 'react-native-paper';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import CountryListItem from '@/components/CountryListItem';
import { useCountriesStore } from '@/store/useCountriesStore';
import { useCitiesStore } from '@/store/useCitiesStore';
import { search } from '@/services/search';

type Tab = 'countries' | 'cities';

export default function WishlistScreen() {
  const [tab, setTab] = useState<Tab>('countries');
  const [query, setQuery] = useState('');
  const countriesByCode = useCountriesStore(s => s.byCode);
  const countriesWishlist = useCountriesStore(s => s.wishlist);
  const toggleCountryWishlist = useCountriesStore(s => s.toggleWishlist);
  const citiesById = useCitiesStore(s => s.byId);
  const citiesWishlist = useCitiesStore(s => s.wishlist);
  const toggleCityWishlist = useCitiesStore(s => s.toggleWishlist);
  const nav = useNavigation();

  const results = useMemo(() => {
    if (!query) return [];
    return search(query, 10).filter(r => (tab === 'countries' ? r.kind === 'country' : r.kind === 'city'));
  }, [query, tab]);

  const countriesArr = useMemo(
    () => Array.from(countriesWishlist).map(iso => countriesByCode[iso]).filter(Boolean),
    [countriesWishlist, countriesByCode],
  );

  const citiesArr = useMemo(
    () => Array.from(citiesWishlist).map(id => citiesById.get(id)).filter((c): c is NonNullable<typeof c> => !!c),
    [citiesWishlist, citiesById],
  );

  return (
    <View style={{ flex: 1 }}>
      <SegmentedButtons
        value={tab}
        onValueChange={v => { setTab(v as Tab); setQuery(''); }}
        buttons={[
          { value: 'countries', label: `Countries (${countriesArr.length})` },
          { value: 'cities', label: `Cities (${citiesArr.length})` },
        ]}
        style={{ margin: 8 }}
      />

      <Searchbar
        placeholder={tab === 'countries' ? 'Add country to wishlist…' : 'Add city to wishlist…'}
        value={query}
        onChangeText={setQuery}
        style={{ marginHorizontal: 8, marginBottom: 8 }}
      />

      {results.length > 0 && (
        <ScrollView style={{ maxHeight: 220 }}>
          {results.map(r => {
            if (r.kind === 'country') {
              const c = r.item;
              const inList = countriesWishlist.has(c.iso_code);
              return (
                <CountryListItem
                  key={'c-' + c.iso_code}
                  country={c}
                  onPress={async () => { await toggleCountryWishlist(c.iso_code); setQuery(''); }}
                  right={<Text>{inList ? '✓' : '+'}</Text>}
                />
              );
            }
            // city result
            const ct = r.item;
            const country = countriesByCode[ct.country];
            const inList = citiesWishlist.has(ct.id);
            return (
              <List.Item
                key={'ct-' + ct.id}
                title={`${country?.flag ?? '🌍'} ${ct.name}`}
                description={country?.name ?? ct.country}
                right={() => <Text>{inList ? '✓' : '+'}</Text>}
                onPress={async () => { await toggleCityWishlist(ct.id); setQuery(''); }}
              />
            );
          })}
          <Divider />
        </ScrollView>
      )}

      {tab === 'countries' ? (
        <FlatList
          data={countriesArr}
          keyExtractor={c => c.iso_code}
          ListHeaderComponent={<Text variant="titleMedium" style={{ margin: 12 }}>Your country wishlist ({countriesArr.length})</Text>}
          renderItem={({ item }) => (
            <CountryListItem
              country={item}
              right={
                <View style={{ flexDirection: 'row' }}>
                  <IconButton icon="map-marker-outline" onPress={() => nav.dispatch(DrawerActions.jumpTo('Map'))} />
                  <IconButton icon="close" onPress={() => toggleCountryWishlist(item.iso_code)} />
                </View>
              }
            />
          )}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 32, opacity: 0.6 }}>No country wishlist yet</Text>}
        />
      ) : (
        <FlatList
          data={citiesArr}
          keyExtractor={c => String(c.id)}
          ListHeaderComponent={<Text variant="titleMedium" style={{ margin: 12 }}>Your city wishlist ({citiesArr.length})</Text>}
          renderItem={({ item }) => {
            const country = countriesByCode[item.country];
            return (
              <List.Item
                title={`${country?.flag ?? '🌍'} ${item.name}`}
                description={country?.name ?? item.country}
                right={() => (
                  <View style={{ flexDirection: 'row' }}>
                    <IconButton icon="map-marker-outline" onPress={() => nav.dispatch(DrawerActions.jumpTo('Map'))} />
                    <IconButton icon="close" onPress={() => toggleCityWishlist(item.id)} />
                  </View>
                )}
              />
            );
          }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 32, opacity: 0.6 }}>No city wishlist yet</Text>}
        />
      )}
    </View>
  );
}
