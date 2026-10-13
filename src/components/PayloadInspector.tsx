"use client";

import React, { useState, useMemo } from "react";
import {
  Code,
  FileJson,
  AlignLeft,
  ListFilter,
  Terminal,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Sparkles,
  FileCode2,
} from "lucide-react";
import { WebhookEvent } from "@/lib/types";
import { CodeViewer } from "./CodeViewer";
import {
  generateTypeScript,
  generateZodSchema,
  generateNextRouteHandler,
  generateCurlSnippet,
} from "@/lib/type-generator";

interface PayloadInspectorProps {
  event: WebhookEvent | null;
  receiverUrl: string;
  onSendSample?: (templateId: string) => Promise<void>;
  isSendingSample?: boolean;
}

type TabType = "typescript" | "zod" | "json" | "raw" | "headers" | "replay";

export function PayloadInspector({
  event,
  receiverUrl,
  onSendSample,
  isSendingSample,
}: PayloadInspectorProps) {
  const [activeTab, setActiveTab] = useState<TabType>("typescript");
  const [includeNextHandler, setIncludeNextHandler] = useState(false);

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

  const defaultCurl = `curl -X POST "${receiverUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "event": "checkout.session.completed",
    "customer": {
      "id": "cus_12345",
      "email": "dev@example.com"
    },
    "amount_total": 4900,
    "currency": "usd"
  }'`;

  // Generate TypeScript code
  const tsCode = useMemo(() => {
    if (!event) return "";
    if (includeNextHandler) {
      return generateNextRouteHandler(event.body);
    }
    return generateTypeScript(event.body);
  }, [event, includeNextHandler]);

  // Generate Zod Schema
  const zodCode = useMemo(() => {
    if (!event) return "";
    return generateZodSchema(event.body);
  }, [event]);

  // Formatted JSON
  const jsonCode = useMemo(() => {
    if (!event) return "";
    try {
      if (typeof event.body === "object" && event.body !== null) {
        return JSON.stringify(event.body, null, 2);
      }
      return event.rawBody || JSON.stringify(event.body, null, 2);
    } catch {
      return event.rawBody || "";
    }
  }, [event]);

  // Headers JSON / display
  const headersCode = useMemo(() => {
    if (!event) return "";
    return JSON.stringify(event.headers, null, 2);
  }, [event]);

  // Replay cURL command
  const curlCode = useMemo(() => {
    if (!event) return "";
    return generateCurlSnippet(
      receiverUrl || `https://example.com${event.path}`,
      event.method,
      event.rawHeaders || event.headers,
      event.body
    );
  }, [event, receiverUrl]);

  if (!event) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#080d19] overflow-y-auto">
        <div className="max-w-xl w-full flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10 mb-4">
            <Terminal className="w-7 h-7 text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">
            Your Webhook Inbox is Listening
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md">
            Send an HTTP request from your terminal or external service, or click a sample webhook below to inspect the payload and generate typed code in real time.
          </p>

          <div className="w-full text-left mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Test with cURL</span>
              </span>
              <span className="text-[11px] text-slate-500">Paste in terminal</span>
            </div>
            <CodeViewer
              code={defaultCurl}
              language="bash"
              title="Sample cURL Request"
              badge="Terminal"
            />
          </div>

          {onSendSample && (
            <div className="w-full mt-6 pt-5 border-t border-slate-800/80">
              <span className="text-xs font-medium text-slate-400 block mb-3">
                Or trigger a sample webhook with one click:
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => onSendSample("stripe-checkout")}
                  disabled={isSendingSample}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 hover:text-white transition cursor-pointer disabled:opacity-50"
                >
                  ⚡ Stripe Checkout
                </button>
                <button
                  onClick={() => onSendSample("github-push")}
                  disabled={isSendingSample}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 hover:text-white transition cursor-pointer disabled:opacity-50"
                >
                  🐙 GitHub Push
                </button>
                <button
                  onClick={() => onSendSample("clerk-user")}
                  disabled={isSendingSample}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 hover:text-white transition cursor-pointer disabled:opacity-50"
                >
                  🔒 Clerk User
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#080d19] overflow-y-auto">
      {/* Top Banner: Selected Request Metadata */}
      <div className="p-4 border-b border-slate-800/80 bg-[#0c1426] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-md border uppercase tracking-wider ${getMethodBadgeClass(
              event.method
            )}`}
          >
            {event.method}
          </span>
          <span className="font-mono text-xs font-semibold text-slate-100">
            {event.path}
          </span>
          <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            200 OK
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
          <span className="hidden sm:inline text-slate-400">
            ID: <span className="text-slate-300">{event.id}</span>
          </span>
          <span>
            Size:{" "}
            <span className="text-slate-300">
              {(event.sizeBytes / 1024).toFixed(1)} KB
            </span>
          </span>
          <span>
            Time:{" "}
            <span className="text-slate-300">
              {new Date(event.timestamp).toLocaleTimeString()}
            </span>
          </span>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="px-4 border-b border-slate-800/80 bg-[#090f1d] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto py-2">
          {/* TypeScript Tab */}
          <button
            onClick={() => setActiveTab("typescript")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === "typescript"
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>TypeScript</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1 rounded font-bold">
              STAR
            </span>
          </button>

          {/* Zod Tab */}
          <button
            onClick={() => setActiveTab("zod")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === "zod"
                ? "bg-violet-500/15 text-violet-400 border border-violet-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Code className="w-3.5 h-3.5 text-violet-400" />
            <span>Zod Schema</span>
          </button>

          {/* Formatted JSON */}
          <button
            onClick={() => setActiveTab("json")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === "json"
                ? "bg-slate-800 text-slate-100 border border-slate-700 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <FileJson className="w-3.5 h-3.5 text-sky-400" />
            <span>Formatted JSON</span>
          </button>

          {/* Raw Body */}
          <button
            onClick={() => setActiveTab("raw")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === "raw"
                ? "bg-slate-800 text-slate-100 border border-slate-700 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>Raw Body</span>
          </button>

          {/* Headers */}
          <button
            onClick={() => setActiveTab("headers")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === "headers"
                ? "bg-slate-800 text-slate-100 border border-slate-700 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <ListFilter className="w-3.5 h-3.5 text-cyan-400" />
            <span>Headers ({Object.keys(event.headers).length})</span>
          </button>

          {/* cURL Replay */}
          <button
            onClick={() => setActiveTab("replay")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === "replay"
                ? "bg-slate-800 text-slate-100 border border-slate-700 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-rose-400" />
            <span>Replay cURL</span>
          </button>
        </div>

        {/* Sub-toggle for TypeScript tab: Next.js Handler Snippet */}
        {activeTab === "typescript" && (
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none py-1">
            <input
              type="checkbox"
              checked={includeNextHandler}
              onChange={(e) => setIncludeNextHandler(e.target.checked)}
              className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
            />
            <span className="flex items-center gap-1">
              <FileCode2 className="w-3.5 h-3.5 text-slate-400" />
              Include Next.js Route Handler
            </span>
          </label>
        )}
      </div>

      {/* Main Content Area */}
      <div className="p-4 flex-1">
        {activeTab === "typescript" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">
                Inferred strongly-typed TypeScript interfaces from your webhook payload.
              </p>
            </div>
            <CodeViewer
              code={tsCode}
              language="typescript"
              title="TypeScript Interfaces"
              badge="Generated Code"
              celebrateOnCopy={true}
            />
          </div>
        )}

        {activeTab === "zod" && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-slate-400">
              Ready-to-use Zod schema for runtime schema validation in your application.
            </p>
            <CodeViewer
              code={zodCode}
              language="zod"
              title="Zod Schema & Inferred Type"
              badge="Runtime Validator"
              celebrateOnCopy={true}
            />
          </div>
        )}

        {activeTab === "json" && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-slate-400">
              Formatted incoming JSON payload with syntax colorization.
            </p>
            <CodeViewer
              code={jsonCode}
              language="json"
              title="Incoming JSON"
              badge="application/json"
            />
          </div>
        )}

        {activeTab === "raw" && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-slate-400">
              Exact raw request body payload received over HTTP.
            </p>
            <div className="rounded-xl border border-slate-800 bg-[#090f1d] p-4 font-mono text-xs text-slate-200 overflow-x-auto whitespace-pre-wrap">
              {event.rawBody || "<Empty Body>"}
            </div>
          </div>
        )}

        {activeTab === "headers" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-300">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Sensitive headers (such as authorization, cookies, and secret tokens) are automatically redacted for security.
              </span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#090f1d] overflow-hidden shadow-lg">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0c1426] text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Header Key</th>
                    <th className="px-4 py-2.5 font-semibold">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {Object.entries(event.headers).map(([k, v]) => {
                    const isRedacted = v.includes("[REDACTED]");
                    return (
                      <tr key={k} className="hover:bg-slate-800/30">
                        <td className="px-4 py-2 text-sky-300 font-medium whitespace-nowrap">
                          {k}
                        </td>
                        <td className="px-4 py-2 text-slate-300 break-all">
                          {isRedacted ? (
                            <span className="flex items-center gap-1.5 text-amber-400">
                              <ShieldAlert className="w-3.5 h-3.5 text-amber-400 inline" />
                              {v}
                            </span>
                          ) : (
                            v
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-2">
              <CodeViewer
                code={headersCode}
                language="json"
                title="Headers JSON Object"
                badge="Headers"
              />
            </div>
          </div>
        )}

        {activeTab === "replay" && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-slate-400">
              Replay this incoming webhook locally or forward it to any development server using cURL.
            </p>
            <CodeViewer
              code={curlCode}
              language="bash"
              title="cURL Replay Command"
              badge="CLI Replay"
            />
          </div>
        )}
      </div>
    </div>
  );
}
