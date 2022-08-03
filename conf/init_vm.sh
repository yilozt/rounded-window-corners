#!/bin/bash

# Those scripts used to init vm

# enable debug info so that we can know what happened.
set -ex

[[ -e /etc/done ]] && exit 0

dnf install -y gnome-shell gnome-tweaks gnome-extensions-app virtualbox-guest-additions @development-tools xrdp gnome-terminal vim nautilus chrome-gnome-shell firefox
systemctl set-default graphical.target
echo "[daemon]" > /etc/gdm/custom.conf
echo "AutomaticLoginEnable = true" >> /etc/gdm/custom.conf
echo "AutomaticLogin = vagrant" >> /etc/gdm/custom.conf
systemctl enable gdm
systemctl enable xrdp

# Bypass the password prompt
groupadd nopasswdlogin || true
usermod -aG nopasswdlogin vagrant || true

rm -rf /etc/pam.d/gdm-password
dnf reinstall -y gdm
echo "auth sufficient pam_succeed_if.so user ingroup nopasswdlogin" > /tmp/a
cat /etc/pam.d/gdm-password >> /tmp/a
cat /tmp/a > /etc/pam.d/gdm-password
systemctl start gdm

echo '' > /etc/done
