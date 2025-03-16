const c = require('config');
const fs = require('fs');

const sites = c.sites;

const getAppName = site => `${site.host}${site.sub_dir.replace(/\//g, "--")}`;

const createRoutes = sites => {
    const routes = {};
    for (const site of sites) {
        routes[site.host] = [
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
        ];
    }
    return routes;

};

const config = {
    //   settings: {http: {log_route: false}},
    listeners: {

        "127.0.0.1:8305": {
            pass: "routes/$host",
            forwarded: {
                client_ip: "X-Forwarded-For",
                protocol: 'https',
                source: ["127.0.0.1"]
            }
        }
    },
    routes: createRoutes(sites),
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
                },
                environment: {
                    HOME: `/home/${site.user}`,
                    USER: `${site.user}`,
                    PHP_VALUE: `\nerror_log=\/home\/${site.user}\/logs\/php\/error.log;\nmemory_limit=512M;\nmax_execution_time=60;\nmax_input_time=60;\nmax_input_vars=10000;\npost_max_size=64M;\nupload_max_filesize=64M;\nauto_prepend_file=\/home\/${site.user}\/.varnish-cache\/controller.php;\ndate.timezone=UTC;\ndisplay_errors=off;`,
                }
            }
        ])
    )
};

fs.writeFileSync("config.json", JSON.stringify(config, null, 2));

console.log("config.json generated successfully");
