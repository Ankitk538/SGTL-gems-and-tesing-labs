import http.server, socketserver, os
os.chdir(r'C:\Users\Lenovo\Documents\SGTL Project')
httpd = socketserver.TCPServer(('127.0.0.1', 9091), http.server.SimpleHTTPRequestHandler)
print('Serving on 9091')
httpd.serve_forever()
