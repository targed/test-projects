import socket
import ssl

HOST = 'localhost'
PORT = 8443
CERTFILE = 'cert.pem'

def main():
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    context.load_verify_locations(cafile=CERTFILE)
    context.minimum_version = ssl.TLSVersion.TLSv1_2
    context.maximum_version = ssl.TLSVersion.TLSv1_2
    # Force RSA key exchange by selecting a cipher suite that uses RSA for key exchange.
    context.set_ciphers('AES256-SHA')
    # The self-signed certificate does not have a subject alternative name,
    # so we need to disable hostname checking.
    context.check_hostname = False
    context.verify_mode = ssl.CERT_REQUIRED


    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        with context.wrap_socket(sock, server_hostname=HOST) as ssock:
            ssock.connect((HOST, PORT))
            print(f"Connected to server: {HOST}:{PORT}")
            print(f"Protocol version: {ssock.version()}")
            print(f"Cipher used: {ssock.cipher()}")

            # Send data to the server
            ssock.sendall(b"Hello from RSA client!")

            # Receive data from the server
            data = ssock.recv(1024)
            print(f"Received from server: {data.decode()}")

if __name__ == '__main__':
    main()
