import Combine
import CoreNFC
import WebKit

final class NFCReader: NSObject, ObservableObject {
    weak var webView: WKWebView?

    private var session: NFCNDEFReaderSession?

    func startScan() {
        guard NFCNDEFReaderSession.readingAvailable else {
            return
        }
        session = NFCNDEFReaderSession(
            delegate: self,
            queue: nil,
            invalidateAfterFirstRead: true
        )
        session?.alertMessage = "Hold your iPhone to the Sunny Pod"
        session?.beginSession()
    }
}

extension NFCReader: NFCNDEFReaderSessionDelegate {
    func readerSession(_ session: NFCNDEFReaderSession, didDetectNDEFs messages: [NFCNDEFMessage]) {
        DispatchQueue.main.async { [weak self] in
            self?.webView?.evaluateJavaScript("window.stopAlarm()", completionHandler: nil)
        }
    }

    func readerSession(_ session: NFCNDEFReaderSession, didInvalidateWithError _: Error) {
        // Expected invalidation after first NDEF read when `invalidateAfterFirstRead` is true.
    }
}
