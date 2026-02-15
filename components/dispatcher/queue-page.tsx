"use client";

import { useMemo, useState } from "react";
import { MapPin, NotebookPen } from "lucide-react";
import {
  formatElapsed,
  priorityTone,
  sortCalls,
  statusLabel,
  statusTone,
  useDispatchData,
} from "./dispatch-provider";
import type { DispatchCall } from "./types";

type SortKey = "priority" | "elapsed" | "status";

function mapUrl(locationText: string, lat: number, lng: number): string {
  const query = encodeURIComponent(`${locationText} ${lat},${lng}`);
  return `https://maps.google.com/?q=${query}`;
}

function QueueTable() {
  const { calls, now, selectedCallId, selectCall } = useDispatchData();
  const [sortKey, setSortKey] = useState<SortKey>("priority");
  const [desc, setDesc] = useState(false);

  const rows = useMemo(() => {
    const sorted = sortCalls(calls);

    const sortedByKey = [...sorted].sort((a, b) => {
      if (sortKey === "elapsed") return now - a.startedAt - (now - b.startedAt);
      if (sortKey === "status") return statusLabel(a.status).localeCompare(statusLabel(b.status));
      return a.priority.localeCompare(b.priority);
    });

    return desc ? sortedByKey.reverse() : sortedByKey;
  }, [calls, now, sortKey, desc]);

  const selectSort = (next: SortKey) => {
    if (next === sortKey) {
      setDesc((value) => !value);
      return;
    }
    setSortKey(next);
    setDesc(false);
  };

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-xs uppercase tracking-[0.16em] text-slate-700">Current Queue</h2>
        <div className="mt-3 flex flex-wrap gap-2 md:hidden">
          <button
            onClick={() => selectSort("priority")}
            className="h-8 rounded border border-slate-200 bg-slate-50 px-2 text-[11px] uppercase tracking-[0.12em] text-slate-600 hover:border-slate-300 hover:text-slate-800"
          >
            Priority
          </button>
          <button
            onClick={() => selectSort("status")}
            className="h-8 rounded border border-slate-200 bg-slate-50 px-2 text-[11px] uppercase tracking-[0.12em] text-slate-600 hover:border-slate-300 hover:text-slate-800"
          >
            Status
          </button>
          <button
            onClick={() => selectSort("elapsed")}
            className="h-8 rounded border border-slate-200 bg-slate-50 px-2 text-[11px] uppercase tracking-[0.12em] text-slate-600 hover:border-slate-300 hover:text-slate-800"
          >
            Elapsed
          </button>
        </div>
      </div>

      <div className="space-y-3 p-3 md:hidden">
        {rows.map((call) => (
          <button
            key={call.id}
            type="button"
            onClick={() => selectCall(call.id)}
            className={`w-full rounded-lg border p-3 text-left transition ${
              selectedCallId === call.id
                ? "border-slate-400 bg-slate-100"
                : "border-slate-200 bg-slate-50 hover:border-slate-300"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-900">{call.phoneNumber}</p>
                <p className="mt-1 text-xs text-slate-500">{call.locationText}</p>
              </div>
              <span className={`rounded border px-2 py-1 text-[11px] font-semibold ${priorityTone(call.priority)}`}>
                {call.priority}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className={`rounded border px-2 py-1 ${statusTone(call.status)}`}>
                {statusLabel(call.status)}
              </span>
              <span className="font-mono text-slate-600">{formatElapsed(call.startedAt, now)}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-sm">
          <thead className="text-left text-[11px] uppercase tracking-[0.12em] text-slate-500">
            <tr>
              <th className="px-4 py-4">Phone Number</th>
              <th className="px-4 py-4">
                <button onClick={() => selectSort("priority")} className="h-8 rounded px-2 hover:bg-slate-100 hover:text-slate-800">
                  Priority
                </button>
              </th>
              <th className="px-4 py-4">
                <button onClick={() => selectSort("status")} className="h-8 rounded px-2 hover:bg-slate-100 hover:text-slate-800">
                  Status
                </button>
              </th>
              <th className="px-4 py-4">
                <button onClick={() => selectSort("elapsed")} className="h-8 rounded px-2 hover:bg-slate-100 hover:text-slate-800">
                  Elapsed
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((call) => (
              <tr
                key={call.id}
                className={`cursor-pointer border-t border-slate-200 transition hover:bg-slate-50 ${
                  selectedCallId === call.id ? "bg-slate-100" : ""
                }`}
                onClick={() => selectCall(call.id)}
              >
                <td className="px-4 py-4 text-slate-700">{call.phoneNumber}</td>
                <td className="px-4 py-4">
                  <span className={`rounded border px-2 py-1 text-xs font-semibold ${priorityTone(call.priority)}`}>
                    {call.priority}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className={`rounded border px-2 py-1 text-xs ${statusTone(call.status)}`}>
                    {statusLabel(call.status)}
                  </span>
                </td>
                <td className="px-4 py-4 font-mono text-slate-600">{formatElapsed(call.startedAt, now)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Transcript({ call }: { call: DispatchCall }) {
  if (call.transcript.length === 0) {
    return (
      <div className="rounded border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
        No transcript lines yet.
      </div>
    );
  }

  return (
    <div className="max-h-52 space-y-2 overflow-y-auto rounded border border-slate-200 bg-slate-50 p-3">
      {call.transcript.map((line) => (
        <div key={line.id} className="text-xs leading-relaxed">
          <span className={`mr-2 font-semibold ${line.speaker === "caller" ? "text-slate-700" : "text-slate-600"}`}>
            {line.speaker === "caller" ? "CALLER" : "DISPATCH"}
          </span>
          <span className="text-slate-700">{line.text}</span>
        </div>
      ))}
    </div>
  );
}

function DetailPanel() {
  const { calls, selectedCallId, updateCallStatus, updateCallNotes, now } = useDispatchData();
  const call = calls.find((item) => item.id === selectedCallId) ?? null;

  if (!call) {
    return (
      <aside className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
        Select a call to see details.
      </aside>
    );
  }

  return (
    <aside className="space-y-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{call.callerName}</h3>
          <p className="text-xs text-slate-500">{call.phoneNumber}</p>
        </div>
        <span className={`rounded border px-2 py-1 text-xs font-semibold ${priorityTone(call.priority)}`}>
          {call.priority}
        </span>
      </div>

      <div className="grid gap-3 border-t border-slate-200 pt-4 text-sm">
        <p className="text-slate-700">{call.locationText}</p>
        <a
          href={mapUrl(call.locationText, call.latitude, call.longitude)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-slate-700 underline"
        >
          <MapPin className="h-3.5 w-3.5" />
          Open map link
        </a>
        <p className="text-slate-500">Type: {call.emergencyType}</p>
        <p className="text-slate-500">Elapsed: {formatElapsed(call.startedAt, now)}</p>
      </div>

      <div className="border-t border-slate-200 pt-4">
        <p className="mb-2 text-xs uppercase tracking-[0.14em] text-slate-500">Extracted Information</p>
        <div className="flex flex-wrap gap-2">
          {call.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-slate-300 bg-slate-50 px-2 py-1 text-xs text-slate-700">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-3 border-t border-slate-200 pt-4 text-sm sm:grid-cols-2">
        <div className="rounded border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Urgency Score</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{call.urgencyScore}</p>
        </div>
        <div className="rounded border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Confidence</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{Math.round(call.confidence * 100)}%</p>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-4">
        <p className="mb-2 text-xs uppercase tracking-[0.14em] text-slate-500">Live Transcript</p>
        <Transcript call={call} />
      </div>

      <div className="flex gap-2 border-t border-slate-200 pt-4">
        <button
          className="h-10 rounded border border-emerald-200 bg-emerald-50 px-3 text-sm text-emerald-700 hover:bg-emerald-100"
          onClick={() => updateCallStatus(call.id, "dispatch_sent")}
        >
          Dispatch Sent
        </button>
        <button
          className="h-10 rounded border border-slate-300 bg-slate-100 px-3 text-sm text-slate-700 hover:bg-slate-200"
          onClick={() => updateCallStatus(call.id, "resolved")}
        >
          Resolved
        </button>
      </div>

      <div className="border-t border-slate-200 pt-4">
        <label htmlFor="notes" className="mb-2 inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-slate-500">
          <NotebookPen className="h-3.5 w-3.5" />
          Notes
        </label>
        <textarea
          id="notes"
          value={call.notes}
          onChange={(event) => updateCallNotes(call.id, event.target.value)}
          className="h-24 w-full rounded border border-slate-300 bg-slate-50 p-2 text-sm text-slate-800 outline-none ring-offset-0 focus:border-slate-500"
          placeholder="Dispatcher notes..."
        />
      </div>
    </aside>
  );
}

export function QueuePage() {
  return (
    <div className="w-full grid gap-6 xl:grid-cols-[1.6fr_1fr]">
      <QueueTable />
      <DetailPanel />
    </div>
  );
}
