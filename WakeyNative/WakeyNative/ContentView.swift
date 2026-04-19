import SwiftUI
import WebKit

struct ContentView: View {
    @StateObject private var nfcReader = NFCReader()

    var body: some View {
        WakeyWebView(nfcReader: nfcReader)
            .ignoresSafeArea()
    }
}

private struct WakeyWebView: UIViewRepresentable {
    @ObservedObject var nfcReader: NFCReader

    func makeCoordinator() -> Coordinator {
        Coordinator(nfcReader: nfcReader)
    }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.userContentController.add(context.coordinator, name: "startNFC")

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.isInspectable = true
        nfcReader.webView = webView

        if let url = URL(string: "https://joseassarmento.lovable.app") {
            webView.load(URLRequest(url: url))
        }
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    static func dismantleUIView(_ uiView: WKWebView, coordinator: Coordinator) {
        uiView.configuration.userContentController.removeScriptMessageHandler(forName: "startNFC")
    }

    final class Coordinator: NSObject, WKScriptMessageHandler {
        let nfcReader: NFCReader

        init(nfcReader: NFCReader) {
            self.nfcReader = nfcReader
        }

        func userContentController(
            _ userContentController: WKUserContentController,
            didReceive message: WKScriptMessage
        ) {
            guard message.name == "startNFC" else { return }
            nfcReader.startScan()
        }
    }
}
