"use client";

import React, { useState } from "react";
import { Search, Radio, Send, Clock, Database } from "lucide-react";
import { WebhookEvent } from "@/lib/types";

interface RequestListProps {
  events: WebhookEvent[];
  selectedEventId: string | null;
  onSelectEvent: (eventId: string) => void;
  onSendSample: (templateId: string) => Promise<void>;
  isSendingSample: boolean;
}

export function RequestList({
  events,
  selectedEventId,
  onSelectEvent,
  onSendSample,
  isSendingSample,
}: RequestListProps) {
  const [filterMethod, setFilterMethod] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffSec < 5) return "just now";
      if (diffSec < 60) return `${diffSec}s ago`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return isoString;
    }
  };

  const formatExactTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const getMethodBadgeClass = (method: string) => {
    switch (method.toUpperCase()) {
      case "POST":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "GET":
        return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
      case "PUT":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "PATCH":
        return "bg-purple-500/15 text-purple-400 border-purple-500/30";
      case "DELETE":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      default:
        return "bg-slate-700/40 text-slate-300 border-slate-600";
    }
  };

  const filteredEvents = events.filter((ev) => {
    const matchesMethod =
      filterMethod === "ALL" || ev.method.toUpperCase() === filterMethod;
    if (!matchesMethod) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      ev.id.toLowerCase().includes(q) ||
      ev.path.toLowerCase().includes(q) ||
      (typeof ev.rawBody === "string" && ev.rawBody.toLowerCase().includes(q))
    );
  });

  return (
    <div className="w-full lg:w-96 flex flex-col border-r border-slate-800/80 bg-[#090f1d] shrink-0 h-full">
      {/* Header with count and live indicator */}
      <div className="p-3.5 border-b border-slate-800/80 bg-[#0b1222] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs text-slate-200">Requests</span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
            {events.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
          <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
          <span>Polling 1.5s</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 border-b border-slate-800/60 flex flex-col gap-2 bg-[#080d19]/60">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Filter requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0d162a] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500/50 transition"
          />
        </div>

        {/* Method filter pills */}
        <div className="flex items-center gap-1 overflow-x-auto text-[11px] py-0.5">
          {["ALL", "POST", "GET", "PUT", "DELETE"].map((m) => (
            <button
              key={m}
              onClick={() => setFilterMethod(m)}
              className={`px-2.5 py-0.5 rounded-md font-semibold transition cursor-pointer ${
                filterMethod === m
                  ? "bg-slate-700 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Request Items List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 flex flex-col">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-2.5 text-slate-500 my-auto">
            <div className="w-10 h-10 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-center text-slate-400">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <p className="font-semibold text-xs text-slate-300">
                Waiting for incoming events
              </p>
              <p className="text-[11px] text-slate-500 max-w-[180px] mt-0.5">
                HTTP requests sent to this inbox will stream here live.
              </p>
            </div>
          </div>
        ) : (
          filteredEvents.map((ev) => {
            const isSelected = ev.id === selectedEventId;
            return (
              <div
                key={ev.id}
                onClick={() => onSelectEvent(ev.id)}
                className={`p-3.5 transition-all cursor-pointer select-none ${
                  isSelected
                    ? "bg-[#0f1b34] border-l-4 border-l-emerald-400 shadow-inner"
                    : "hover:bg-[#0c1426] border-l-4 border-l-transparent"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getMethodBadgeClass(
                        ev.method
                      )}`}
                    >
                      {ev.method}
                    </span>
                    <span className="text-xs font-mono font-medium text-slate-200 truncate max-w-[150px]">
                      {ev.path}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400">
                    {formatRelativeTime(ev.timestamp)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span className="truncate max-w-[170px]" title={ev.id}>
                    {ev.id}
                  </span>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span>{(ev.sizeBytes / 1024).toFixed(1)} KB</span>
                    <span className="flex items-center gap-0.5 text-slate-400">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {formatExactTime(ev.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
