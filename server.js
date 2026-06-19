const express = require('express');
const fs = require('fs');
const os = require('os');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'n@dmin#88';

app.use(express.json());
app.use(express.static(__dirname));

// Disable API caching for real-time config reflection in index/admin pages.
app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});


const CONFIG_PATH = path.join(__dirname, 'config.json');

// Helper to read config
function readConfig() {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            const data = fs.readFileSync(CONFIG_PATH, 'utf8');
            const parsed = JSON.parse(data);
            // Handle both old array format and new object format
            if (Array.isArray(parsed)) {
                return normalizeConfig({
                    maxSpinsPerDay: 3,
                    prizes: parsed
                });
            }
            return normalizeConfig(parsed);
        }
    } catch (e) {
        console.error("Error reading config.json, using fallback", e);
    }
    return normalizeConfig({
        maxSpinsPerDay: 3,
        prizes: [
            { id: 1, name: "Wallet Ladies", icon: "👜", probability: 2, stock: 10, isPrize: true, enabled: true, winCount: 0 },
            { id: 3, name: "Wallet Men", icon: "💼", probability: 2, stock: 10, isPrize: true, enabled: true, winCount: 0 },
            { id: 5, name: "Pickle Ball", icon: "🎾", probability: 5, stock: 10, isPrize: true, enabled: true, winCount: 0 },
            { id: 7, name: "Pen", icon: "🖊️", probability: 15, stock: 10, isPrize: true, enabled: true, winCount: 0 }
        ]
    });
}

function normalizeConfig(config) {
    const safeConfig = config && typeof config === 'object' ? config : { maxSpinsPerDay: 3, prizes: [] };
    const safePrizes = Array.isArray(safeConfig.prizes) ? safeConfig.prizes : [];
    return {
        ...safeConfig,
        prizes: safePrizes.map((item) => ({
            ...item,
            winCount: Number(item.winCount || 0)
        }))
    };
}

// Helper to write config
function writeConfig(config) {
    try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
        return true;
    } catch (e) {
        console.error("Error writing to config.json", e);
        return false;
    }
}

// GET API to fetch configurations
app.get('/api/config', (req, res) => {
    res.json(readConfig());
});

// POST API for admin login (plain password verification)
app.post('/api/admin/login', (req, res) => {
    try {
        const { username, password } = req.body || {};
        if (typeof username !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ success: false, message: 'Invalid credentials payload.' });
        }

        const usernameOk = username === ADMIN_USERNAME;
        const passwordOk = password === ADMIN_PASSWORD;

        if (usernameOk && passwordOk) {
            return res.json({ success: true });
        }

        return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    } catch (e) {
        console.error('Admin login error:', e);
        return res.status(500).json({ success: false, message: 'Login failed.' });
    }
});

// GET API to fetch config file version (mtime) for fast polling.
app.get('/api/config/version', (req, res) => {
    try {
        const stats = fs.existsSync(CONFIG_PATH) ? fs.statSync(CONFIG_PATH) : null;
        res.json({ version: stats ? stats.mtimeMs : 0 });
    } catch (e) {
        res.status(500).json({ version: 0, message: 'Failed to read config version' });
    }
});

// POST API to update configurations
app.post('/api/config', (req, res) => {
    const config = normalizeConfig(req.body);
    if (config && typeof config === 'object' && config.prizes && Array.isArray(config.prizes)) {
        if (writeConfig(config)) {
            res.json({ success: true, message: "Configuration saved successfully!", data: config });
        } else {
            res.status(500).json({ success: false, message: "Failed to write configuration file." });
        }
    } else {
        res.status(400).json({ success: false, message: "Invalid configuration format." });
    }
});

// POST API to decrement stock levels
app.post('/api/config/decrement', (req, res) => {
    const { itemId, itemName } = req.body;
    
    const config = readConfig();
    const prizes = config.prizes || config;
    let item;
    
    if (itemId !== undefined) {
        item = prizes.find(i => i.id === parseInt(itemId, 10));
    } else if (itemName) {
        item = prizes.find(i => i.name === itemName || `${i.name} ${i.icon}` === itemName);
    }

    if (item) {
        item.winCount = Number(item.winCount || 0) + 1;
        item.stock = Math.max(0, item.stock - 1);
        if (writeConfig(config)) {
            return res.json({ success: true, message: `Stock for ${item.name} decremented.`, data: config });
        } else {
            return res.status(500).json({ success: false, message: "Failed to write configuration file." });
        }
    }
    res.status(404).json({ success: false, message: "Item not found." });
});

function getLanIp() {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name] || []) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return null;
}

app.listen(PORT, HOST, () => {
    const lanIp = getLanIp();
    console.log(`===================================================`);
    console.log(` NChat Wheel Spin Game API Server running locally!`);
    console.log(` URL: http://localhost:${PORT}/index.html`);
    console.log(` Admin: http://localhost:${PORT}/admin.html`);
    if (lanIp) {
        console.log(` LAN URL: http://${lanIp}:${PORT}/index.html`);
        console.log(` LAN Admin: http://${lanIp}:${PORT}/admin.html`);
    }
    console.log(`===================================================`);
});
