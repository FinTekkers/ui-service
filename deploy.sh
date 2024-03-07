#! /usr/bin/env bash

# npm run build
# cp -r ./infra/pre-build-lambda-assets/. ./build/

# cd build
# npm ci --omit dev

# cd ../
# npx cdk deploy

#Log into EC2 server
#1. Make sure instance is on public subnet, make sure it has SSH port 22 enabled, and instance has pbulic IP assigned
ssh -i ~/.aws/fintekkers-test-ec2.pem ec2-user@ec2-3-93-154-22.compute-1.amazonaws.com

#install git on server
sudo yum install git -y

#install node
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 21

#Install pm2 which we will use to run web server on a daemon thread
sudo npm i -g pm2

#install make to be able to install npm packages
sudo yum install make

#test node is installed
node --version

#make node visible to sudo
sudo ln -s /home/ec2-user/.nvm/versions/node/v21.6.2/bin/node /usr/bin/node
sudo ln -s /home/ec2-user/.nvm/versions/node/v21.6.2/bin/npm /usr/bin/npm
sudo ln -s /home/ec2-user/.nvm/versions/node/v21.6.2/bin/pm2 /usr/bin/pm2

#Build the production server, the variables are required to build
sudo GOOGLE_CLIENT_ID=MISSING GOOGLE_CLIENT_SECRET=MISSING npm run build

#Set the port to be 443. Note this is running HTTP server but running on HTTPS port. 
#The load balancer on AWS will add the encryption/certificate termination and forward
#to this port. We could expose to port 80, but the broker is already using that port
sudo PORT=443
sudo ORIGIN=*

#Run the production server
sudo pm2 start build/index.js
