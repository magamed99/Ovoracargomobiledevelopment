import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import { initSentry } from "./app/config/sentry";
import { installStaleChunkHandler } from "./app/utils/staleChunkRecovery";

initSentry();
installStaleChunkHandler();

createRoot(document.getElementById("root")!).render(<App />);
