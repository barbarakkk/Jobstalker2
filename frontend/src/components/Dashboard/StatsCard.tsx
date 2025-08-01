import { Card, CardContent } from '@/components/ui/card';

interface StatsCardProps {
  count: number;
  status: string;
  color: string;
}

export function StatsCard({ count, status, color }: StatsCardProps) {
  return (
    <Card className={`${color} border-2`}>
      <CardContent className="p-4 text-center">
        <div className="text-2xl font-bold text-gray-900">{count}</div>
        <div className="text-sm text-gray-600">{status.toUpperCase()}</div>
      </CardContent>
    </Card>
  );
} 