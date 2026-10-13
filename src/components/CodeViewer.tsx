"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import confetti from "canvas-confetti";

interface CodeViewerProps {
  code: string;
  language: "typescript" | "json" | "bash" | "zod";
  title?: string;
  badge?: string;
  celebrateOnCopy?: boolean;
}

export function CodeViewer({
  code,
  language,
  title,
  badge,
  celebrateOnCopy = false,
}: CodeViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (celebrateOnCopy) {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 },
          colors: ["#10b981", "#34d399", "#8b5cf6", "#38bdf8"],
        });
      }
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Syntax highlighting helper for code view
  const renderHighlightedCode = (text: string, lang: string) => {
    const lines = text.split("\n");

    return lines.map((line, idx) => {
      let formattedLine: React.ReactNode = line;

      if (lang === "typescript" || lang === "zod") {
        // Highlight keywords, types, and comments
        const parts = line.split(/(\/\/.*$|\/\*.*?\*\/|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g);

        formattedLine = parts.map((part, pIdx) => {
          if (!part) return null;
          if (part.startsWith("//") || part.startsWith("/*")) {
            return (
              <span key={pIdx} className="text-slate-500 italic">
                {part}
              </span>
            );
          }
          if (part.startsWith('"') || part.startsWith("'")) {
            return (
              <span key={pIdx} className="text-emerald-400">
                {part}
              </span>
            );
          }

          // Replace TS keywords
          const words = part.split(/(\b(?:export|interface|type|const|import|from|return|async|await|function|try|catch|null|undefined|boolean|string|number|unknown|z|object)\b)/g);
          return words.map((w, wIdx) => {
            if (/^(export|interface|type|const|import|from|return|async|await|function|try|catch)$/.test(w)) {
              return (
                <span key={wIdx} className="text-violet-400 font-semibold">
                  {w}
                </span>
              );
            }
            if (/^(string|number|boolean|unknown|null|undefined)$/.test(w)) {
              return (
                <span key={wIdx} className="text-sky-400">
                  {w}
                </span>
              );
            }
            if (w === "z") {
              return (
                <span key={wIdx} className="text-amber-400 font-semibold">
                  {w}
                </span>
              );
            }
            return <span key={wIdx}>{w}</span>;
          });
        });
      } else if (lang === "json") {
        // Simple JSON highlighting
        const parts = line.split(/("(?:[^"\\]|\\.)*"(?:\s*:)?)/g);
        formattedLine = parts.map((part, pIdx) => {
          if (!part) return null;
          if (part.endsWith(":")) {
            const key = part.slice(0, -1);
            return (
              <React.Fragment key={pIdx}>
                <span className="text-sky-300">{key}</span>:
              </React.Fragment>
            );
          }
          if (part.startsWith('"')) {
            return (
              <span key={pIdx} className="text-emerald-300">
                {part}
              </span>
            );
          }
          // Numbers, booleans, null
          const tokens = part.split(/(\b(?:true|false|null|\d+(?:\.\d+)?)\b)/g);
          return tokens.map((tok, tIdx) => {
            if (/^(true|false)$/.test(tok)) {
              return (
                <span key={tIdx} className="text-amber-400">
                  {tok}
                </span>
              );
            }
            if (tok === "null") {
              return (
                <span key={tIdx} className="text-rose-400">
                  {tok}
                </span>
              );
            }
            if (/^\d+(?:\.\d+)?$/.test(tok)) {
              return (
                <span key={tIdx} className="text-cyan-400">
                  {tok}
                </span>
              );
            }
            return <span key={tIdx}>{tok}</span>;
          });
        });
      } else if (lang === "bash") {
        if (line.startsWith("curl") || line.startsWith("  -")) {
          return (
            <span key={idx} className="text-slate-300">
              <span className="text-emerald-400 font-bold">{line.slice(0, 4)}</span>
              {line.slice(4)}
            </span>
          );
        }
      }

      return (
        <div key={idx} className="table-row">
          <span className="table-cell select-none pr-4 text-right text-slate-600 text-xs w-10">
            {idx + 1}
          </span>
          <span className="table-cell whitespace-pre">{formattedLine}</span>
        </div>
      );
    });
  };

  return (
    <div className="relative rounded-xl border border-slate-800 bg-[#090f1d] overflow-hidden group shadow-lg">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800/80 bg-[#0c1426]">
        <div className="flex items-center gap-2">
          {badge && (
            <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {badge}
            </span>
          )}
          {title && (
            <span className="text-xs font-medium text-slate-300">{title}</span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer ${
            copied
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              : "bg-slate-800/70 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60"
          }`}
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <div className="p-4 overflow-x-auto text-xs font-mono text-slate-200 leading-relaxed max-h-[560px]">
        <div className="table w-full">{renderHighlightedCode(code, language)}</div>
      </div>
    </div>
  );
}
