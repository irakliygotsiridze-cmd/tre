import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { Searchbar, IconButton, Divider, Text } from 'react-native-paper';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import CountryListItem from '@/components/CountryListItem';
import { useCountriesStore } from '@/store/useCountriesStore';
import { search } from '@/services/search';

export default function WishlistScreen() {
  const [query, setQuery] = useState('');
  const byCode = useCountriesStore(s => s.byCode);
  const wishlist = useCountriesStore(s => s.wishlist);
  const toggleWishlist = useCountriesStore(s => s.toggleWishlist);
  const nav = useNavigation();

  const results = useMemo(() => {
    if (!query) return [];
    return search(query, 10).filter(r => r.kind === 'country');
  }, [query]);

  const wishlistArr = useMemo(
    () => Array.from(wishlist).map(iso => byCode[iso]).filter(Boolean),
    [wishlist, byCode],
  );

  return (
    <View style={{ flex: 1 }}>
      <Searchbar
        placeholder="Add country to wishlist…"
        value={query}
        onChangeText={setQuery}
        style={{ margin: 8 }}
      />
      {results.length > 0 && (
        <View style={{ maxHeight: 220 }}>
          {results.map(r => {
            if (r.kind !== 'country') return null;
            const c = r.item;
            const inList = wishlist.has(c.iso_code);
            return (
              <CountryListItem
                key={c.iso_code}
                country={c}
                onPress={async () => {
                  await toggleWishlist(c.iso_code);
                  setQuery('');
                }}
                right={<Text>{inList ? '✓' : '+'}</Text>}
              />
            );
          })}
          <Divider />
        </View>
      )}
      <FlatList
        data={wishlistArr}
        keyExtractor={c => c.iso_code}
        ListHeaderComponent={
          <Text variant="titleMedium" style={{ margin: 12 }}>Your wishlist ({wishlistArr.length})</Text>
        }
        renderItem={({ item }) => (
          <CountryListItem
            country={item}
            right={
              <View style={{ flexDirection: 'row' }}>
                <IconButton icon="map-marker-outline" onPress={() => nav.dispatch(DrawerActions.jumpTo('Map'))} />
                <IconButton icon="close" onPress={() => toggleWishlist(item.iso_code)} />
              </View>
            }
          />
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 32, opacity: 0.6 }}>No wishlist yet</Text>
        }
      />
    </View>
  );
}
