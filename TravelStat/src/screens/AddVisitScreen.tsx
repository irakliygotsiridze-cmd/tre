import { useMemo, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Button, Chip, HelperText, TextInput, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useCountriesStore } from '@/store/useCountriesStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { search } from '@/services/search';
import { recordVisit } from '@/services/coordinator';
import { today } from '@/utils/dates';

export default function AddVisitScreen() {
  const baseCurrency = useSettingsStore(s => s.baseCurrency);
  const byCode = useCountriesStore(s => s.byCode);
  const nav = useNavigation();

  const [countryQuery, setCountryQuery] = useState('');
  const [countryIso, setCountryIso] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const suggestions = useMemo(() => {
    if (!countryQuery || countryIso) return [];
    return search(countryQuery, 5).filter(r => r.kind === 'country').slice(0, 5);
  }, [countryQuery, countryIso]);

  const canSubmit = !!countryIso && !!startDate && !submitting;

  const submit = async () => {
    if (!countryIso) return;
    setSubmitting(true);
    try {
      const b = budget.trim() ? Number(budget.replace(',', '.')) : undefined;
      const hasBudget = b != null && Number.isFinite(b);
      await recordVisit({
        country_code: countryIso,
        start_date: startDate,
        end_date: endDate || undefined,
        notes: notes || undefined,
        budget: hasBudget ? b : undefined,
        budget_currency: hasBudget ? baseCurrency : undefined,
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
        <Chip onClose={() => setCountryIso(null)} style={{ alignSelf: 'flex-start', marginTop: 8 }}>
          {byCode[countryIso]?.flag} {byCode[countryIso]?.name}
        </Chip>
      ) : (
        <>
          <TextInput value={countryQuery} onChangeText={setCountryQuery} placeholder="Search country…" />
          {suggestions.map(r => r.kind === 'country' && (
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
});
