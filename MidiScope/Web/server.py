import http.server
import os
import socket
import sys

PORT = 8001
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, format, *args):
        super().log_message(format, *args)
        sys.stdout.flush()

# Comprehensive MIME mappings for sheet music files, audio, and web assets
NoCacheHandler.extensions_map.update({
    '.mxl': 'application/vnd.recordare.musicxml',
    '.musicxml': 'application/vnd.recordare.musicxml+xml',
    '.xml': 'application/xml',
    '.mid': 'audio/midi',
    '.midi': 'audio/midi',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.html': 'text/html',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf',
})

class DualStackServer(http.server.ThreadingHTTPServer):
    # Keep allow_reuse_address False on Windows to prevent duplicate processes
    # from hijacking the port and corrupting TCP connections.
    allow_reuse_address = False
    daemon_threads = True

    def __init__(self, server_address, RequestHandlerClass):
        # Try dual-stack IPv6 (handles IPv4 mapped connections on modern Windows)
        try:
            self.address_family = socket.AF_INET6
            super().__init__(server_address, RequestHandlerClass)
        except Exception:
            self.address_family = socket.AF_INET
            super().__init__(server_address, RequestHandlerClass)

    def server_bind(self):
        if self.address_family == socket.AF_INET6:
            try:
                self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
            except Exception:
                pass
        super().server_bind()

if __name__ == '__main__':
    os.chdir(BASE_DIR)
    httpd = None

    try:
        httpd = DualStackServer(("", PORT), NoCacheHandler)
    except Exception as e:
        try:
            http.server.ThreadingHTTPServer.allow_reuse_address = False
            httpd = http.server.ThreadingHTTPServer(("0.0.0.0", PORT), NoCacheHandler)
        except OSError as err:
            print(f"Error starting server on port {PORT}: {err}")
            print(f"Port {PORT} may already be in use by another instance.")
            sys.exit(1)

    print(f"========================================================")
    print(f" MidiSheet Web Server is running!")
    print(f"   URL: http://localhost:{PORT}/")
    print(f"   URL: http://127.0.0.1:{PORT}/")
    print(f" Serving directory: {BASE_DIR}")
    print(f"========================================================")
    sys.stdout.flush()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping MidiSheet server...")
    finally:
        if httpd:
            httpd.server_close()
