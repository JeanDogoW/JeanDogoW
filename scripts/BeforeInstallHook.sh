#!/bin/bash
set -e
yum update -y
yum install -y gcc-c++ make 
curl -sL https://rpm.nodesource.com/setup_14.x | sudo -E bash - 
yum install -y nodejs
npm i -g pm2
pm2 update
sudo amazon-linux-extras install -y nginx1

