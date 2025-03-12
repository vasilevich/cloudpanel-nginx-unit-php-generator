# Nginx Unit Integration for CloudPanel

This repository provides a **Node.js script** that generates an **Nginx Unit** configuration to replace **PHP-FPM** in [CloudPanel](https://github.com/cloudpanel-io/cloudpanel-ce).

## Why Use Nginx Unit?
- Simplifies PHP application deployment
- Eliminates the need for PHP-FPM
- Supports dynamic configuration updates without reloads

---

## Installation of Nginx Unit on Ubuntu 24.04
To install **Nginx Unit** on Ubuntu 24.04, use the official Nginx repository:

1. Add the repository:
   ```sh
   echo "deb [signed-by=/usr/share/keyrings/nginx-keyring.gpg] https://packages.nginx.org/unit/ubuntu/ noble unit" | tee /etc/apt/sources.list.d/unit.list
   echo "deb-src [signed-by=/usr/share/keyrings/nginx-keyring.gpg] https://packages.nginx.org/unit/ubuntu/ noble unit" | tee -a /etc/apt/sources.list.d/unit.list
   ```
2. Update and install Nginx Unit:
   ```sh
   apt update
   apt install unit unit-php
   systemctl enable unit
   systemctl start unit
   ```

> **Note:** As of writing, Nginx Unit only supports PHP up to **8.3**.

---

## How to Use This Script
This repository contains a **Node.js script** that generates a working **Nginx Unit configuration**.

### Steps:
1. Clone this repository and navigate to the directory.
2. Run the script:
   ```sh
   node generate-config.js
   ```
3. This will create a `config.json` file.
4. Load the generated configuration into Nginx Unit:
   ```sh
   curl -X PUT --data-binary @config.json --unix-socket /var/run/control.unit.sock http://localhost/config
   ```
5. Modify your **CloudPanel Nginx vHost** settings:
    - Replace the existing **PHP-FPM** block:
      ```nginx
      location ~ \.php$ {
          include fastcgi_params;
          fastcgi_intercept_errors on;
          fastcgi_index index.php;
          fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
          try_files $uri =404;
          fastcgi_read_timeout 3600;
          fastcgi_send_timeout 3600;
          fastcgi_param HTTPS "on";
          fastcgi_param SERVER_PORT 443;
          fastcgi_pass 127.0.0.1:{{php_fpm_port}};
          fastcgi_param PHP_VALUE "{{php_settings}}";
      }
      ```
    - With the **Nginx Unit proxy** block:
      ```nginx
      location / {
          proxy_pass http://127.0.0.1:8305;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto https;
          proxy_set_header X-Forwarded-Ssl on;
          proxy_set_header HTTPS "on";
      }
      ```

---

## Credit
- **Config Generation Concept:** Based on [this comment](https://github.com/nginx/unit/discussions/1478#discussioncomment-11761521).
- The original implementation used **Cuelang**, but this repository provides a **Node.js** version for ease of use.

This script is designed specifically for **CloudPanel (Ubuntu/Debian-based)** systems as a **PHP-FPM replacement**.

---

## More About CloudPanel
[CloudPanel GitHub Repository](https://github.com/cloudpanel-io/cloudpanel-ce)

---

## License
This project is open-source under the **MIT License**.

