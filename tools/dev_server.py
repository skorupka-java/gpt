"""Lokalny serwer statyczny z adresami /oferta i /kontakt jak na Netlify."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit


class Handler(SimpleHTTPRequestHandler):
    def send_head(self):
        url = urlsplit(self.path)
        if not url.path.endswith('/') and not Path(url.path).suffix:
            candidate = self.translate_path(url.path) + '.html'
            if Path(candidate).is_file():
                self.path = urlunsplit(('', '', url.path + '.html', url.query, ''))
        return super().send_head()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=4173)
    args = parser.parse_args()
    root = Path(__file__).resolve().parent.parent
    server = ThreadingHTTPServer(('127.0.0.1', args.port), partial(Handler, directory=str(root)))
    print(f'Serving {root} on port {args.port}', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
