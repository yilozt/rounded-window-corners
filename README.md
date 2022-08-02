<div align="center">
    <h1>Rounded Window Corners</h1>
    <!-- <img src="https://img.shields.io/badge/GET%20From-extensions.gnome.org-4A86CF?style=for-the-badge&logo=Gnome&logoColor=white" style="zoom:90%;"/> -->
    <p><i>A gnome-shell extensions that try to add rounded corners for all windows</i></p>
</div>

## Features

- Custom border radius and clip paddings for windows
- Black list for applications which draw window decoration itself
- Custom shadow for rounded corners windows
- Skip libadwaita / libhandy application

## Notes

- The rounded corners effect for window is base on this [shader](https://gitlab.gnome.org/GNOME/mutter/-/blob/main/src/compositor/meta-background-content.c#L138) from mutter project
- The TypeScript support for GJS is power by [gi.ts](https://gitlab.gnome.org/ewlsh/gi.ts)

## Screenshots

![2022-07-29 23-49-57](https://user-images.githubusercontent.com/32430186/181902857-d4d10740-82fe-4941-b064-d436b9ea7317.png)


## Installation

### From source code

It will install extensions to `~/.local/share/gnome-shell/extensions`

```
git clone https://github.com/yilozt/rounded-window-corners
cd rounded-window-corners
yarn install
yarn ext:install
```

### From Releases / Github Actions

Download extensions pack from [Releases](https://github.com/yilozt/rounded-window-corners/releases) Page, or download git version from [Github Actions](https://github.com/yilozt/rounded-window-corners/actions/workflows/pack.yml). Then use `gnome-extensions` to install it. Need to restart gnome-shell to enable this extensions.

[![](https://img.shields.io/github/v/release/yilozt/rounded-window-corners?style=flat-square)](https://github.com/yilozt/rounded-window-corners/releases) [![](https://img.shields.io/github/workflow/status/yilozt/rounded-window-corners/Pack%20extensions?style=flat-square)](https://github.com/yilozt/rounded-window-corners/actions/workflows/pack.yml)

```
gnome-extensions install rounded-window-corners@yilozt.shell-extension.zip
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

### Test in Virtual Box by Vagrant

Need to install [`Vagrant`](https://github.com/hashicorp/vagrant) and Virtual Box. This command will setup a virtual machine that enable log of extensions in terminal.

```
yarn vm
```
