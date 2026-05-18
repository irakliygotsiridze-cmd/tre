import { Card, Text, ProgressBar } from 'react-native-paper';

interface Props {
  label: string;
  value: string;
  progress?: number;
}

export default function StatCard({ label, value, progress }: Props) {
  return (
    <Card style={{ flex: 1, margin: 6 }}>
      <Card.Content>
        <Text variant="labelMedium">{label}</Text>
        <Text variant="headlineSmall" style={{ marginTop: 4 }}>{value}</Text>
        {progress != null && (
          <ProgressBar progress={Math.max(0, Math.min(1, progress))} style={{ marginTop: 8 }} />
        )}
      </Card.Content>
    </Card>
  );
}
