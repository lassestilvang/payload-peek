"use client";

import React, { useState } from "react";
import {
  Inbox,
  Terminal,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  Server,
  Zap,
} from "lucide-react";
import { SAMPLE_TEMPLATES } from "@/lib/templates";

interface InboxSidebarProps {
  inboxId: string;
  receiverUrl: string;
  eventCount: number;
  onSendSample: (templateId: string) => Promise<void>;
  isSendingSample: boolean;
}

export function InboxSidebar({
  inboxId,
  receiverUrl,
  eventCount,
  onSendSample,
  isSendingSample,
}: InboxSidebarProps) {
  const [copiedCurl, setCopiedCurl] = useState(false);

  const sampleCurl = `curl -X POST "${receiverUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{"event":"checkout.completed","amount":4900,"currency":"usd"}'`;

  const copyCurl = async () => {
    try {
      await navigator.clipboard.writeText(sampleCurl);
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <aside className="w-full lg:w-80 flex flex-col gap-4 p-4 border-r border-slate-800/80 bg-[#080d19] shrink-0">
      {/* Inbox Status Card */}
      <div className="rounded-xl border border-slate-800 bg-[#0b1222] p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Inbox className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-200">
              Active Inbox
            </span>
          </div>
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Listening
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Inbox ID</span>
            <span className="font-mono text-slate-300 font-medium truncate max-w-[140px]">
              {inboxId || "..."}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Captured Events</span>
            <span className="font-mono text-emerald-400 font-semibold">
              {eventCount}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-400">Persistence</span>
            <span className="text-slate-300">Cloud Firestore</span>
          </div>
        </div>
      </div>

      {/* Instant Terminal cURL snippet */}
      <div className="rounded-xl border border-slate-800 bg-[#0b1222] p-4 shadow-lg flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Send via cURL</span>
          </div>
          <button
            onClick={copyCurl}
            className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-md transition cursor-pointer ${
              copiedCurl
                ? "bg-emerald-500/20 text-emerald-300"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
            title="Copy cURL command"
          >
            {copiedCurl ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        <div className="rounded-lg bg-[#060a13] p-2.5 font-mono text-[11px] text-slate-300 border border-slate-800/80 overflow-x-auto whitespace-pre leading-relaxed select-all">
          {sampleCurl}
        </div>
        <p className="text-[11px] text-slate-400">
          Paste into your terminal to test webhook capture immediately.
        </p>
      </div>

      {/* 1-Click Sample Webhooks */}
      <div className="rounded-xl border border-slate-800 bg-[#0b1222] p-4 shadow-lg flex flex-col gap-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span>Quick Sample Webhooks</span>
        </div>
        <p className="text-[11px] text-slate-400">
          Simulate real incoming payloads from popular developer services:
        </p>

        <div className="grid grid-cols-1 gap-1.5 pt-1">
          {SAMPLE_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => onSendSample(tmpl.id)}
              disabled={isSendingSample}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-emerald-300 transition group cursor-pointer disabled:opacity-50 text-left"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition" />
                <span className="font-medium truncate">{tmpl.name}</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-500 px-1.5 py-0.5 rounded bg-slate-900">
                {tmpl.provider}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Safety Guardrails */}
      <div className="rounded-xl border border-slate-800/60 bg-[#070c17] p-3.5 flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Safety Guardrails</span>
        </div>
        <ul className="text-[11px] text-slate-400 space-y-1 list-disc pl-4">
          <li>128 KB max payload limit per request</li>
          <li>Sensitive auth & API headers redacted</li>
          <li>Owner access token verified on dashboard</li>
        </ul>
      </div>

      {/* Google Cloud Run Footer info */}
      <div className="mt-auto pt-2 flex items-center gap-2 text-[11px] text-slate-400">
        <Server className="w-3.5 h-3.5 text-slate-400" />
        <span>Built for Google Cloud Run Hackathon</span>
      </div>
    </aside>
  );
}
