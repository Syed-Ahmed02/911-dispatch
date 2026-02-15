"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Flame, HeartPulse, ShieldAlert, Timer, TrendingUp } from "lucide-react";
import { priorityTone, sortCalls, useDispatchData } from "./dispatch-provider";
import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  MapPopup,
  MarkerTooltip,
  type MapRef,
} from "@/components/ui/map";

function MetricCard({
  label,
  value,
  delta,
  tone,
}: {
  label: string;
  value: string;
  delta: string;
  tone: string;
}) {
  return (
    <article className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-1 ${tone}`} />
      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
      <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
        <TrendingUp className="h-3 w-3 text-slate-500" />
        {delta}
      </p>
    </article>
  );
}

function PriorityMap() {
  const { calls } = useDispatchData();
  const mapRef = useRef<MapRef | null>(null);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);

  const center = useMemo<[number, number]>(() => {
    if (calls.length === 0) return [-122.4039, 37.7893];

    const total = calls.reduce(
      (acc, call) => {
        acc.lat += call.latitude;
        acc.lng += call.longitude;
        return acc;
      },
      { lat: 0, lng: 0 }
    );

    return [total.lng / calls.length, total.lat / calls.length];
  }, [calls]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || calls.length === 0) return;

    if (calls.length === 1) {
      map.flyTo({
        center: [calls[0].longitude, calls[0].latitude],
        zoom: 13.5,
        duration: 500,
      });
      return;
    }

    const lats = calls.map((c) => c.latitude);
    const lngs = calls.map((c) => c.longitude);

    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      {
        padding: 56,
        maxZoom: 14,
        duration: 600,
      }
    );
  }, [calls]);

  const activeCall = calls.find((call) => call.id === activeCallId) ?? null;

  const markerTone = (priority: string) => {
    if (priority === "P1") return "bg-black";
    if (priority === "P2") return "bg-slate-700";
    if (priority === "P3") return "bg-slate-600";
    if (priority === "P4") return "bg-slate-500";
    return "bg-slate-400";
  };

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
        <h2 className="text-xs uppercase tracking-[0.16em] text-slate-700">Incident Heat Map</h2>
        <span className="text-xs text-slate-500">Priority Markers</span>
      </div>

      <div className="min-h-[22rem] overflow-hidden rounded-lg border border-slate-200 xl:flex-1">
        <Map
          ref={mapRef}
          theme="light"
          className="h-full w-full"
          center={center}
          zoom={12.4}
          maxZoom={17}
          minZoom={10}
        >
          {calls.map((call) => (
            <MapMarker
              key={call.id}
              longitude={call.longitude}
              latitude={call.latitude}
              onClick={() => setActiveCallId(call.id)}
            >
              <MarkerContent>
                <div
                  className={`h-5 w-5 rounded-full ring-2 ring-white shadow-[0_4px_14px_rgba(15,23,42,.35)] ${markerTone(call.priority)}`}
                />
              </MarkerContent>
              <MarkerTooltip className="border border-slate-200 bg-white text-slate-800 shadow">
                <p className="text-[11px] font-semibold">{call.priority}</p>
                <p className="text-[11px]">{call.emergencyType}</p>
                <p className="text-[11px] text-slate-500">{call.locationText}</p>
              </MarkerTooltip>
            </MapMarker>
          ))}

          {activeCall ? (
            <MapPopup
              longitude={activeCall.longitude}
              latitude={activeCall.latitude}
              onClose={() => setActiveCallId(null)}
              closeButton
              className="w-56 border border-slate-200 bg-white text-slate-800 shadow"
            >
              <p className="text-xs font-semibold text-slate-800">
                {activeCall.emergencyType} · {activeCall.priority}
              </p>
              <p className="mt-1 text-xs text-slate-600">{activeCall.locationText}</p>
              <p className="mt-1 text-xs text-slate-500">{activeCall.phoneNumber}</p>
            </MapPopup>
          ) : null}

          <MapControls
            position="top-right"
            showZoom
            showCompass
            showFullscreen
            className="[&_button]:text-slate-800 [&_button]:bg-white/95 [&_button:hover]:bg-slate-100 [&_.border-border]:border-slate-300 [&_button:not(:last-child)]:border-slate-300 [&_.bg-background]:bg-white/95"
          />
        </Map>
      </div>
    </section>
  );
}

function PulseRow({
  name,
  value,
  total,
  icon,
}: {
  name: string;
  value: number;
  total: number;
  icon: ReactNode;
}) {
  const width = Math.max((value / total) * 100, 8);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs text-slate-700">
        <span className="inline-flex items-center gap-2">
          {icon}
          {name}
        </span>
        <span className="font-semibold text-slate-900">{value}</span>
      </div>
      <div className="h-2 rounded bg-slate-200">
        <div className="h-2 rounded bg-slate-500" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function ChannelPulse() {
  const { callsByType } = useDispatchData();
  const total = callsByType.Medical + callsByType.Fire + callsByType.Police || 1;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="border-b border-slate-200 pb-3 text-xs uppercase tracking-[0.16em] text-slate-700">
        Channel Pulse
      </h2>

      <div className="mt-4 space-y-4">
        <PulseRow
          name="Medical"
          value={callsByType.Medical}
          total={total}
          icon={<HeartPulse className="h-3.5 w-3.5 text-slate-500" />}
        />
        <PulseRow
          name="Fire"
          value={callsByType.Fire}
          total={total}
          icon={<Flame className="h-3.5 w-3.5 text-slate-500" />}
        />
        <PulseRow
          name="Police"
          value={callsByType.Police}
          total={total}
          icon={<ShieldAlert className="h-3.5 w-3.5 text-slate-500" />}
        />
      </div>
    </section>
  );
}

function CallsByHourChart() {
  const { callsByHour } = useDispatchData();
  const maxCount = Math.max(...callsByHour.map((point) => point.count), 1);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="border-b border-slate-200 pb-3 text-xs uppercase tracking-[0.16em] text-slate-700">
        Traffic Volume
      </h2>
      <div className="mt-4 grid grid-cols-8 gap-2">
        {callsByHour.map((point) => (
          <div key={point.hour} className="flex flex-col items-center gap-2">
            <div className="flex h-24 w-full items-end rounded bg-slate-100 p-1">
              <div
                className="w-full rounded bg-slate-600"
                style={{ height: `${Math.max((point.count / maxCount) * 100, 6)}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500">{point.hour}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function RecentCalls() {
  const { calls } = useDispatchData();
  const visible = useMemo(() => sortCalls(calls).slice(0, 6), [calls]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="border-b border-slate-200 pb-3 text-xs uppercase tracking-[0.16em] text-slate-700">
        Active Incident Feed
      </h2>
      <div className="mt-4 space-y-3">
        {visible.map((call) => (
          <article
            key={call.id}
            className="flex min-h-16 items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 transition hover:border-slate-400"
          >
            <div>
              <p className="text-sm text-slate-900">{call.locationText}</p>
              <p className="text-xs text-slate-500">
                {call.emergencyType} • {call.phoneNumber}
              </p>
            </div>
            <span className={`rounded border px-2 py-1 text-xs font-semibold ${priorityTone(call.priority)}`}>
              {call.priority}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}

export function OverviewPage() {
  const { metrics } = useDispatchData();

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Total Calls Today"
          value={String(metrics.totalCallsToday)}
          delta="+8% from 1h ago"
          tone="bg-slate-400"
        />
        <MetricCard
          label="Ongoing Calls"
          value={String(metrics.ongoingCalls)}
          delta="Real-time queue"
          tone="bg-slate-500"
        />
        <MetricCard
          label="Dispatch Sent"
          value={String(metrics.dispatchSent)}
          delta="Units actively en route"
          tone="bg-slate-500"
        />
        <MetricCard
          label="Resolved Calls"
          value={String(metrics.resolvedCalls)}
          delta="Closed in this cycle"
          tone="bg-slate-400"
        />
        <MetricCard
          label="Average Dispatch Time"
          value={`${metrics.avgTimeToDispatchMins} min`}
          delta="Target: < 5 min"
          tone="bg-slate-500"
        />
        <MetricCard
          label="High Priority (P1/P2)"
          value={String(metrics.highPriorityCount)}
          delta="Monitor escalation risk"
          tone="bg-slate-600"
        />
      </section>

      <section className="w-full grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <PriorityMap />
        <div className="space-y-6">
          <ChannelPulse />
          <CallsByHourChart />
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">System Clock</p>
            <p className="mt-2 inline-flex items-center gap-2 text-2xl font-semibold text-slate-900">
              <Timer className="h-5 w-5 text-slate-600" />
              UTC-08 Operational Window
            </p>
            <p className="mt-2 text-xs text-slate-500">
              All events synchronized to call intake timestamps.
            </p>
          </div>
        </div>
      </section>

      <RecentCalls />
    </div>
  );
}
