"use client";

import React, { useState } from "react";
import { X, Terminal, Copy, Check } from "lucide-react";

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
    "event": "payment.succeeded",
    "customer": {
      "id": "cus_12345",
      "email": "developer@example.com"
    },
    "amount": 2500,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-[#0c1426] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <span>Send Webhook via cURL</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 mt-3 mb-2">
          Run this sample command in your terminal. As soon as you hit Enter, the
          request will appear live in your Payload Peek inbox!
        </p>

        <div className="relative rounded-xl border border-slate-800 bg-[#070d18] p-4 font-mono text-xs text-slate-200 overflow-x-auto my-3 whitespace-pre">
          {sampleSnippet}
        </div>

        <div className="flex items-center justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              copied
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy cURL Command</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
