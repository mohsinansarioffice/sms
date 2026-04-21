const dns = require('dns');

/**
 * Atlas `mongodb+srv://` URIs need DNS SRV + TXT lookups. Some networks/ISPs
 * return ESERVFAIL; setting resolvers here runs before Mongoose connects.
 * Set MONGODB_DNS_SERVERS=8.8.8.8,1.1.1.1 in .env (comma-separated) to enable.
 */
function applyMongoDnsFromEnv() {
  const raw = process.env.MONGODB_DNS_SERVERS;
  if (!raw || !String(raw).trim()) return;
  const servers = String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (servers.length) dns.setServers(servers);
}

module.exports = { applyMongoDnsFromEnv };
