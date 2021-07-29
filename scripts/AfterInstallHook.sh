#!/bin/bash
set -e
cd /usr/share/nginx/html
#npm install
#npm run build
rm -f awscliv2.zip
sudo service nginx restart
