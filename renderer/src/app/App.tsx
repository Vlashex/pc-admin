import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import "./App.css";

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
      // After start/stop, fetch real status
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
        console.info(result);
        setStatus(result.isActive);
        setError(null);
      } catch (err) {
        setError(`Error: ${err}`);
        console.error(err);
      }
      setTimeout(pollTailscaleStatus, 5000);
    };

    const pollConnectionStatus = async () => {
      if (!isMounted) return;
      setConnectionStatus((prev) => prev); // чтобы TS не ругался
      if (!status) {
        setConnectionStatus({ isActive: false, ping: null, loss: null });
      } else {
        try {
          const result = await window.electron.getTailscaleConntectionStatus();
          console.info(result);
          setConnectionStatus(result);
          setError(null);
        } catch (err) {
          setError(`Error: ${err}`);
          console.error(err);
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

  const statusColor = status ? "border-emerald-500" : "border-red-400";
  const statusHoverColor = status ? "hover:bg-emerald-50" : "hover:bg-red-40";

  return (
    <div className="flex flex-col text-center p-10 gap-8">
      <h1>PC-admin</h1>
      <Separator className="h-4 bg-amber-200" />
      <div className="flex justify-around">
        <div className="min-w-0 w-1/3 h-8 overflow-hidden">
          <h2>Active: {status ? (isActive ? "true" : "false") : "-"}</h2>
        </div>
        <div className="min-w-0 w-1/3 h-8 overflow-hidden">
          <h2>Ping: {ping || "-"}</h2>
        </div>
        <div className="min-w-0 w-1/3 h-8 overflow-hidden">
          <h2>Loss: {loss || "-"}</h2>
        </div>
      </div>
      <Separator className="h-4 bg-amber-200" />

      <div className="grid grid-cols-2 gap-1">
        <Button
          className={`p-12 bg-white text-black border-2 ${statusHoverColor} ${statusColor}`}
          onClick={toggleTailscale}
        >
          Tailscale
        </Button>
        <Button
          onClick={handleSendFlag}
          disabled={loading}
          className="p-12 bg-white text-black border-2 border-amber-400"
        >
          {loading ? "Sending..." : "Send Flag"}
          {response && "Response: {response}"}
          {error || ""}
        </Button>
      </div>
    </div>
  );
}

export default App;
