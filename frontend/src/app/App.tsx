import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import "./App.css";

function App() {
  window.electron.return(
    <div className="flex flex-col text-center p-10 gap-8">
      <h1>PC-admin</h1>
      <Separator className="h-4 bg-amber-200" />
      <div className="flex justify-around">
        <h2>Active: </h2>
        <h2>Ping: </h2>
        <h2>Loss: </h2>
      </div>
      <Separator className="h-4 bg-amber-200" />

      <div className="grid grid-cols-2 gap-1">
        <Button className="p-12 border hover:bg-gray-50 ease-in transition-colors">
          Sunshine:{" "}
        </Button>
        <Button className="p-12 border hover:bg-gray-50 ease-in transition-colors">
          Tailscale:{" "}
        </Button>
        <Button className="p-12 border hover:bg-gray-50 ease-in transition-colors">
          Sunshine
        </Button>
        <Button className="p-12 border hover:bg-gray-50 ease-in transition-colors">
          Sunshine
        </Button>
      </div>
    </div>
  );
}

export default App;
