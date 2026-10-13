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
  ExternalLink,
} from "lucide-react";
import { SAMPLE_TEMPLATES } from "@/lib/templates";

interface InboxSidebarProps {
  inboxId: string;
  receiverUrl: string;
  eventCount: number;
  onSendSample: (templateId: string) => Promise<void>;
  onOpenCurlModal?: () => void;
  isSendingSample: boolean;
}

// Brand accent colors for sample webhook providers
const PROVIDER_STYLES: Record<
  string,
  { border: string; bg: string; text: string; dot: string; shortEvent: string }
> = {
  Stripe: {
    border: "hover:border-violet-500/40",
    bg: "hover:bg-violet-500/5",
    text: "text-violet-400",
    dot: "bg-violet-400",
    shortEvent: "checkout.completed",
  },
  GitHub: {
    border: "hover:border-slate-400/40",
    bg: "hover:bg-slate-500/5",
    text: "text-slate-300",
    dot: "bg-slate-300",
    shortEvent: "push.event",
  },
  Shopify: {
    border: "hover:border-emerald-500/40",
    bg: "hover:bg-emerald-500/5",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
    shortEvent: "orders.create",
  },
  Clerk: {
    border: "hover:border-indigo-500/40",
    bg: "hover:bg-indigo-500/5",
    text: "text-indigo-400",
    dot: "bg-indigo-400",
    shortEvent: "user.created",
  },
};

export function InboxSidebar({
  inboxId,
  receiverUrl,
  eventCount,
  onSendSample,
  onOpenCurlModal,
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
    <aside className="w-full lg:w-72 xl:w-80 flex flex-col gap-3.5 p-3.5 border-r border-slate-800/80 bg-[#080d19] shrink-0">
      {/* Inbox Status & Quick cURL Card */}
      <div className="rounded-xl border border-slate-800/90 bg-[#0b1222] p-3.5 shadow-md flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Inbox className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-slate-200">
              Active Inbox
            </span>
          </div>
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        </div>

        <div className="space-y-1.5 text-[11px] pt-1 border-t border-slate-800/60">
          <div className="flex justify-between items-center text-slate-400">
            <span>Inbox ID</span>
            <span className="font-mono text-slate-300 font-medium">
              {inboxId ? inboxId.slice(0, 16) + "..." : "..."}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Events</span>
            <span className="font-mono text-emerald-400 font-semibold">
              {eventCount} captured
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Store</span>
            <span className="text-slate-300">Cloud Firestore</span>
          </div>
        </div>

        {/* cURL action buttons: Big button opens modal, small button copies to clipboard */}
        <div className="pt-2 border-t border-slate-800/60 flex items-center gap-2">
          <button
            onClick={onOpenCurlModal}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 hover:text-white transition cursor-pointer"
            title="View full cURL example command"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>View cURL example</span>
          </button>
          <button
            onClick={copyCurl}
            className={`p-2 rounded-lg border transition cursor-pointer flex items-center justify-center shrink-0 ${
              copiedCurl
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
            title={copiedCurl ? "Copied to clipboard!" : "Copy cURL command"}
          >
            {copiedCurl ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* 2x2 Clean Grid: Sample Mock Webhooks */}
      <div className="rounded-xl border border-slate-800/90 bg-[#0b1222] p-3.5 shadow-md flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>Send Sample Webhook</span>
          </div>
          <span className="text-[10px] text-slate-500 uppercase font-medium">
            1-Click
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-tight">
          Simulate real webhook events from leading platforms:
        </p>

        {/* Responsive 2-column grid that never overflows */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {SAMPLE_TEMPLATES.map((tmpl) => {
            const style = PROVIDER_STYLES[tmpl.provider] || {
              border: "hover:border-slate-700",
              bg: "hover:bg-slate-800/50",
              text: "text-slate-300",
              dot: "bg-slate-400",
              shortEvent: tmpl.name,
            };

            return (
              <button
                key={tmpl.id}
                onClick={() => onSendSample(tmpl.id)}
                disabled={isSendingSample}
                className={`p-2.5 rounded-lg bg-[#070d18] border border-slate-800/80 ${style.border} ${style.bg} transition-all duration-150 flex flex-col text-left group cursor-pointer disabled:opacity-50`}
                title={`Send ${tmpl.name} sample webhook`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className={`text-xs font-bold ${style.text}`}>
                    {tmpl.provider}
                  </span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${style.dot} opacity-70 group-hover:opacity-100 transition`}
                  />
                </div>
                <span className="font-mono text-[10px] text-slate-400 group-hover:text-slate-200 truncate w-full">
                  {style.shortEvent}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Security & Cloud Run Architecture Notice */}
      <div className="rounded-xl border border-slate-800/60 bg-[#070c17] p-3 flex flex-col gap-1.5 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5 font-semibold text-slate-300 text-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Security & Guardrails</span>
        </div>
        <div className="space-y-1 text-[11px] text-slate-400 pl-1">
          <div>• 128 KB payload safety limit</div>
          <div>• Auth & secret headers redacted</div>
          <div>• Isolated token-hashed inboxes</div>
        </div>
      </div>

      {/* Footer info */}
      <div className="mt-auto pt-1 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <Server className="w-3 h-3 text-slate-500" />
          Google Cloud Run
        </span>
        <span className="text-[10px] font-mono text-slate-600">us-central1</span>
      </div>
    </aside>
  );
}
