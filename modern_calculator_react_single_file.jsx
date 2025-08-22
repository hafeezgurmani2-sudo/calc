import React, { useEffect, useMemo, useRef, useState } from "react";
import { Moon, Sun, Delete, History as HistoryIcon, Plus, Minus, Divide, X, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// --- Helpers ---
const ALLOWED = /[^0-9+\-*/().%\s]/g; // any char NOT allowed

function safeEval(expr) {
  // basic sanitization: strip any non-allowed characters
  const cleaned = (expr || "").replace(ALLOWED, "");
  if (!cleaned.trim()) return "";
  try {
    // eslint-disable-next-line no-new-func
    const val = Function(`"use strict"; return (${cleaned})`)();
    if (typeof val === "number" && Number.isFinite(val)) return val;
    return "";
  } catch (e) {
    return "";
  }
}

function fmt(n) {
  if (n === "" || n == null || Number.isNaN(n)) return "";
  const str = Number(n).toString();
  // limit to 12 significant digits to avoid ugly floats
  const num = Number(n);
  return Math.abs(num) > 1e12 || (Math.abs(num) < 1e-6 && num !== 0)
    ? num.toExponential(6)
    : Number(num.toFixed(10)).toString();
}

const KEYS = [
  { label: "AC", className: "col-span-2", action: "all-clear" },
  { label: "⌫", action: "backspace" },
  { label: "/", action: "/" },
  { label: "7", action: "7" },
  { label: "8", action: "8" },
  { label: "9", action: "9" },
  { label: "*", action: "*" },
  { label: "4", action: "4" },
  { label: "5", action: "5" },
  { label: "6", action: "6" },
  { label: "-", action: "-" },
  { label: "1", action: "1" },
  { label: "2", action: "2" },
  { label: "3", action: "3" },
  { label: "+", action: "+" },
  { label: "%", action: "%" },
  { label: "0", action: "0" },
  { label: ".", action: "." },
  { label: "=", className: "row-span-2", action: "=" },
  { label: "(", action: "(" },
  { label: ")", action: ")" },
];

export default function CalculatorSite() {
  const [dark, setDark] = useState(true);
  const [expr, setExpr] = useState("");
  const [ans, setAns] = useState("");
  const [history, setHistory] = useState([]); // {expr, result}
  const [showHistory, setShowHistory] = useState(true);
  const inputRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // live preview result
  useEffect(() => {
    const res = safeEval(expr);
    setAns(res === "" ? "" : fmt(res));
  }, [expr]);

  function insert(val) {
    if (val === "all-clear") {
      setExpr("");
      setAns("");
      return;
    }
    if (val === "backspace") {
      setExpr((s) => s.slice(0, -1));
      return;
    }
    if (val === "%") {
      // percentage of current number segment: divide last number by 100
      setExpr((s) => {
        const m = s.match(/([0-9]*\.?[0-9]+)(?!.*[0-9]*\.?[0-9]+)/);
        if (!m) return s + "%"; // fallback to operator style
        const start = m.index;
        const end = start + m[0].length;
        const num = parseFloat(m[0]);
        if (!Number.isFinite(num)) return s;
        const replaced = (num / 100).toString();
        return s.slice(0, start) + replaced + s.slice(end);
      });
      return;
    }
    if (val === "=") {
      const r = safeEval(expr);
      if (r !== "") {
        const resultStr = fmt(r);
        setHistory((h) => [{ expr, result: resultStr }, ...h].slice(0, 20));
        setExpr(resultStr);
        setAns("");
      }
      return;
    }
    setExpr((s) => (s + val).replace(/\s+/g, ""));
  }

  // keyboard support
  useEffect(() => {
    const onKey = (e) => {
      const k = e.key;
      if (/^[0-9.+\-*/()%]$/.test(k)) {
        e.preventDefault();
        insert(k);
      } else if (k === "Backspace") {
        e.preventDefault();
        insert("backspace");
      } else if (k === "Delete") {
        e.preventDefault();
        insert("all-clear");
      } else if (k === "Enter" || k === "=") {
        e.preventDefault();
        insert("=");
      } else if (k.toLowerCase() === "c") {
        e.preventDefault();
        insert("all-clear");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black text-zinc-900 dark:text-zinc-50">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">CalcCraft</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-2xl" onClick={() => setDark((d) => !d)}>
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calculator */}
          <Card className="rounded-3xl lg:col-span-2">
            <CardContent className="p-5">
              {/* Display */}
              <div className="mb-4 p-4 rounded-2xl bg-zinc-100/70 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800">
                <div className="text-xs uppercase opacity-60 mb-1">Expression</div>
                <div className="text-2xl sm:text-3xl font-mono break-all min-h-[2.2rem]">{expr || "0"}</div>
                <div className="text-xs uppercase opacity-60 mt-3">Result</div>
                <div className="text-xl sm:text-2xl font-mono min-h-[1.8rem] opacity-80">{ans}</div>
              </div>

              {/* Keys */}
              <div className="grid grid-cols-4 grid-rows-[repeat(6,minmax(3rem,1fr))] gap-2">
                {KEYS.map((k, idx) => (
                  <Button
                    key={idx}
                    onClick={() => insert(k.action)}
                    className={`rounded-2xl h-14 text-lg font-medium ${k.className || ""}`}
                    variant={/[0-9.]/.test(k.action) ? "secondary" : "default"}
                  >
                    {k.label}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" className="rounded-2xl" onClick={() => insert("all-clear")}>Clear</Button>
                <Button variant="outline" className="rounded-2xl" onClick={() => insert("backspace")}>
                  Backspace
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* History */}
          <Card className="rounded-3xl">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <HistoryIcon className="h-4 w-4" />
                  <h2 className="font-semibold">History</h2>
                </div>
                <Button variant="outline" className="rounded-2xl" onClick={() => setHistory([])}>Clear</Button>
              </div>
              <div className="max-h-96 overflow-auto pr-2 space-y-2">
                {history.length === 0 && (
                  <div className="text-sm opacity-60">No calculations yet. Try 12+34*2 then press =</div>
                )}
                {history.map((h, i) => (
                  <button
                    key={i}
                    className="w-full text-left p-3 rounded-2xl bg-zinc-100/70 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    onClick={() => setExpr(h.result)}
                    title="Click to reuse result"
                  >
                    <div className="font-mono text-sm truncate">{h.expr}</div>
                    <div className="font-mono text-lg">= {h.result}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tips */}
        <div className="mt-6 text-sm opacity-70">
          <p>Tips: Use keyboard (0-9, +, -, *, /, %, (, ), Enter). Press C/Delete for clear, Backspace to delete.</p>
        </div>
      </div>

      <div className="h-10" />
    </div>
  );
}
