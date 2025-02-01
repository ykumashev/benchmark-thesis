# benchmark-thesis

Small changes to test.



required installations for new machine:

Steps to install tendermint:
Install go (for thesis i used version 1.22.3)
	wget https://go.dev/dl/go1.22.3.linux-amd64.tar.gz
	sudo tar -C /usr/local -xzf go1.22.3.linux-amd64.tar.gz
	export PATH=$PATH:/usr/local/go/bin
	echo export GOPATH=\"\$HOME/go\" >> ~/.bash_profile
	echo export PATH=\"\$PATH:\$GOPATH/bin\" >> ~/.bash_profile
	
git clone https://github.com/tendermint/tendermint.git
cd tendermint
make install
open new terminal
tendermint version


install docker
sudo usermod -aG docker ${USER} //adds your user to the docker group

install docker-compose


tendermint testnet



Quorum:
everything is inside docker file so no need to install anything






Azure VM machine setup

username: azureuser
password: wj7knNH4FWGg


Azure vm steps:

Add inbound security rule RDP in Network settings
Choose RDP as a service, keep others on default choices


# Connect to your VM via SSH first
ssh azureuser@<VM-Public-IP>

# Update packages
sudo apt update

# Install XFCE (lightweight) + extras
sudo apt install xfce4 xfce4-goodies -y

# Install xRDP
sudo apt install xrdp -y

# Configure xrdp to use XFCE
echo "xfce4-session" | tee ~/.xsession

# Restart xrdp
sudo systemctl restart xrdp





Connect via Remmina on Ubuntu

Configure a New Connection:

    Protocol: RDP

    Server: <VM-Public-IP> (e.g., 20.127.110.201)

    Username: Your VM’s username (e.g., azureuser).

    Password: The password you set for the VM (or use SSH key auth if configured).

    Port: 3389

    Quality: Adjust to Medium or High for better performance.




ON VM:
Install git
sudo apt install git -y


Install Docker:
sudo apt install docker.io -y

2. Install Docker Compose v1.25.0

Now, download and install Docker Compose v1.25.0:

sudo curl -L "https://github.com/docker/compose/releases/download/1.25.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

Grant executable permissions:

sudo chmod +x /usr/local/bin/docker-compose

Verify the installation:

docker-compose --version



Install Node.js and npm:

    Install Node.js (includes npm):
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install nodejs -y


Install make:
sudo apt install make -y

Install the Docker Compose Plugin:
sudo apt install docker-compose-plugin -y




Add Your User to the Docker Group (Permanent Fix)

If you don’t want to use sudo every time, add your user to the docker group:

sudo groupadd docker  # Ensure the docker group exists
sudo usermod -aG docker $USER

Then apply the changes by logging out and back in, or run:

newgrp docker

Now, try running:

docker ps


Backend:
	npm install in root folder
	npm start