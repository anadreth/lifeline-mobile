#!/bin/bash

# Generate SSL certificates for PostgreSQL
echo "Generating SSL certificates for PostgreSQL..."

# Create CA private key
openssl genrsa -out ca-key.pem 2048

# Create CA certificate
openssl req -new -x509 -nodes -days 365000 -key ca-key.pem -out ca-cert.pem -subj "/CN=PostgreSQL-CA"

# Create server private key
openssl genrsa -out server.key 2048

# Create server certificate signing request
openssl req -new -key server.key -out server.csr -subj "/CN=postgres"

# Create server certificate signed by CA
openssl x509 -req -in server.csr -CA ca-cert.pem -CAkey ca-key.pem -out server.crt -days 365000 -CAcreateserial

# Set permissions
chmod 600 server.key
chmod 644 server.crt ca-cert.pem

# Clean up
rm server.csr ca-key.pem ca-cert.srl

echo "SSL certificates generated successfully!"
echo "Files created:"
echo "  - ca-cert.pem (CA certificate)"
echo "  - server.crt (Server certificate)"
echo "  - server.key (Server private key)"