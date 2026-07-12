# xyz-minecraft-panel 🎮✨

A premium, ultra-lightweight, and secure **Minecraft Web Control Panel & SFTP Sidecar** architecture designed for Kubernetes (K3s). 

It features real-time log streaming (SSE), a file explorer with drag-and-drop uploads, an in-browser code editor, RCON console execution, SLP status polling, and state-loop wrapper controls to safely stop, start, and restart your server without bringing down the sidecars.

<div align="center">
  <br />
  <!-- Inline SVG Architecture Diagram -->
  <svg width="800" height="480" viewBox="0 0 800 480" fill="none" xmlns="http://www.w3.org/2000/svg" style="background:#06050f; border-radius:16px; border:1px solid rgba(255,255,255,0.08); box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
    <defs>
      <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#a78bfa" />
        <stop offset="100%" stop-color="#8b5cf6" />
      </linearGradient>
      <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#22d3ee" />
        <stop offset="100%" stop-color="#06b6d4" />
      </linearGradient>
      <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#4ade80" />
        <stop offset="100%" stop-color="#22c55e" />
      </linearGradient>
      <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fbbf24" />
        <stop offset="100%" stop-color="#d97706" />
      </linearGradient>
      <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    <!-- Background Grid -->
    <path d="M 0,40 L 800,40 M 0,80 L 800,80 M 0,120 L 800,120 M 0,160 L 800,160 M 0,200 L 800,200 M 0,240 L 800,240 M 0,280 L 800,280 M 0,320 L 800,320 M 0,360 L 800,360 M 0,400 L 800,400 M 0,440 L 800,440" stroke="rgba(255,255,255,0.015)" stroke-width="1" />
    <path d="M 40,0 L 40,480 M 80,0 L 80,480 M 120,0 L 120,480 M 160,0 L 160,480 M 200,0 L 200,480 M 240,0 L 240,480 M 280,0 L 280,480 M 320,0 L 320,480 M 360,0 L 360,480 M 400,0 L 400,480 M 440,0 L 440,480 M 480,0 L 480,480 M 520,0 L 520,480 M 560,0 L 560,480 M 600,0 L 600,480 M 640,0 L 640,480 M 680,0 L 680,480 M 720,0 L 720,480 M 760,0 L 760,480" stroke="rgba(255,255,255,0.015)" stroke-width="1" />

    <!-- External Users / Clients -->
    <g transform="translate(30, 70)">
      <rect x="0" y="0" width="120" height="310" rx="12" fill="rgba(255, 255, 255, 0.02)" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1" />
      <text x="60" y="25" fill="#94a3b8" font-size="12" font-family="'Inter', sans-serif" font-weight="600" text-anchor="middle">CLIENTS</text>
      
      <!-- HTTP Web -->
      <g transform="translate(15, 45)">
        <rect width="90" height="60" rx="8" fill="rgba(139, 92, 246, 0.1)" stroke="url(#purpleGrad)" stroke-width="1.5" />
        <text x="45" y="28" fill="white" font-size="11" font-family="'Inter', sans-serif" font-weight="bold" text-anchor="middle">Web Browser</text>
        <text x="45" y="44" fill="#a78bfa" font-size="9" font-family="'Fira Code', monospace" text-anchor="middle">Port 80/443</text>
      </g>
      <!-- SFTP -->
      <g transform="translate(15, 125)">
        <rect width="90" height="60" rx="8" fill="rgba(6, 182, 212, 0.1)" stroke="url(#cyanGrad)" stroke-width="1.5" />
        <text x="45" y="28" fill="white" font-size="11" font-family="'Inter', sans-serif" font-weight="bold" text-anchor="middle">SFTP Client</text>
        <text x="45" y="44" fill="#22d3ee" font-size="9" font-family="'Fira Code', monospace" text-anchor="middle">Port 2222</text>
      </g>
      <!-- Game -->
      <g transform="translate(15, 205)">
        <rect width="90" height="60" rx="8" fill="rgba(34, 197, 94, 0.1)" stroke="url(#greenGrad)" stroke-width="1.5" />
        <text x="45" y="28" fill="white" font-size="11" font-family="'Inter', sans-serif" font-weight="bold" text-anchor="middle">Minecraft</text>
        <text x="45" y="44" fill="#4ade80" font-size="9" font-family="'Fira Code', monospace" text-anchor="middle">Port 25565</text>
      </g>
    </g>

    <!-- Cloudflare Edge / Tunnel -->
    <g transform="translate(190, 150)">
      <rect width="110" height="150" rx="16" fill="rgba(217, 119, 6, 0.08)" stroke="url(#orangeGrad)" stroke-width="2" filter="url(#neonGlow)" />
      <text x="55" y="30" fill="white" font-size="13" font-family="'Inter', sans-serif" font-weight="bold" text-anchor="middle">Cloudflare</text>
      <text x="55" y="48" fill="#fbbf24" font-size="10" font-family="'Inter', sans-serif" font-weight="600" text-anchor="middle">Tunnel</text>
      
      <!-- Ingress Logic Representation -->
      <rect x="10" y="70" width="90" height="65" rx="6" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.06)" />
      <text x="55" y="88" fill="#94a3b8" font-size="8" font-family="'Fira Code', monospace" text-anchor="middle">mc-panel.xyz ➔ 8080</text>
      <text x="55" y="103" fill="#94a3b8" font-size="8" font-family="'Fira Code', monospace" text-anchor="middle">mc-sftp.xyz ➔ 2222</text>
      <text x="55" y="118" fill="#94a3b8" font-size="8" font-family="'Fira Code', monospace" text-anchor="middle">game-direct ➔ 25565</text>
    </g>

    <!-- Kubernetes Pod Boundary -->
    <g transform="translate(340, 40)">
      <!-- Pod Outer Box -->
      <rect width="430" height="370" rx="20" fill="rgba(255, 255, 255, 0.01)" stroke="rgba(255, 255, 255, 0.15)" stroke-width="2" stroke-dasharray="8 4" />
      <text x="20" y="25" fill="#f8fafc" font-size="13" font-family="'Inter', sans-serif" font-weight="800">KUBERNETES POD (minecraft-server)</text>
      <rect x="330" y="12" width="85" height="18" rx="4" fill="rgba(139, 92, 246, 0.15)" stroke="url(#purpleGrad)" stroke-width="0.8" />
      <text x="372" y="24" fill="#a78bfa" font-size="9" font-family="'Fira Code', monospace" font-weight="bold" text-anchor="middle">Shared PID: true</text>

      <!-- Container 1: Control Panel -->
      <g transform="translate(20, 45)">
        <rect width="210" height="85" rx="10" fill="rgba(139, 92, 246, 0.05)" stroke="url(#purpleGrad)" stroke-width="1.5" />
        <text x="15" y="25" fill="white" font-size="12" font-family="'Inter', sans-serif" font-weight="bold">control-panel (Node.js)</text>
        <text x="15" y="45" fill="#94a3b8" font-size="10" font-family="'Inter', sans-serif">Web SPA Explorer & Console</text>
        <!-- Port Badge -->
        <rect x="15" y="58" width="55" height="16" rx="4" fill="rgba(139, 92, 246, 0.2)" />
        <text x="42" y="70" fill="white" font-size="9" font-family="'Fira Code', monospace" font-weight="bold" text-anchor="middle">8080/TCP</text>
      </g>

      <!-- Container 2: Minecraft (Java) -->
      <g transform="translate(20, 150)">
        <rect width="210" height="115" rx="10" fill="rgba(34, 197, 94, 0.05)" stroke="url(#greenGrad)" stroke-width="1.5" />
        <text x="15" y="25" fill="white" font-size="12" font-family="'Inter', sans-serif" font-weight="bold">minecraft (Java)</text>
        <text x="15" y="45" fill="#94a3b8" font-size="10" font-family="'Inter', sans-serif">NeoForge Engine / Mods</text>
        <text x="15" y="62" fill="rgba(34, 197, 94, 0.8)" font-size="9" font-family="'Inter', sans-serif" font-weight="600">↳ Monitored by wrapper loop</text>
        <!-- Port Badges -->
        <rect x="15" y="82" width="60" height="16" rx="4" fill="rgba(34, 197, 94, 0.2)" />
        <text x="45" y="94" fill="white" font-size="9" font-family="'Fira Code', monospace" font-weight="bold" text-anchor="middle">25565/TCP</text>
        <rect x="80" y="82" width="60" height="16" rx="4" fill="rgba(34, 197, 94, 0.2)" />
        <text x="110" y="94" fill="white" font-size="9" font-family="'Fira Code', monospace" font-weight="bold" text-anchor="middle">24454/UDP</text>
      </g>

      <!-- Container 3: SFTP (Atmoz) -->
      <g transform="translate(20, 285)">
        <rect width="210" height="70" rx="10" fill="rgba(6, 182, 212, 0.05)" stroke="url(#cyanGrad)" stroke-width="1.5" />
        <text x="15" y="25" fill="white" font-size="12" font-family="'Inter', sans-serif" font-weight="bold">sftp (OpenSSH)</text>
        <text x="15" y="45" fill="#94a3b8" font-size="10" font-family="'Inter', sans-serif">Rooted PVC Direct File Access</text>
      </g>

      <!-- Shared PVC /data representation -->
      <g transform="translate(265, 45)">
        <rect width="145" height="310" rx="12" fill="rgba(15, 23, 42, 0.5)" stroke="rgba(255, 255, 255, 0.1)" stroke-width="1.5" />
        
        <!-- PVC Box -->
        <g transform="translate(15, 15)">
          <rect width="115" height="100" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" />
          <path d="M 20,40 L 40,25 L 95,25 L 95,75 L 75,90 M 20,40 L 75,40 L 75,90 M 20,40 L 20,80 L 75,90 M 40,25 L 40,55" stroke="#94a3b8" stroke-width="1.5" fill="none" />
          <text x="57" y="70" fill="white" font-size="10" font-family="'Inter', sans-serif" font-weight="bold" text-anchor="middle">PVC /data</text>
        </g>

        <!-- Process Tracking Box -->
        <g transform="translate(15, 135)">
          <rect width="115" height="75" rx="8" fill="rgba(139, 92, 246, 0.03)" stroke="rgba(139, 92, 246, 0.2)" />
          <text x="57" y="20" fill="white" font-size="9" font-family="'Inter', sans-serif" font-weight="bold" text-anchor="middle">Shared /proc</text>
          <text x="57" y="38" fill="#a78bfa" font-size="8" font-family="'Fira Code', monospace" text-anchor="middle">VmRSS Tracker</text>
          <text x="57" y="52" fill="#a78bfa" font-size="8" font-family="'Fira Code', monospace" text-anchor="middle">pkill triggers</text>
          <path d="M 57,60 L 57,75" stroke="#8b5cf6" stroke-width="1" stroke-dasharray="2 2" />
        </g>

        <!-- ConfigMap Box -->
        <g transform="translate(15, 225)">
          <rect width="115" height="70" rx="8" fill="rgba(217, 119, 6, 0.03)" stroke="rgba(217, 119, 6, 0.2)" />
          <text x="57" y="22" fill="white" font-size="9" font-family="'Inter', sans-serif" font-weight="bold" text-anchor="middle">ConfigMap</text>
          <text x="57" y="40" fill="#fbbf24" font-size="8" font-family="'Fira Code', monospace" text-anchor="middle">panel-code</text>
          <text x="57" y="54" fill="#fbbf24" font-size="8" font-family="'Fira Code', monospace" text-anchor="middle">(server & html)</text>
        </g>
      </g>
    </g>

    <!-- Host Node Tuner -->
    <g transform="translate(340, 422)">
      <rect width="430" height="42" rx="8" fill="rgba(34, 197, 94, 0.05)" stroke="rgba(34, 197, 94, 0.3)" stroke-width="1" />
      <text x="15" y="25" fill="#4ade80" font-size="10" font-family="'Inter', sans-serif" font-weight="bold">DaemonSet Tuner:</text>
      <text x="120" y="25" fill="#e2e8f0" font-size="10" font-family="'Fira Code', monospace">sysctl -w fs.inotify.max_user_instances=2048</text>
    </g>

    <!-- Connectors / Paths -->
    <!-- Clients to CF -->
    <path d="M 150,100 C 170,100 170,170 190,170" stroke="url(#purpleGrad)" stroke-width="2" fill="none" />
    <path d="M 150,180 C 170,180 170,210 190,210" stroke="url(#cyanGrad)" stroke-width="2" fill="none" />
    <path d="M 150,260 C 170,260 170,250 190,250" stroke="url(#greenGrad)" stroke-width="2" fill="none" />

    <!-- CF to Pod Ingress -->
    <path d="M 300,190 C 320,190 320,130 340,130" stroke="url(#purpleGrad)" stroke-width="2" stroke-dasharray="3 3" fill="none" />
    <path d="M 300,260 C 320,260 320,335 340,335" stroke="url(#cyanGrad)" stroke-width="2" stroke-dasharray="3 3" fill="none" />
    <path d="M 300,230 C 320,230 320,230 340,230" stroke="url(#greenGrad)" stroke-width="2" fill="none" />

    <!-- Container Mounts to Shared PVC -->
    <path d="M 230,85 C 245,85 250,85 265,85" stroke="#8b5cf6" stroke-width="1.5" stroke-dasharray="2 2" fill="none" />
    <path d="M 230,200 C 245,200 250,150 265,150" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="2 2" fill="none" />
    <path d="M 230,320 C 245,320 250,250 265,250" stroke="#06b6d4" stroke-width="1.5" stroke-dasharray="2 2" fill="none" />

    <!-- RCON / Process Link -->
    <path d="M 125,130 L 125,150" stroke="#8b5cf6" stroke-width="1.5" fill="none" />
    <polygon points="121,142 125,150 129,142" fill="#8b5cf6" />
    <text x="135" y="143" fill="#a78bfa" font-size="8" font-family="'Fira Code', monospace">RCON / PID</text>
  </svg>
</div>

---

## 🌟 Key Features

* **Glassmorphic SPA Interface**: High-fidelity dark mode with modern typography, smooth transition animations, and real-time statistics (RAM usage, online players, CPU status).
* **RCON Web Console**: Direct command execution line that sends admin command strings directly to the NeoForge console via RCON.
* **Server List Ping (SLP) Polling**: Status queries (running, starting, offline) are polled on the game port (`25565`) instead of RCON. This **completely eliminates RCON connection log spam** (`Thread RCON Client started/shutting down`) in the console every 5 seconds.
* **Dynamic Java Memory Tracking**: Automatically scans `/proc` in the shared process namespace to track the **RSS (Resident Set Size)** memory of the `java` process. It parses `/data/user_jvm_args.txt` to retrieve your custom `-Xmx` memory limits, ensuring the RAM progress bar displays the exact utilization of the Minecraft server process (e.g. `2.4 / 6.0 GB`) rather than the host node's limits.
* **Power Controls (Start / Stop / Restart)**: A lime-green/red toggle button controls the Java process state dynamically. If stopped, the wrapper loop inside the `minecraft` container goes into sleep mode without exiting. If started, it launches the Java execution.
* **Web File Manager**: Full-featured directory browser. Supports navigating paths, deleting files, making directories, drag-and-drop uploads, downloading files, and editing configurations using an in-browser floating text editor.
* **Root-Level SFTP Sidecar**: Run an independent `sftp` container inside the Pod jailed to the PVC. Configured with matching UID/GID root-level credentials to resolve write/edit permissions across files modified by Java, Node.js, and OpenSSH.

---

## 📂 Project Structure

```text
xyz-minecraft-panel/
├── kubernetes/
│   ├── configmap.yaml             # Pre-rendered Node.js server and SPA HTML code
│   ├── deployment.yaml            # 3-container Pod Manifest with process namespace sharing
│   ├── service.yaml               # ClusterIP exposure (25565, 24454, 8080, 2222)
│   ├── cloudflared-config.yaml    # Ingress routing rules for Cloudflared
│   └── node-sysctl-tuner.yaml     # DaemonSet to tune node inotify watch allocations
├── panel/
│   ├── server.js                  # Node.js HTTP backend api
│   └── index.html                 # Frontend Glassmorphic dashboard Single Page Application
├── LICENSE                        # MIT License
└── README.md                      # Documentation
```

---

## 🚀 Deployment Guide

### Step 1: Tune Node Inotify Limits
Heavily modded packs (like Mekanism, Create, Modern Industrialization) use multiple configurations and track them dynamically using the `nightconfig` Java filewatcher. This will exhaust standard Linux `inotify` limits and crash the server with `WatchingException`.

Apply the sysctl tuner DaemonSet to automatically scale up limits across all cluster hosts:
```bash
kubectl apply -f kubernetes/node-sysctl-tuner.yaml
```

### Step 2: Create the Persistent Volume Claim
Ensure you have a PVC named `minecraft-data` inside the `gaming` namespace:
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: minecraft-data
  namespace: gaming
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi # Adjust to your needs
```

### Step 3: Deploy the Code ConfigMap
Deploy the pre-rendered configmap containing the Node.js server and dashboard frontend assets:
```bash
kubectl apply -f kubernetes/configmap.yaml
```
*(Alternatively, you can compile it yourself from the `/panel` files)*:
```bash
kubectl create configmap minecraft-panel-config --from-file=panel/server.js --from-file=panel/index.html -n gaming --dry-run=client -o yaml | kubectl apply -f -
```

### Step 4: Configure Cloudflare Ingress Routing
Update [cloudflared-config.yaml](kubernetes/cloudflared-config.yaml) with your actual Cloudflare Tunnel UUID and your desired subdomains:
```bash
kubectl apply -f kubernetes/cloudflared-config.yaml
```
*Make sure to register CNAME records in your Cloudflare DNS dashboard pointing both subdomains to your `<TUNNEL-UUID>.cfargotunnel.com` address (with Proxying enabled).*

### Step 5: Deploy the Service and Pod
Apply the service definition and deployment manifests:
```bash
kubectl apply -f kubernetes/service.yaml
kubectl apply -f kubernetes/deployment.yaml
```
Once up, the Minecraft server wrapper will boot, launch the Java engine, and the panel sidecar will listen on port `8080` while SFTP listens on port `2222` (proxied to SSH container port `22`).

---

## 🛡️ Authentication & Access Defaults

* **Web UI Dashboard**: `http://mc-panel.yourdomain.com` (Credentials: `admin` / `minecraft`)
* **SFTP Connection**: `sftp://mc-sftp.yourdomain.com:2222` (Credentials: `admin` / `minecraft`)
* *Security Note: We highly recommend editing the environment variables `PANEL_USERNAME` and `PANEL_PASSWORD` in `deployment.yaml` prior to deployment, or loading them dynamically via a `Secret` resource.*

---

## 📄 License
Licensed under the [MIT License](LICENSE). Built with ❤️ by [xyz-rainbow](https://github.com/xyz-rainbow).
