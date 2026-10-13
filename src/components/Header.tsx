"use client";

import React, { useState } from "react";
import {
  Webhook,
  Copy,
  Check,
  Plus,
  Trash2,
  Send,
  ChevronDown,
  Cloud,
  Terminal,
} from "lucide-react";
import { SAMPLE_TEMPLATES } from "@/lib/templates";

interface HeaderProps {
  receiverUrl: string;
  inboxId: string;
  eventCount: number;
  onSendSample: (templateId: string) => Promise<void>;
  onCreateNewInbox: () => Promise<void>;
  onClearEvents: () => Promise<void>;
  onOpenCurlModal: () => void;
  isSendingSample: boolean;
}

export function Header({
  receiverUrl,
  inboxId,
  eventCount,
  onSendSample,
  onCreateNewInbox,
  onClearEvents,
  onOpenCurlModal,
  isSendingSample,
}: HeaderProps) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isSampleDropdownOpen, setIsSampleDropdownOpen] = useState(false);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(receiverUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#080d19]/90 backdrop-blur-md">
      <div className="max-w-[1720px] mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-black">
              <Webhook className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                  Payload Peek
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  MVP
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">
                  <Cloud className="w-3 h-3 text-violet-400" />
                  Cloud Run Hackathon
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Webhook inspector · Type generator
              </p>
            </div>
          </div>

          {/* Mobile indicator */}
          <div className="flex md:hidden items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-[11px] text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </div>
        </div>

        {/* Listening URL Bar & Copy */}
        <div className="w-full md:w-auto flex-1 max-w-2xl px-0 md:px-4">
          <div className="flex items-center rounded-lg border border-slate-700/80 bg-[#0e1628] shadow-inner p-1 group focus-within:border-emerald-500/60 transition-colors">
            <div className="hidden sm:flex items-center gap-1.5 pl-2.5 pr-2 py-1 text-xs font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-ring" />
              <span>LIVE</span>
            </div>
            <div className="h-4 w-px bg-slate-700 hidden sm:block mr-2" />
            <input
              type="text"
              readOnly
              value={receiverUrl || "Initializing webhook inbox..."}
              className="flex-1 bg-transparent text-xs font-mono text-slate-200 outline-none select-all px-2 overflow-ellipsis"
              title="Your unique public webhook receiver URL"
            />
            <button
              onClick={copyUrl}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                copiedUrl
                  ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30"
                  : "bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
              }`}
              title="Copy receiver URL"
            >
              {copiedUrl ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy URL</span>
                </>
              )}
            </button>
            <button
              onClick={onOpenCurlModal}
              className="ml-1 p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
              title="View cURL command snippet"
            >
              <Terminal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Actions: Send Sample Webhook, New Inbox, Clear */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {/* Send Sample Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsSampleDropdownOpen(!isSampleDropdownOpen)}
              disabled={isSendingSample}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-semibold text-xs hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSendingSample ? "Sending..." : "Send Sample Webhook"}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {isSampleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-800 bg-[#0c1426] shadow-2xl py-1.5 z-50">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 tracking-wider uppercase border-b border-slate-800/60">
                  Select sample webhook
                </div>
                {SAMPLE_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => {
                      setIsSampleDropdownOpen(false);
                      onSendSample(tmpl.id);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800/80 hover:text-emerald-300 flex items-center justify-between transition cursor-pointer"
                  >
                    <span>{tmpl.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {tmpl.provider}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* New Inbox */}
          <button
            onClick={onCreateNewInbox}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/70 text-slate-200 text-xs font-medium hover:bg-slate-700 hover:text-white transition cursor-pointer"
            title="Create a fresh private inbox"
          >
            <Plus className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">New Inbox</span>
          </button>

          {/* Clear events */}
          {eventCount > 0 && (
            <button
              onClick={onClearEvents}
              className="p-1.5 rounded-lg border border-slate-800 hover:border-rose-800/60 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition cursor-pointer"
              title="Clear all events in this inbox"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
