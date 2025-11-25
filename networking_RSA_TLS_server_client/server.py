import socket
import ssl

HOST = 'localhost'
PORT = 8443
CERTFILE = 'cert.pem'
KEYFILE = 'key.pem'

def main():
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(certfile=CERTFILE, keyfile=KEYFILE)
    context.minimum_version = ssl.TLSVersion.TLSv1_2
    context.maximum_version = ssl.TLSVersion.TLSv1_2
    # Force RSA key exchange by selecting a cipher suite that uses RSA for key exchange.
    context.set_ciphers('AES256-SHA')

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind((HOST, PORT))
        sock.listen(5)
        print(f"Server listening on {HOST}:{PORT}")

        with context.wrap_socket(sock, server_side=True) as ssock:
            while True:
                conn, addr = ssock.accept()
                with conn:
                    print(f"Connected by {addr}")
                    try:
                        while True:
                            data = conn.recv(1024)
                            if not data:
                                break
                            print(f"Received from client: {data.decode()}")
                            conn.sendall(b"Hello from RSA server!")
                    except ssl.SSLError as e:
                        print(f"SSL Error: {e}")
                    finally:
                        print(f"Connection from {addr} closed.")


if __name__ == '__main__':
    main()
