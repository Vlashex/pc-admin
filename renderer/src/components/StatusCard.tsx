import { Card } from "../components/ui/card";

export function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="flex flex-col items-center justify-center p-4 bg-card text-card-foreground border border-border">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-xl font-semibold">{value}</span>
    </Card>
  );
}
