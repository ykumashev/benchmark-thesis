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
