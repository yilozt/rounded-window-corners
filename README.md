<div align="center">
    <h1>Rounded Corners Effect</h1>
    <!-- <img src="https://img.shields.io/badge/GET%20From-extensions.gnome.org-4A86CF?style=for-the-badge&logo=Gnome&logoColor=white" style="zoom:90%;"/> -->
    <p><i>A gnome-shell extensions that try to add rounded corners for all windows</i></p>

</div>

## Features

- Custom border radius and clip paddings for windows
- Black list for applications which draw window decoration itself
- Custom shadow for rounded corners windows
- Skip libadwaita / libhandy application
- Experimental feature: Blur effect with rounded corners

## Notes

- Need `libadwaita` installed to open preferences pages in Gnome 40/41
- The rounded corners effect for window is base on this [shader](https://gitlab.gnome.org/GNOME/mutter/-/blob/main/src/compositor/meta-background-content.c#L138) from mutter project
- The Blur effect with rounded corners mix [Shell.BlurEffect](https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/src/shell-blur-effect.c) and the above shader

## Installation

### From source code

It will install extensions to `~/.local/share/gnome-shell/extensions`

```
git clone https://github.com/yilozt/rounded-corners-effect
cd rounded-corners-effect
yarn install
yarn ext:install
```

## Development

### Build

```
yarn build
```

### Watch files

```
yarn watch
```

### Test in Virtual machine

Need to install [`vagrant`](https://github.com/hashicorp/vagrant) and Virtual Box. This command will setup a virtual machine that enable log of extensions in terminal.

```
yarn vm
```
