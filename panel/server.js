const http = require('http');
const fs = require('fs');
const path = require('path');
const net = require('net');
const os = require('os');
const { exec } = require('child_process');

const PORT = 8080;
const DATA_DIR = '/data';
const PANEL_USER = process.env.PANEL_USERNAME || 'admin';
const PANEL_PASS = process.env.PANEL_PASSWORD || 'admin';
const SESSION_COOKIE = 'panel_session';
const STATE_FILE = path.join(DATA_DIR, '.server_state');

// Helper to parse server.properties
function getRconConfig() {
    try {
        const content = fs.readFileSync(path.join(DATA_DIR, 'server.properties'), 'utf8');
        const config = {};
        content.split('\n').forEach(line => {
            if (line.startsWith('#') || !line.includes('=')) return;
            const [key, ...valParts] = line.split('=');
            config[key.trim()] = valParts.join('=').trim();
        });
        return {
            enabled: config['enable-rcon'] === 'true',
            port: parseInt(config['rcon.port']) || 25575,
            password: config['rcon.password'] || '',
            gamePort: parseInt(config['server-port']) || 25565
        };
    } catch (e) {
        console.error('Failed to parse server.properties:', e);
        return { enabled: false, port: 25575, password: '', gamePort: 25565 };
    }
}

// Helper to get target server state
function getTargetState() {
    try {
        if (fs.existsSync(STATE_FILE)) {
            return fs.readFileSync(STATE_FILE, 'utf8').trim();
        }
    } catch (e) {}
    return 'running'; // default
}

// Helper to write target server state
function setTargetState(state) {
    try {
        fs.writeFileSync(STATE_FILE, state, 'utf8');
    } catch (e) {
        console.error('Failed to write state file:', e);
    }
}

// Helper to get JVM and Java Memory statistics
function getMemoryStats() {
    let used = 0;
    let total = os.totalmem();
    
    // Try to get Java memory usage (Resident Set Size) from shared process namespace
    try {
        const pids = fs.readdirSync('/proc');
        for (const pid of pids) {
            if (!/^\d+$/.test(pid)) continue;
            try {
                const cmdline = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8');
                if (cmdline.includes('java')) {
                    const status = fs.readFileSync(`/proc/${pid}/status`, 'utf8');
                    const match = status.match(/VmRSS:\s+(\d+)\s+kB/);
                    if (match) {
                        used = parseInt(match[1]) * 1024;
                        break;
                    }
                }
            } catch (e) {}
        }
    } catch (e) {}

    // Parse Xmx limit from user_jvm_args.txt
    try {
        const argsPath = path.join(DATA_DIR, 'user_jvm_args.txt');
        if (fs.existsSync(argsPath)) {
            const content = fs.readFileSync(argsPath, 'utf8');
            const match = content.match(/-Xmx(\d+)([gGmMkK])/);
            if (match) {
                const value = parseInt(match[1]);
                const unit = match[2].toLowerCase();
                if (unit === 'g') total = value * 1024 * 1024 * 1024;
                else if (unit === 'm') total = value * 1024 * 1024;
                else if (unit === 'k') total = value * 1024;
            }
        }
    } catch (e) {}

    // Fallbacks if Java is not running or cgroup read is needed
    if (used === 0) {
        try {
            if (fs.existsSync('/sys/fs/cgroup/memory.current')) {
                used = parseInt(fs.readFileSync('/sys/fs/cgroup/memory.current', 'utf8').trim());
            } else {
                used = os.totalmem() - os.freemem();
            }
        } catch (e) {
            used = os.totalmem() - os.freemem();
        }
    }

    return {
        used,
        total,
        percent: Math.max(0, Math.min(100, Math.round((used / total) * 100)))
    };
}

// Helper to write VarInt
function writeVarInt(val) {
    const buf = [];
    while (true) {
        if ((val & ~0x7F) === 0) {
            buf.push(val);
            break;
        }
        buf.push((val & 0x7F) | 0x80);
        val >>>= 7;
    }
    return Buffer.from(buf);
}

// Helper to read VarInt
function readVarInt(buffer, offset = 0) {
    let value = 0;
    let length = 0;
    let currentByte;
    while (true) {
        currentByte = buffer[offset + length];
        if (currentByte === undefined) return { value: 0, length: 0 };
        value |= (currentByte & 0x7F) << (length * 7);
        length++;
        if ((currentByte & 0x80) !== 0x80) break;
    }
    return { value, length };
}

// Ping Minecraft Server List Ping (SLP) protocol
function pingMinecraft(host, port) {
    return new Promise((resolve, reject) => {
        const client = new net.Socket();
        client.setTimeout(2000);
        
        client.connect(port, host, () => {
            const protocolVersion = writeVarInt(767); // 1.21.1
            const hostBuf = Buffer.from(host, 'utf8');
            const hostLen = writeVarInt(hostBuf.length);
            const portBuf = Buffer.alloc(2);
            portBuf.writeUInt16BE(port, 0);
            const nextState = writeVarInt(1);

            const handshakeData = Buffer.concat([protocolVersion, hostLen, hostBuf, portBuf, nextState]);
            const handshakeHeader = Buffer.concat([writeVarInt(0x00), handshakeData]);
            const handshakePacket = Buffer.concat([writeVarInt(handshakeHeader.length), handshakeHeader]);

            const requestPacket = Buffer.concat([writeVarInt(1), writeVarInt(0x00)]);

            client.write(Buffer.concat([handshakePacket, requestPacket]));
        });

        let dataBuffer = Buffer.alloc(0);
        client.on('data', (chunk) => {
            dataBuffer = Buffer.concat([dataBuffer, chunk]);
            if (dataBuffer.length < 5) return;
            try {
                const len1 = readVarInt(dataBuffer, 0);
                if (len1.length === 0) return;
                if (dataBuffer.length < len1.length + len1.value) return;

                const packetId = readVarInt(dataBuffer, len1.length);
                const jsonLen = readVarInt(dataBuffer, len1.length + packetId.length);
                const jsonStr = dataBuffer.toString('utf8', len1.length + packetId.length + jsonLen.length);

                client.destroy();
                resolve(JSON.parse(jsonStr));
            } catch (e) {
                // Wait for more data
            }
        });

        client.on('error', (err) => {
            client.destroy();
            reject(err);
        });

        client.on('timeout', () => {
            client.destroy();
            reject(new Error('Connection timeout'));
        });
    });
}

// Custom RCON client implementation (zero dependencies)
function sendRconCommand(command) {
    const rcon = getRconConfig();
    if (!rcon.enabled) {
        return Promise.reject(new Error('RCON is disabled in server.properties'));
    }
    return new Promise((resolve, reject) => {
        const client = new net.Socket();
        let authed = false;
        let responseBuffer = Buffer.alloc(0);
        let reqId = 123;
        
        client.setTimeout(5000);
        client.connect(rcon.port, '127.0.0.1', () => {
            sendPacket(3, rcon.password);
        });

        client.on('data', (data) => {
            responseBuffer = Buffer.concat([responseBuffer, data]);
            processBuffer();
        });

        client.on('timeout', () => {
            client.destroy();
            reject(new Error('Connection timeout'));
        });

        client.on('error', (err) => {
            client.destroy();
            reject(err);
        });

        function sendPacket(type, payload) {
            const payloadBuf = Buffer.from(payload + '\0', 'utf8');
            const packetSize = 4 + 4 + payloadBuf.length + 1;
            const buf = Buffer.alloc(4 + packetSize);
            buf.writeInt32LE(packetSize, 0);
            buf.writeInt32LE(reqId, 4);
            buf.writeInt32LE(type, 8);
            payloadBuf.copy(buf, 12);
            buf.write('\0', buf.length - 1);
            client.write(buf);
        }

        function processBuffer() {
            while (responseBuffer.length >= 12) {
                const length = responseBuffer.readInt32LE(0);
                if (responseBuffer.length < 4 + length) return;
                const packet = responseBuffer.subarray(0, 4 + length);
                responseBuffer = responseBuffer.subarray(4 + length);
                const id = packet.readInt32LE(4);
                const type = packet.readInt32LE(8);
                const payload = packet.subarray(12, packet.length - 2).toString('utf8');
                
                if (type === 2) {
                    if (id === -1) {
                        client.destroy();
                        reject(new Error('RCON Authentication failed'));
                        return;
                    }
                    authed = true;
                    reqId = 456;
                    sendPacket(2, command);
                } else if (type === 0) {
                    client.destroy();
                    resolve(payload);
                    return;
                }
            }
        }
    });
}

// Path sanitization helper
function resolveSafePath(userPath) {
    const resolved = path.resolve(DATA_DIR, userPath || '');
    if (!resolved.startsWith(DATA_DIR)) {
        throw new Error('Access Denied: Path escapes server directory');
    }
    return resolved;
}

// Cookie parser helper
function parseCookies(req) {
    const list = {};
    const rc = req.headers.cookie;
    if (rc) {
        rc.split(';').forEach(cookie => {
            const parts = cookie.split('=');
            list[parts.shift().trim()] = decodeURI(parts.join('='));
        });
    }
    return list;
}

// Auth verification helper
function isAuthenticated(req) {
    const cookies = parseCookies(req);
    const expectedToken = Buffer.from(`${PANEL_USER}:${PANEL_PASS}`).toString('base64');
    return cookies[SESSION_COOKIE] === expectedToken;
}

// JSON responder helper
function sendJSON(res, data, status = 200) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

// Main HTTP Server
const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;
    const queryPath = parsedUrl.searchParams.get('path') || '';

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Static Files: Serve single-file dashboard
    if (pathname === '/' || pathname === '/index.html') {
        fs.readFile(path.join(__dirname, 'index.html'), 'utf8', (err, content) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error loading dashboard page');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content);
        });
        return;
    }

    // API Endpoint: Login
    if (pathname === '/api/login') {
        if (req.method !== 'POST') return sendJSON(res, { error: 'Method not allowed' }, 405);
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { username, password } = JSON.parse(body);
                if (username === PANEL_USER && password === PANEL_PASS) {
                    const token = Buffer.from(`${PANEL_USER}:${PANEL_PASS}`).toString('base64');
                    res.writeHead(200, {
                        'Set-Cookie': `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Max-Age=86400; SameSite=Strict`,
                        'Content-Type': 'application/json'
                    });
                    res.end(JSON.stringify({ success: true }));
                } else {
                    sendJSON(res, { error: 'Invalid credentials' }, 401);
                }
            } catch (e) {
                sendJSON(res, { error: 'Invalid body' }, 400);
            }
        });
        return;
    }

    // API Endpoint: Logout
    if (pathname === '/api/logout') {
        res.writeHead(200, {
            'Set-Cookie': `${SESSION_COOKIE}=; Path=/; HttpOnly; Max-Age=0; SameSite=Strict`,
            'Content-Type': 'application/json'
        });
        res.end(JSON.stringify({ success: true }));
        return;
    }

    // Verify Authentication for all other API endpoints
    if (!isAuthenticated(req)) {
        return sendJSON(res, { error: 'Unauthorized' }, 401);
    }

    // API Endpoint: Server Status (Pings Minecraft and checks shared namespace stats)
    if (pathname === '/api/status') {
        const rcon = getRconConfig();
        const targetState = getTargetState();
        pingMinecraft('127.0.0.1', rcon.gamePort)
            .then(slpRes => {
                let online = slpRes.players ? slpRes.players.online : 0;
                let max = slpRes.players ? slpRes.players.max : 20;

                sendJSON(res, {
                    status: 'online',
                    players: { online, max },
                    memory: getMemoryStats()
                });
            })
            .catch(err => {
                // SLP failed, determine if we are starting or offline
                const status = (targetState === 'running') ? 'starting' : 'offline';
                sendJSON(res, {
                    status: status,
                    error: err.message,
                    players: { online: 0, max: 0 },
                    memory: getMemoryStats()
                });
            });
        return;
    }

    // API Endpoint: Start Minecraft Server
    if (pathname === '/api/start') {
        if (req.method !== 'POST') return sendJSON(res, { error: 'Method not allowed' }, 405);
        setTargetState('running');
        sendJSON(res, { success: true });
        return;
    }

    // API Endpoint: Stop Minecraft Server (Sends RCON stop and falls back to killing process)
    if (pathname === '/api/stop') {
        if (req.method !== 'POST') return sendJSON(res, { error: 'Method not allowed' }, 405);
        setTargetState('stopped');
        sendRconCommand('stop')
            .then(output => {
                sendJSON(res, { success: true, response: output });
            })
            .catch(err => {
                // Fallback: kill Java directly (needs shareProcessNamespace: true in Pod spec)
                exec('pkill -f java', (err2, stdout, stderr) => {
                    sendJSON(res, { success: true, warning: 'Forced shutdown via pkill' });
                });
            });
        return;
    }

    // API Endpoint: Send Console Command
    if (pathname === '/api/console') {
        if (req.method !== 'POST') return sendJSON(res, { error: 'Method not allowed' }, 405);
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { command } = JSON.parse(body);
                sendRconCommand(command)
                    .then(output => sendJSON(res, { success: true, response: output }))
                    .catch(err => sendJSON(res, { error: err.message }, 500));
            } catch (e) {
                sendJSON(res, { error: 'Invalid body' }, 400);
            }
        });
        return;
    }

    // API Endpoint: List Files
    if (pathname === '/api/files') {
        try {
            const targetDir = resolveSafePath(queryPath);
            fs.readdir(targetDir, { withFileTypes: true }, (err, items) => {
                if (err) return sendJSON(res, { error: err.message }, 500);
                const files = items.map(item => {
                    const itemPath = path.join(targetDir, item.name);
                    let size = 0;
                    let mtime = null;
                    try {
                        const stat = fs.statSync(itemPath);
                        size = stat.size;
                        mtime = stat.mtime;
                    } catch (e) {}
                    return {
                        name: item.name,
                        isDir: item.isDirectory(),
                        size,
                        mtime
                    };
                }).sort((a, b) => b.isDir - a.isDir || a.name.localeCompare(b.name));
                sendJSON(res, { success: true, files });
            });
        } catch (e) {
            sendJSON(res, { error: e.message }, 400);
        }
        return;
    }

    // API Endpoint: Read File Content
    if (pathname === '/api/file') {
        try {
            const targetFile = resolveSafePath(queryPath);
            fs.readFile(targetFile, (err, data) => {
                if (err) return sendJSON(res, { error: err.message }, 500);
                res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
                res.end(data);
            });
        } catch (e) {
            sendJSON(res, { error: e.message }, 400);
        }
        return;
    }

    // API Endpoint: Save File Content
    if (pathname === '/api/save') {
        if (req.method !== 'POST') return sendJSON(res, { error: 'Method not allowed' }, 405);
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { path: fileRelPath, content } = JSON.parse(body);
                const targetFile = resolveSafePath(fileRelPath);
                fs.writeFile(targetFile, content, 'utf8', (err) => {
                    if (err) return sendJSON(res, { error: err.message }, 500);
                    sendJSON(res, { success: true });
                });
            } catch (e) {
                sendJSON(res, { error: 'Invalid body' }, 400);
            }
        });
        return;
    }

    // API Endpoint: Delete File or Folder
    if (pathname === '/api/delete') {
        if (req.method !== 'POST') return sendJSON(res, { error: 'Method not allowed' }, 405);
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { path: fileRelPath } = JSON.parse(body);
                const targetPath = resolveSafePath(fileRelPath);
                fs.rm(targetPath, { recursive: true, force: true }, (err) => {
                    if (err) return sendJSON(res, { error: err.message }, 500);
                    sendJSON(res, { success: true });
                });
            } catch (e) {
                sendJSON(res, { error: 'Invalid body' }, 400);
            }
        });
        return;
    }

    // API Endpoint: Make Directory
    if (pathname === '/api/mkdir') {
        if (req.method !== 'POST') return sendJSON(res, { error: 'Method not allowed' }, 405);
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { path: fileRelPath } = JSON.parse(body);
                const targetPath = resolveSafePath(fileRelPath);
                fs.mkdir(targetPath, { recursive: true }, (err) => {
                    if (err) return sendJSON(res, { error: err.message }, 500);
                    sendJSON(res, { success: true });
                });
            } catch (e) {
                sendJSON(res, { error: 'Invalid body' }, 400);
            }
        });
        return;
    }

    // API Endpoint: Upload File
    if (pathname === '/api/upload') {
        if (req.method !== 'POST') return sendJSON(res, { error: 'Method not allowed' }, 405);
        try {
            const targetFile = resolveSafePath(queryPath);
            const writeStream = fs.createWriteStream(targetFile);
            req.pipe(writeStream);
            req.on('end', () => sendJSON(res, { success: true }));
            writeStream.on('error', (err) => sendJSON(res, { error: err.message }, 500));
        } catch (e) {
            sendJSON(res, { error: e.message }, 400);
        }
        return;
    }

    // API Endpoint: Restart
    if (pathname === '/api/restart') {
        if (req.method !== 'POST') return sendJSON(res, { error: 'Method not allowed' }, 405);
        setTargetState('running');
        sendRconCommand('stop')
            .then(output => sendJSON(res, { success: true, response: output }))
            .catch(err => {
                exec('pkill -f java', (err2, stdout, stderr) => {
                    sendJSON(res, { success: true, warning: 'Forced restart via pkill' });
                });
            });
        return;
    }

    // API Endpoint: SSE Log Stream
    if (pathname === '/api/logs') {
        const logPath = path.join(DATA_DIR, 'logs', 'latest.log');
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        });

        let fileExists = fs.existsSync(logPath);
        if (fileExists) {
            try {
                const data = fs.readFileSync(logPath, 'utf8');
                const lines = data.split('\n');
                const tailLines = lines.slice(-200).join('\n');
                res.write(`data: ${JSON.stringify(tailLines)}\n\n`);
            } catch (e) {}
        }

        let pos = fileExists ? fs.statSync(logPath).size : 0;
        const watchInterval = setInterval(() => {
            if (!fs.existsSync(logPath)) return;
            try {
                const stat = fs.statSync(logPath);
                if (stat.size > pos) {
                    const stream = fs.createReadStream(logPath, { start: pos, end: stat.size });
                    stream.on('data', chunk => {
                        res.write(`data: ${JSON.stringify(chunk.toString())}\n\n`);
                    });
                    pos = stat.size;
                } else if (stat.size < pos) {
                    pos = 0;
                }
            } catch (e) {}
        }, 1000);

        req.on('close', () => {
            clearInterval(watchInterval);
            res.end();
        });
        return;
    }

    sendJSON(res, { error: 'Endpoint not found' }, 404);
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Minecraft control panel sidecar running on port ${PORT}`);
});
