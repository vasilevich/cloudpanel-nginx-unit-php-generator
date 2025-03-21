import {execSync} from 'child_process';
import fs from "fs";
import {generateConfig} from "./generators.js";

/**
 * Get the nginx sites configuration automatically
 * @returns {{sites: {host: *, php_ver: string, sub_dir: string, user: *|string, group: *|string}[]}}
 */
export const getNginxSites = () => {
    const out = execSync('nginx -T').toString();
    const matches = [...out.matchAll(/server_name\s+(.+?);[\s\S]*?root\s+(.+?);/g)];

    return matches.map(([, host, root]) => {
        const stats = fs.statSync(root.trim(), {throwIfNoEntry: false});
        const {uid, gid} = stats || {};
        const user = uid != null ? getUsername(uid) : '';
        const group = gid != null ? getGroupName(gid) : '';

        return {
            host: host.trim(),
            php_ver: '8.3',
            sub_dir: '',
            user,
            group
        };
    });

};

const getUsername = (uid) => {
    return execSync(`getent passwd ${uid} | cut -d: -f1`).toString().trim();
};

const getGroupName = (gid) => {
    return execSync(`getent group ${gid} | cut -d: -f1`).toString().trim();
};


const config = generateConfig(getNginxSites());

fs.writeFileSync("config.json", JSON.stringify(config, null, 2));

console.log("config.json generated successfully");
