"""Локальный просмотр сайта: python serve.py  ->  http://localhost:8000"""
import http.server, socketserver, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
with socketserver.TCPServer(("", 8000), http.server.SimpleHTTPRequestHandler) as s:
    print("Открой http://localhost:8000")
    s.serve_forever()
