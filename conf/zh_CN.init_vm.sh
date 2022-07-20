# Those scripts used to init vm

# enable debug info so that we can know what happened.
set -ex

[ -d /etc/done ] && exit 0

export releasever=36
export basearch=x86_64

{
  cat <<EOF
[fedora]
name=Fedora $releasever - $basearch
failovermethod=priority
baseurl=https://mirrors.tuna.tsinghua.edu.cn/fedora/releases/$releasever/Everything/$basearch/os/
metadata_expire=28d
gpgcheck=1
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-fedora-$releasever-$basearch
skip_if_unavailable=False
EOF
} >/etc/yum.repos.d/fedora.repo

{
  cat <<EOF
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
} >/etc/yum.repos.d/fedora-updates.repo

{
  cat <<EOF
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
} >/etc/yum.repos.d/fedora-modular.repo

{
  cat <<EOF
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
} >/etc/yum.repos.d/fedora-updates-modular.repo

dnf makecache
dnf install -y gnome-shell gnome-tweaks gnome-extensions-app @development-tools xrdp gnome-terminal vim nautilus
systemctl set-default graphical.target

echo "[daemon]" >/etc/gdm/custom.conf
echo "AutomaticLoginEnable = true" >>/etc/gdm/custom.conf
echo "AutomaticLogin = vagrant" >>/etc/gdm/custom.conf
systemctl enable gdm
systemctl enable xrdp

# Bypass the password prompt
groupadd nopasswdlogin || true
usermod -aG nopasswdlogin vagrant || true

rm -rf /etc/pam.d/gdm-password
dnf reinstall -y gdm
echo "auth sufficient pam_succeed_if.so user ingroup nopasswdlogin" >/tmp/a
cat /etc/pam.d/gdm-password >>/tmp/a
cat /tmp/a >/etc/pam.d/gdm-password

systemctl start gdm

echo '' >/etc/done
