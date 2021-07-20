#!/bin/bash
cd /var/www/html/perimeter-server
pm2 startOrReload ecosystem.config.js
