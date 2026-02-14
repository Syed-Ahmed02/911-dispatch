"use client";

import { createElement } from "react";
import Script from "next/script";

const ASSISTANT_ID = "698ffa52e177f8cb90f4115b";
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
