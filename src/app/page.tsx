"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Header } from "@/components/Header";
import { InboxSidebar } from "@/components/InboxSidebar";
import { RequestList } from "@/components/RequestList";
import { PayloadInspector } from "@/components/PayloadInspector";
import { CurlModal } from "@/components/CurlModal";
import { WebhookEvent } from "@/lib/types";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [inboxId, setInboxId] = useState<string>("");
  const [ownerToken, setOwnerToken] = useState<string>("");
  const [receiverUrl, setReceiverUrl] = useState<string>("");
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSendingSample, setIsSendingSample] = useState<boolean>(false);
  const [isCurlModalOpen, setIsCurlModalOpen] = useState<boolean>(false);

  const prevEventCountRef = useRef<number>(0);

  // Create a brand new inbox
  const createNewInbox = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/inboxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Primary Webhook Inbox" }),
      });

      if (!res.ok) throw new Error("Failed to create inbox");

      const data = await res.json();
      setInboxId(data.id);
      setOwnerToken(data.ownerToken);
      setReceiverUrl(data.receiverUrl);
      setEvents([]);
      setSelectedEventId(null);
      prevEventCountRef.current = 0;

      // Persist in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("payloadpeek_inbox_id", data.id);
        localStorage.setItem("payloadpeek_owner_token", data.ownerToken);
        localStorage.setItem("payloadpeek_receiver_url", data.receiverUrl);
      }
    } catch (err) {
      console.error("Inbox creation error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize inbox on load
  useEffect(() => {
    async function init() {
      if (typeof window === "undefined") return;

      const savedId = localStorage.getItem("payloadpeek_inbox_id");
      const savedToken = localStorage.getItem("payloadpeek_owner_token");
      const savedUrl = localStorage.getItem("payloadpeek_receiver_url");

      if (savedId && savedToken) {
        try {
          const res = await fetch(
            `/api/inboxes/${savedId}?token=${encodeURIComponent(savedToken)}`
          );
          if (res.ok) {
            const data = await res.json();
            setInboxId(data.inbox.id);
            setOwnerToken(savedToken);
            setReceiverUrl(data.inbox.receiverUrl || savedUrl || "");
            setIsLoading(false);
            return;
          }
        } catch {
          // If verification fails, fall back to creating a new one
        }
      }

      await createNewInbox();
    }

    init();
  }, [createNewInbox]);

  // Fetch events for active inbox
  const fetchEvents = useCallback(async () => {
    if (!inboxId || !ownerToken) return;

    try {
      const res = await fetch(
        `/api/inboxes/${inboxId}/events?token=${encodeURIComponent(ownerToken)}`
      );
      if (res.ok) {
        const data = await res.json();
        const incomingEvents: WebhookEvent[] = data.events || [];

        setEvents(incomingEvents);

        // Auto-select newest event if nothing selected or new arrived
        if (incomingEvents.length > 0) {
          if (!selectedEventId || prevEventCountRef.current === 0) {
            setSelectedEventId(incomingEvents[0].id);
          } else if (incomingEvents.length > prevEventCountRef.current) {
            // New event arrived! Select it
            setSelectedEventId(incomingEvents[0].id);
          }
        }

        prevEventCountRef.current = incomingEvents.length;
      }
    } catch (err) {
      console.warn("Polling error:", err);
    }
  }, [inboxId, ownerToken, selectedEventId]);

  // Real-time polling every 1500ms
  useEffect(() => {
    if (!inboxId || !ownerToken) return;

    fetchEvents();
    const interval = setInterval(fetchEvents, 1500);
    return () => clearInterval(interval);
  }, [inboxId, ownerToken, fetchEvents]);

  // Send sample event
  const handleSendSample = async (templateId: string) => {
    if (!inboxId || !ownerToken) return;

    try {
      setIsSendingSample(true);
      const res = await fetch(
        `/api/inboxes/${inboxId}/sample?token=${encodeURIComponent(ownerToken)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templateId }),
        }
      );

      if (res.ok) {
        // Immediate fetch to show the new event
        await fetchEvents();
      }
    } catch (err) {
      console.error("Failed to send sample:", err);
    } finally {
      setIsSendingSample(false);
    }
  };

  // Clear events
  const handleClearEvents = async () => {
    if (!inboxId || !ownerToken) return;
    try {
      const res = await fetch(
        `/api/inboxes/${inboxId}/events?token=${encodeURIComponent(ownerToken)}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setEvents([]);
        setSelectedEventId(null);
        prevEventCountRef.current = 0;
      }
    } catch (err) {
      console.error("Failed to clear events:", err);
    }
  };

  // Find currently selected event
  const selectedEvent =
    events.find((ev) => ev.id === selectedEventId) || events[0] || null;

  if (isLoading) {
    return (
      <div className="flex-1 min-h-screen flex flex-col items-center justify-center bg-[#080d19] text-slate-300">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
        <p className="text-sm font-medium">Preparing your live webhook inbox...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#080d19] text-slate-100">
      {/* Top Navigation */}
      <Header
        receiverUrl={receiverUrl}
        inboxId={inboxId}
        eventCount={events.length}
        onSendSample={handleSendSample}
        onCreateNewInbox={createNewInbox}
        onClearEvents={handleClearEvents}
        onOpenCurlModal={() => setIsCurlModalOpen(true)}
        isSendingSample={isSendingSample}
      />

      {/* Main 3-Pane Body */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Pane 1: Left Inbox & Controls Sidebar */}
        <InboxSidebar
          inboxId={inboxId}
          receiverUrl={receiverUrl}
          eventCount={events.length}
          onSendSample={handleSendSample}
          isSendingSample={isSendingSample}
        />

        {/* Pane 2: Middle Incoming Requests Stream */}
        <RequestList
          events={events}
          selectedEventId={selectedEventId}
          onSelectEvent={setSelectedEventId}
          onSendSample={handleSendSample}
          isSendingSample={isSendingSample}
        />

        {/* Pane 3: Right Payload & TypeScript Generator Explorer */}
        <PayloadInspector
          event={selectedEvent}
          receiverUrl={receiverUrl}
        />
      </main>

      {/* cURL Command Helper Modal */}
      <CurlModal
        isOpen={isCurlModalOpen}
        onClose={() => setIsCurlModalOpen(false)}
        receiverUrl={receiverUrl}
      />
    </div>
  );
}
