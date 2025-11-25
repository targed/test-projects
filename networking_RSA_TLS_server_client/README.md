Start the server: Open a terminal and run the following command:

```
python3 server.py
```

The server will start and print Server listening on localhost:8443.

Run the client: Open another terminal (while the server is still running) and run this command:

```
python3 client.py
```

Observe the output:

In the client's terminal, you will see output confirming the connection, the TLS protocol version, the cipher suite used, and the message received from the server.
In the server's terminal, you will see a message indicating a new connection and the data it received from the client.
The cert.pem and key.pem files must be in the same directory as the scripts for them to work correctly. To stop the server, you can press Ctrl+C in its terminal.