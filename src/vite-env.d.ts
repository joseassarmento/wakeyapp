/// <reference types="vite/client" />

/** WKWebView `WKScriptMessageHandler` bridge used by the native Wakey shell. */
interface Window {
  stopAlarm?: () => void;
  webkit?: {
    messageHandlers?: {
      startNFC?: { postMessage: (body: unknown) => void };
    };
  };
}
