import {execSync} from 'child_process';
import fs from "fs";
import {generateConfig} from "./generators.js";

const allowedHosts = process.argv.slice(2);
const filterByHost = allowedHosts.length
    ? (host) => allowedHosts.includes(host)
    : () => true;


const getUsername = (uid) => {
    return execSync(`getent passwd ${uid} | cut -d: -f1`).toString().trim();
};

const getGroupName = (gid) => {
    return execSync(`getent group ${gid} | cut -d: -f1`).toString().trim();
};

/**
 * Get the nginx sites configuration automatically
 * @returns {{sites: {host: *, php_ver: string, sub_dir: string, user: *|string, group: *|string}[]}}
 */
const getNginxSites = () => {
    const out = execSync('nginx -T').toString();
    const matches = [...out.matchAll(/server_name\s+(.+?);[\s\S]*?root\s+(.+?);/g)];

    const seen = new Set();
    return matches
        .map(([, host, root]) => ({host: host.trim(), root: root.trim()}))
        .filter(({host}) =>
            host.length > 3 &&
            /^[a-zA-Z0-9.-]+$/.test(host) &&
            !seen.has(host) &&
            seen.add(host) &&
            filterByHost(host)
        )
        .map(({host, root}) => {
            const stats = fs.statSync(root, {throwIfNoEntry: false});
            const {uid, gid} = stats || {};
            const user = uid != null ? getUsername(uid) : '';
            const group = gid != null ? getGroupName(gid) : '';
            return {
                host,
                php_ver: '8.3',
                sub_dir: '',
                user,
                group
            };
        });


};


const config = generateConfig(getNginxSites());

fs.writeFileSync("config.json", JSON.stringify(config, null, 2));

console.log("config.json generated successfully");
