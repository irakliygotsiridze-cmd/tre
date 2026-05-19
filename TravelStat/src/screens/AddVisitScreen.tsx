import { useMemo, useState } from 'react';
import { ScrollView, View, StyleSheet, FlatList } from 'react-native';
import { Button, Chip, HelperText, TextInput, Text, IconButton, Divider, SegmentedButtons } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCountriesStore } from '@/store/useCountriesStore';
import { useCitiesStore } from '@/store/useCitiesStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { search } from '@/services/search';
import { recordVisit } from '@/services/coordinator';
import { today } from '@/utils/dates';
import { TRANSPORT_MODES, TRANSPORT_ICON, type NewVisitCity, type TransportMode } from '@/utils/types';

interface CityRow {
  city_id: number;
  transport: TransportMode | null;
}

export default function AddVisitScreen() {
  const baseCurrency = useSettingsStore(s => s.baseCurrency);
  const byCode = useCountriesStore(s => s.byCode);
  const cityById = useCitiesStore(s => s.byId);
  const nav = useNavigation();

  const [countryQuery, setCountryQuery] = useState('');
  const [countryIso, setCountryIso] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('');
  const [cities, setCities] = useState<CityRow[]>([]);
  const [cityQuery, setCityQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const countrySuggestions = useMemo(() => {
    if (!countryQuery || countryIso) return [];
    return search(countryQuery, 5).filter(r => r.kind === 'country').slice(0, 5);
  }, [countryQuery, countryIso]);

  const citySuggestions = useMemo(() => {
    if (!cityQuery || !countryIso) return [];
    return search(cityQuery, 30)
      .filter(r => r.kind === 'city' && r.item.country === countryIso)
      .slice(0, 8);
  }, [cityQuery, countryIso]);

  const canSubmit = !!countryIso && !!startDate && !submitting;

  const addCity = (id: number) => {
    if (cities.some(c => c.city_id === id)) return;
    setCities(prev => [...prev, { city_id: id, transport: null }]);
    setCityQuery('');
  };

  const removeCity = (id: number) => setCities(prev => prev.filter(c => c.city_id !== id));
  const setCityTransport = (id: number, t: TransportMode | null) =>
    setCities(prev => prev.map(c => (c.city_id === id ? { ...c, transport: t } : c)));
  const moveCity = (id: number, dir: -1 | 1) => {
    setCities(prev => {
      const i = prev.findIndex(c => c.city_id === id);
      if (i < 0) return prev;
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const submit = async () => {
    if (!countryIso) return;
    setSubmitting(true);
    try {
      const b = budget.trim() ? Number(budget.replace(',', '.')) : undefined;
      const hasBudget = b != null && Number.isFinite(b);
      const newCities: NewVisitCity[] = cities.map(c => ({
        city_id: c.city_id,
        transport: c.transport ?? undefined,
      }));
      await recordVisit({
        country_code: countryIso,
        start_date: startDate,
        end_date: endDate || undefined,
        notes: notes || undefined,
        budget: hasBudget ? b : undefined,
        budget_currency: hasBudget ? baseCurrency : undefined,
        cities: newCities.length ? newCities : undefined,
      });
      nav.goBack();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={s.root}>
      <Text variant="titleMedium">Country</Text>
      {countryIso ? (
        <Chip onClose={() => { setCountryIso(null); setCities([]); }} style={{ alignSelf: 'flex-start', marginTop: 8 }}>
          {byCode[countryIso]?.flag} {byCode[countryIso]?.name}
        </Chip>
      ) : (
        <>
          <TextInput value={countryQuery} onChangeText={setCountryQuery} placeholder="Search country…" />
          {countrySuggestions.map(r => r.kind === 'country' && (
            <Button key={r.item.iso_code} onPress={() => setCountryIso(r.item.iso_code)}>
              {r.item.flag} {r.item.name}
            </Button>
          ))}
        </>
      )}

      <Text variant="titleMedium" style={s.label}>Start date</Text>
      <TextInput value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" />

      <Text variant="titleMedium" style={s.label}>End date (optional)</Text>
      <TextInput value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" />

      <Text variant="titleMedium" style={s.label}>Cities visited (optional)</Text>
      {!countryIso && (
        <HelperText type="info">Select country first.</HelperText>
      )}
      {countryIso && (
        <>
          <TextInput
            value={cityQuery}
            onChangeText={setCityQuery}
            placeholder="Search city in this country…"
          />
          {citySuggestions.map(r => r.kind === 'city' && (
            <Button key={r.item.id} onPress={() => addCity(r.item.id)}>
              + {r.item.name}
            </Button>
          ))}
          {cities.length > 0 && <Divider style={{ marginVertical: 8 }} />}
          {cities.map((c, i) => {
            const city = cityById.get(c.city_id);
            return (
              <View key={c.city_id} style={s.cityRow}>
                <View style={{ flex: 1 }}>
                  <Text variant="titleSmall">{i + 1}. {city?.name ?? c.city_id}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
                    {TRANSPORT_MODES.map(t => {
                      const selected = c.transport === t;
                      return (
                        <Chip
                          key={t}
                          selected={selected}
                          onPress={() => setCityTransport(c.city_id, selected ? null : t)}
                          icon={() => <MaterialCommunityIcons name={TRANSPORT_ICON[t] as any} size={16} color={selected ? 'white' : '#555'} />}
                          style={{ marginRight: 4, marginTop: 4 }}
                          compact
                        >
                          {t}
                        </Chip>
                      );
                    })}
                  </View>
                </View>
                <View>
                  <IconButton icon="arrow-up" size={18} onPress={() => moveCity(c.city_id, -1)} disabled={i === 0} />
                  <IconButton icon="arrow-down" size={18} onPress={() => moveCity(c.city_id, 1)} disabled={i === cities.length - 1} />
                  <IconButton icon="close" size={18} onPress={() => removeCity(c.city_id)} />
                </View>
              </View>
            );
          })}
        </>
      )}

      <Text variant="titleMedium" style={s.label}>Budget (optional)</Text>
      <View style={s.row}>
        <TextInput value={budget} onChangeText={setBudget} keyboardType="numeric" style={{ flex: 1 }} />
        <Chip style={{ marginLeft: 8 }}>{baseCurrency}</Chip>
      </View>
      <HelperText type="info">Saved in {baseCurrency}.</HelperText>

      <Text variant="titleMedium" style={s.label}>Notes</Text>
      <TextInput value={notes} onChangeText={setNotes} multiline numberOfLines={3} />

      <Button mode="contained" onPress={submit} disabled={!canSubmit} style={{ marginTop: 24 }}>
        Save visit
      </Button>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { padding: 16 },
  label: { marginTop: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  cityRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 },
});
