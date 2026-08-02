import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HarmonyExplorer } from "../app/HarmonyExplorer";
import "../app/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HarmonyExplorer />
  </StrictMode>,
);
