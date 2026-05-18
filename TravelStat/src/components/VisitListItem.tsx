import { List } from 'react-native-paper';
import { fmtDate, visitDays } from '@/utils/dates';
import { fmtMoney } from '@/utils/currency';
import type { Visit, CountryMeta } from '@/utils/types';

interface Props {
  visit: Visit;
  country?: CountryMeta;
  cityName?: string;
}

export default function VisitListItem({ visit, country, cityName }: Props) {
  const days = visitDays(visit.start_date, visit.end_date);
  const range = `${fmtDate(visit.start_date)}${visit.end_date ? ` – ${fmtDate(visit.end_date)}` : ''}`;
  const money = visit.budget != null && visit.budget_currency
    ? ` · ${fmtMoney(visit.budget, visit.budget_currency)}`
    : '';
  return (
    <List.Item
      title={`${country?.flag ?? ''} ${country?.name ?? visit.country_code}${cityName ? ` · ${cityName}` : ''}`}
      description={`${range} · ${days}d${money}`}
    />
  );
}
