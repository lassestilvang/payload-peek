"use client";

import React, { useState } from "react";
import { X, Terminal, Copy, Check } from "lucide-react";
import { CodeViewer } from "./CodeViewer";

interface CurlModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiverUrl: string;
}

export function CurlModal({ isOpen, onClose, receiverUrl }: CurlModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sampleSnippet = `curl -X POST "${receiverUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "event": "checkout.session.completed",
    "customer": {
      "id": "cus_12345",
      "email": "developer@example.com"
    },
    "amount_total": 4900,
    "currency": "usd"
  }'`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sampleSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-[#0c1426] p-6 shadow-2xl flex flex-col gap-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Terminal className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Send Webhook via cURL
              </h3>
              <p className="text-[11px] text-slate-400">
                Run this command in any terminal to test your live inbox immediately.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Code Block with CodeViewer (Wide & full line visibility) */}
        <div className="w-full">
          <CodeViewer
            code={sampleSnippet}
            language="bash"
            title="bash"
            badge="cURL Example"
            celebrateOnCopy={true}
          />
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
          <p className="text-[11px] text-slate-500">
            Works with bash, zsh, fish, and PowerShell.
          </p>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              Done
            </button>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                copied
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Command</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
