# Network Access Setup Guide

## Overview
This Docker setup is now configured to be accessible from any device on your local network.

## Configuration Steps

### 1. Find Your Machine's IP Address

**Windows PowerShell:**
```powershell
ipconfig | Select-String "IPv4"
```

**Example Output:**
```
IPv4 Address. . . . . . . . . . . : 192.168.1.100
```

### 2. Update Your .env File

Edit your `.env` file and update these variables with your machine's IP address:

```env
NEXTAUTH_URL="http://192.168.1.100:3000"
NEXT_PUBLIC_BASE_URL="http://192.168.1.100:3000"
```

Replace `192.168.1.100` with your actual IP address.

### 3. Start Docker Services

```powershell
docker compose up -d
```

Or rebuild if you've made changes:

```powershell
docker compose up -d --build
```

### 4. Access from Other Devices

The application will be accessible from any device on your network at:
```
http://YOUR_MACHINE_IP:3000
```

Example:
```
http://192.168.1.100:3000
```

## Firewall Configuration

### Windows Firewall
You may need to allow incoming connections on port 3000:

1. Open Windows Defender Firewall with Advanced Security
2. Click "Inbound Rules"
3. Click "New Rule"
4. Select "Port" and click Next
5. Select TCP and enter port 3000
6. Allow the connection
7. Apply to all profiles (Domain, Private, Public)
8. Name it "BISU Payroll System"

**Or use PowerShell (Run as Administrator):**
```powershell
New-NetFirewallRule -DisplayName "BISU Payroll System" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

## Docker Configuration Details

### Port Binding
- Port 3000 is bound to `0.0.0.0:3000` (all network interfaces)
- Accessible from localhost, LAN, and WAN (if properly routed)

### Next.js Server
- Configured to listen on `0.0.0.0` (all interfaces)
- HOSTNAME environment variable set to `0.0.0.0`

### CORS Headers
- Configured to allow cross-origin requests
- Useful for API access from different domains

## Troubleshooting

### Cannot Access from Other Devices

1. **Check Firewall:** Ensure port 3000 is allowed through Windows Firewall
2. **Verify Docker is Running:**
   ```powershell
   docker compose ps
   ```
3. **Check IP Address:** Ensure you're using the correct IP address
4. **Test Locally First:** Access `http://localhost:3000` on the host machine
5. **Ping Test:** From another device, ping your server's IP
   ```
   ping 192.168.1.100
   ```

### Authentication Issues

If you experience login problems after changing the URL:
1. Clear browser cookies and cache
2. Ensure `NEXTAUTH_URL` and `NEXT_PUBLIC_BASE_URL` match the URL you're using
3. Restart the Docker container after changing .env:
   ```powershell
   docker compose restart
   ```

### Database Connection Issues

If the database URL uses `localhost`, you may need to update it to use the host's IP or hostname:
```env
DATABASE_URL="postgresql://username:password@host.docker.internal:5432/bisu_payroll?schema=public"
```

## Security Considerations

### Production Deployment
- Use HTTPS for production
- Configure proper firewall rules
- Use strong, unique secrets in .env
- Consider using a reverse proxy (nginx, Caddy)
- Restrict access to trusted networks only

### Development/Testing
- Only expose on trusted networks (home/office LAN)
- Don't expose to the public internet without proper security
- Use strong passwords for database and admin accounts

## Using a Static IP (Recommended)

For consistent access, configure a static IP address for your server machine:

### Windows - Set Static IP
1. Open Settings → Network & Internet → Ethernet (or Wi-Fi)
2. Click "Edit" next to IP assignment
3. Choose "Manual" and enable IPv4
4. Enter your desired IP address (e.g., 192.168.1.100)
5. Set subnet mask (usually 255.255.255.0)
6. Set default gateway (usually your router IP, e.g., 192.168.1.1)
7. Set DNS servers (use your router or 8.8.8.8)

## Advanced: Using Hostname Instead of IP

You can also access using your computer's hostname:

1. Find your hostname:
   ```powershell
   hostname
   ```

2. Update .env:
   ```env
   NEXTAUTH_URL="http://YOUR-HOSTNAME:3000"
   NEXT_PUBLIC_BASE_URL="http://YOUR-HOSTNAME:3000"
   ```

3. Access from other devices:
   ```
   http://YOUR-HOSTNAME:3000
   ```

**Note:** This requires proper DNS resolution on your network (usually works on Windows networks with NetBIOS/mDNS).
