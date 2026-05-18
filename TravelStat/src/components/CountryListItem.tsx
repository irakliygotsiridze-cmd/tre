import { List } from 'react-native-paper';
import type { CountryMeta } from '@/utils/types';
import type { ReactNode } from 'react';

interface Props {
  country: CountryMeta;
  onPress?: () => void;
  right?: ReactNode;
}

export default function CountryListItem({ country, onPress, right }: Props) {
  return (
    <List.Item
      title={`${country.flag} ${country.name}`}
      description={country.continent}
      onPress={onPress}
      right={() => right ?? null}
    />
  );
}
