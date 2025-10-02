import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "../components/ui/button";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [dark]);

  return (
    <Button
      variant="ghost"
      onClick={() => setDark(!dark)}
      className="flex items-center gap-2 text-foreground dark:text-foreground-dark"
    >
      {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      {dark ? "Light" : "Dark"}
    </Button>
  );
}
