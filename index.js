const fs = require('fs');

const sites = [
    {host: "test.com", php_ver: "8.3", sub_dir: "", user: "test"},
    {host: "staging.test.com", php_ver: "8.3", sub_dir: "", user: "test-staging"},
];

const getAppName = site => `${site.host}${site.sub_dir.replace(/\//g, "--")}`;

const config = {
    //   settings: {http: {log_route: false}},
    listeners: {

        "127.0.0.1:8305": {
            pass: "routes",
            forwarded: {
                client_ip: "X-Forwarded-For",
                protocol: 'https',
                source: ["127.0.0.1"]
            }
        }
    },
    routes: [
        ...sites.flatMap(site => [
            {
                match: {
                    host: site.host,
                    uri: [
                        `${site.sub_dir}/*.php`,
                        `${site.sub_dir}/*.php/*`,
                        `${site.sub_dir}/wp-admin/`
                    ]
                },
                action: {
                    rewrite: "`${uri.replace('', '')}`",
                    pass: `applications/${getAppName(site)}/direct`
                }
            },
            {
                match: {
                    host: site.host,
                    uri: [`${site.sub_dir}*`]
                },
                action: {
                    share: `\`/home/${site.user || getAppName(site)}/htdocs/${site.host}\${uri.replace('', '')}\``,
                    fallback: {
                        pass: `applications/${getAppName(site)}/index`
                    }
                }
            }
        ])
    ],
    applications: Object.fromEntries(
        sites.map(site => [
            getAppName(site),
            {
                stderr: `/home/${site.user || getAppName(site)}/logs/unit_error.log`,
                stdout: `/home/${site.user || getAppName(site)}/logs/unit_access.log`,
                user: `${site.user}`,
                group: `${site.group || site.user}`,
                type: `php ${site.php_ver}`,
                processes: {max: 30, spare: 5, idle_timeout: 5},
                targets: {
                    direct: {root: `/home/${site.user || getAppName(site)}/htdocs/${site.host}`},
                    index: {root: `/home/${site.user || getAppName(site)}/htdocs/${site.host}`, script: "index.php"}
                }
            }
        ])
    )
};

fs.writeFileSync("config.json", JSON.stringify(config, null, 2));

console.log("config.json generated successfully");
