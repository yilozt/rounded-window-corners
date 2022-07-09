# -*- mode: ruby -*-
# vi: set ft=ruby :

# Read uuid from metadata.json of extension
def get_uuid (path)
  regex = /.*uuid.*:.*['"](.*?)['"]/
  uuid = nil
  IO.foreach(path) do |line|
      if line =~ regex
          uuid = regex.match(line)[1]
      end
  end
  return uuid
end

UUID = get_uuid "./resource/metadata.json"

# All Vagrant configuration is done below. The "2" in Vagrant.configure
# configures the configuration version (we support older styles for
# backwards compatibility). Please don't change it unless you know what
# you're doing.
Vagrant.configure("2") do |config|
  VAGRANT_PLUGINS = ["vagrant-reload"]
  VAGRANT_PLUGINS.each do |plugin|
    unless Vagrant.has_plugin?("#{plugin}")
      system("vagrant plugin install #{plugin}")
      exit system('vagrant', *ARGV)
    end
  end
  # The most common configuration options are documented and commented below.
  # For a complete reference, please see the online documentation at
  # https://docs.vagrantup.com.

  # Every Vagrant development environment requires a box. You can search for
  # boxes at https://vagrantcloud.com/search.
  config.vm.box = "fedora/36-cloud-base"
  config.vm.box_url = "https://mirrors.tuna.tsinghua.edu.cn/fedora/releases/36/Cloud/x86_64/images/Fedora-Cloud-Base-Vagrant-36-1.5.x86_64.vagrant-virtualbox.box"

  # Disable automatic box update checking. If you disable this, then
  # boxes will only be checked for updates when the user runs
  # `vagrant box outdated`. This is not recommended.
  # config.vm.box_check_update = false

  # Create a forwarded port mapping which allows access to a specific port
  # within the machine from a port on the host machine. In the example below,
  # accessing "localhost:8080" will access port 80 on the guest machine.
  # NOTE: This will enable public access to the opened port
  config.vm.network "forwarded_port", guest: 3389, host: 10389
  config.vm.usable_port_range = 10000..12000

  # Create a forwarded port mapping which allows access to a specific port
  # within the machine from a port on the host machine and only allow access
  # via 127.0.0.1 to disable public access
  # config.vm.network "forwarded_port", guest: 80, host: 8080, host_ip: "127.0.0.1"

  # Create a private network, which allows host-only access to the machine
  # using a specific IP.
  # config.vm.network "private_network", ip: "192.168.56.4"

  # Create a public network, which generally matched to bridged network.
  # Bridged networks make the machine appear as another physical device on
  # your network.
  # config.vm.network "public_network"

  # Share an additional folder to the guest VM. The first argument is
  # the path on the host to the actual folder. The second argument is
  # the path on the guest to mount the folder. And the optional third
  # argument is a set of non-required options.
  config.vm.synced_folder "./_build", "/home/vagrant/.local/share/gnome-shell/extensions/#{UUID}"

  # Provider-specific configuration so you can fine-tune various
  # backing providers for Vagrant. These expose provider-specific options.
  # Example for VirtualBox:
  #
  config.vm.provider "virtualbox" do |vb|
    # Display the VirtualBox GUI when booting the machine
    vb.gui = true
  
    # Customize the amount of memory on the VM:
    vb.memory = 4096
    vb.cpus = 4
    vb.customize ["modifyvm", :id, "--accelerate3d", "on"]
    vb.customize ["modifyvm", :id, "--vram", "128"]
    vb.customize ["modifyvm", :id, "--usb", "on"]
    vb.customize ["modifyvm", :id, "--usbehci", "off"]
    vb.customize ["modifyvm", :id, "--hwvirtex", "on"]
    vb.customize ["modifyvm", :id, "--graphicscontroller", "vmsvga"]
  end
  #
  # View the documentation for the provider you are using for more
  # information on available options.

  # Enable provisioning with a shell script. Additional provisioners such as
  # Ansible, Chef, Docker, Puppet and Salt are also available. Please see the
  # documentation for more information about their specific syntax and use.
  config.vm.provision "shell", inline: <<-SHELL
    export releasever=36
    export basearch=x86_64

    { cat <<EOF
[fedora]
name=Fedora $releasever - $basearch
failovermethod=priority
baseurl=https://mirrors.tuna.tsinghua.edu.cn/fedora/releases/$releasever/Everything/$basearch/os/
metadata_expire=28d
gpgcheck=1
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-fedora-$releasever-$basearch
skip_if_unavailable=False
EOF
    } > /etc/yum.repos.d/fedora.repo

    { cat <<EOF
[updates]
name=Fedora $releasever - $basearch - Updates
failovermethod=priority
baseurl=https://mirrors.tuna.tsinghua.edu.cn/fedora/updates/$releasever/Everything/$basearch/
enabled=1
gpgcheck=1
metadata_expire=6h
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-fedora-$releasever-$basearch
skip_if_unavailable=False
EOF
    } > /etc/yum.repos.d/fedora-updates.repo

    { cat <<EOF
[fedora-modular]
name=Fedora Modular $releasever - $basearch
failovermethod=priority
baseurl=https://mirrors.tuna.tsinghua.edu.cn/fedora/releases/$releasever/Modular/$basearch/os/
enabled=1
metadata_expire=7d
gpgcheck=1
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-fedora-$releasever-$basearch
skip_if_unavailable=False
EOF
    } > /etc/yum.repos.d/fedora-modular.repo

    { cat <<EOF
  [updates-modular]
name=Fedora Modular $releasever - $basearch - Updates
failovermethod=priority
baseurl=https://mirrors.tuna.tsinghua.edu.cn/fedora/updates/$releasever/Modular/$basearch/
enabled=1
gpgcheck=1
metadata_expire=6h
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-fedora-$releasever-$basearch
skip_if_unavailable=False
EOF
    } > /etc/yum.repos.d/fedora-updates-modular.repo

    dnf makecache
    dnf install -y gnome-shell gnome-tweaks gnome-extensions-app @development-tools xrdp gnome-terminal vim nautilus
    systemctl set-default graphical.target
    echo "[daemon]" > /etc/gdm/custom.conf
    echo "AutomaticLoginEnable = true" >> /etc/gdm/custom.conf
    echo "AutomaticLogin = vagrant" >> /etc/gdm/custom.conf
    systemctl enable gdm
    systemctl enable xrdp
    gsettings set org.gnome.shell welcome-dialog-last-shown-version "999" || true
  SHELL
  config.vm.provision :reload
end