#!/bin/bash
cd /usr/share/nginx/html
pm2 startOrReload ecosystem.config.js
