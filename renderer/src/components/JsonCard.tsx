import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";

type JsonCardProps = {
  title: string;
  data: string;
  variant?: "success" | "destructive" | "default";
};

export function JsonCard({ title, data, variant = "default" }: JsonCardProps) {
  let parsed: unknown;

  try {
    parsed = JSON.parse(data);
  } catch {
    parsed = data; // если не JSON, покажем как строку
  }

  const borderClass =
    variant === "success"
      ? "border border-green-500"
      : variant === "destructive"
      ? "border border-red-500"
      : "border border-slate-400";

  const titleClass =
    variant === "success"
      ? "text-green-600"
      : variant === "destructive"
      ? "text-red-600"
      : "text-slate-700";

  const renderValue = (value: any) => {
    if (value === null) {
      return <span className="text-pink-500 italic">null</span>;
    }
    if (typeof value === "string") {
      return <span className="text-blue-500">"{value}"</span>;
    }
    if (typeof value === "number") {
      return <span className="text-emerald-500">{value}</span>;
    }
    if (typeof value === "boolean") {
      return <span className="text-orange-500">{String(value)}</span>;
    }
    if (Array.isArray(value)) {
      return (
        <span>
          <span className="text-gray-400">[</span>
          <div className="ml-6">
            {value.map((v, i) => (
              <div key={i}>
                {renderValue(v)}
                {i < value.length - 1 ? "," : ""}
              </div>
            ))}
          </div>
          <span className="text-gray-400">]</span>
        </span>
      );
    }
    if (typeof value === "object") {
      const entries = Object.entries(value);
      return (
        <span>
          <span className="text-gray-400">{"{"}</span>
          <div className="ml-6">
            {entries.map(([k, v], i) => (
              <div key={i}>
                <span className="text-purple-500 font-semibold">"{k}"</span>
                <span className="text-gray-400">: </span>
                {renderValue(v)}
                {i < entries.length - 1 ? "," : ""}
              </div>
            ))}
          </div>
          <span className="text-gray-400">{"}"}</span>
        </span>
      );
    }
    return <span>{String(value)}</span>;
  };

  return (
    <Card className={borderClass}>
      <CardHeader>
        <CardTitle className={titleClass}>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {typeof parsed === "string" ? (
          <p className="text-sm">{parsed}</p>
        ) : (
          <pre className="text-sm whitespace-pre-wrap bg-slate-50 dark:bg-slate-900 p-3 rounded-md overflow-x-auto font-mono">
            {renderValue(parsed)}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}
