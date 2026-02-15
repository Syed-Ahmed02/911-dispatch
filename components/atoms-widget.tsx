"use client";

import { createElement } from "react";
import Script from "next/script";

const ASSISTANT_ID = process.env.ATOMS_AGENT_ID;
const WIDGET_SCRIPT =
  "https://unpkg.com/atoms-widget-core@latest/dist/embed/widget.umd.js";

export function AtomsWidget() {
  return (
    <>
      <Script src={WIDGET_SCRIPT} strategy="afterInteractive" />
      {createElement("atoms-widget", { "assistant-id": ASSISTANT_ID })}
    </>
  );
}
