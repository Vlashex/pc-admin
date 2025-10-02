import { useEffect, useState } from "react";
import { Separator } from "../components/ui/separator";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Network, Send } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { StatusCard } from "@/components/StatusCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { JsonCard } from "@/components/JsonCard";

function App() {
  const [{ isActive, ping, loss }, setConnectionStatus] = useState<{
    isActive: boolean;
    ping: string | null;
    loss: string | null;
  }>({ isActive: false, ping: null, loss: null });

  const [status, setStatus] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const toggleTailscale = async () => {
    try {
      if (status) await window.electron.stopTailscale();
      else await window.electron.startTailscale();
      const s = await window.electron.getTailscaleStatus();
      setStatus(s.isActive);
      setError(null);
    } catch (err) {
      setError(`Error: ${err}`);
    }
  };

  const handleSendFlag = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await window.electron.sendFlagRequest();
      console.info(res);
      setResponse(res as string);
    } catch (err) {
      setError(`Error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const pollTailscaleStatus = async () => {
      if (!isMounted) return;
      try {
        const result = await window.electron.getTailscaleStatus();
        setStatus(result.isActive);
        setError(null);
      } catch (err) {
        setError(`Error: ${err}`);
      }
      setTimeout(pollTailscaleStatus, 5000);
    };

    const pollConnectionStatus = async () => {
      if (!isMounted) return;
      if (!status) {
        setConnectionStatus({ isActive: false, ping: null, loss: null });
      } else {
        try {
          const result = await window.electron.getTailscaleConntectionStatus();
          setConnectionStatus(result);
          setError(null);
        } catch (err) {
          setError(`Error: ${err}`);
        }
      }
      setTimeout(pollConnectionStatus, 1000);
    };

    pollTailscaleStatus();
    pollConnectionStatus();
    return () => {
      isMounted = false;
    };
  }, [status]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="flex items-center justify-between p-6 border-b border-border">
        <h1 className="text-2xl font-bold">PC-admin</h1>
        <ThemeToggle />
      </header>

      <main className="flex-1 p-6 flex flex-col gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatusCard
              label="Active"
              value={status ? (isActive ? "true" : "false") : "-"}
            />
            <StatusCard label="Ping" value={ping || "-"} />
            <StatusCard label="Loss" value={loss || "-"} />
          </CardContent>
        </Card>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ActionButton
            onClick={toggleTailscale}
            variant={status ? "destructive" : "primary"}
            icon={<Network className="w-5 h-5 mr-2" />}
          >
            {status ? "Stop Tailscale" : "Start Tailscale"}
          </ActionButton>

          <ActionButton
            onClick={handleSendFlag}
            disabled={loading}
            icon={
              loading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Send className="w-5 h-5 mr-2" />
              )
            }
          >
            {loading ? "Sending..." : "Send Flag"}
          </ActionButton>
        </div>

        {response && (
          <JsonCard title="Response" data={response} variant="success" />
        )}

        {error && <JsonCard title="Error" data={error} variant="destructive" />}
      </main>
    </div>
  );
}

export default App;
