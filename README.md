<div align="center">
  <h1>Rounded Window Corners</h1>
  <p><i>A gnome-shell extensions that try to add rounded corners for all windows</i></p>
  <a href="https://extensions.gnome.org/extension/5237/rounded-window-corners/">
    <img src="https://img.shields.io/badge/Install%20from-extensions.gnome.org-4A86CF?style=for-the-badge&logo=Gnome&logoColor=white"/>
  </a>  
</div>

## Features

- Works with Gnome 40/41/42
- Custom border radius and clip paddings for windows
- Black list for applications which draw window decoration itself
- Custom shadow for rounded corners windows
- Skip libadwaita / libhandy application
- [Superelliptical](https://en.wikipedia.org/wiki/Superellipse) shape for rounded corners, thanks to [@YuraIz](https://github.com/YuraIz) 
- A simple reset preferences dialog

## Compatibility

- [_Compiz alike magic lamp effect_](https://extensions.gnome.org/extension/3740/compiz-alike-magic-lamp-effect/)
  
  Hide shadow when magic lamp effect running.
  Need to restart (disable then enable) this extension when _Compiz alike magic lamp effect_ enabled. 

## Notes

- The rounded corners effect for window is base on this [shader](https://gitlab.gnome.org/GNOME/mutter/-/blob/main/src/compositor/meta-background-content.c#L138) from mutter project
- The TypeScript support for GJS is power by [gi.ts](https://gitlab.gnome.org/ewlsh/gi.ts)

## Screenshots

![2022-07-29 23-49-57](https://user-images.githubusercontent.com/32430186/181902857-d4d10740-82fe-4941-b064-d436b9ea7317.png)


## Installation

### From Ego

Install extensions from [here](https://extensions.gnome.org/extension/5237/rounded-window-corners/).

### From source code

It will install extensions to `~/.local/share/gnome-shell/extensions`

```
git clone https://github.com/yilozt/rounded-window-corners
cd rounded-window-corners
yarn install && yarn ext:install
```

In NixOS, you can use `nix-shell` to setup development shell then install
extensions to `~/.local/share/gnome-shell/extensions`.

```
git clone https://github.com/yilozt/rounded-window-corners
cd rounded-window-corners
nix-shell
yarn install && yarn ext:install
```

### From Releases / Github Actions

Download extensions pack from [Releases](https://github.com/yilozt/rounded-window-corners/releases) Page, or download git version from [Github Actions](https://github.com/yilozt/rounded-window-corners/actions/workflows/pack.yml). After download extensions pack, you need use `gnome-extensions` to install it, then restart gnome-shell to enable this extensions.

[![](https://img.shields.io/github/v/release/yilozt/rounded-window-corners?style=flat-square)](https://github.com/yilozt/rounded-window-corners/releases)
[![](https://img.shields.io/github/workflow/status/yilozt/rounded-window-corners/Pack%20extensions?label=Pack%20extensions&style=flat-square)](https://github.com/yilozt/rounded-window-corners/actions/workflows/pack.yml)

```
gnome-extensions install rounded-window-corners@yilozt.shell-extension.zip
```

## Translations

To add new translations for extensions, you can add empty `.po` file to `po` directory, then use `yarn po` to fill it. 

```
touch po/zh_CN.po  # replace zh_CN to the locales you want to add
yarn po            # auto fill po file
vim po/zh_CN.po    # now let's start edit
```

You can run `yarn ext:install` to compile `.po` files and install extensions. if you are in XOrg sessions, just press `Alt + F2 -> r` to restart gnome-session to preview the result.

You can run `yarn dev` in your terminal to watch changes of `.po` files, once you have update `.po` files, it will compile and install extensions automatically.

## Development

### Build

```bash
yarn build 
```

### Watch files

Build and install extensions when files in `src` folder changed.

```
yarn dev
```

### Test in Virtual Box by Vagrant

Need to install [`Vagrant`](https://github.com/hashicorp/vagrant) and Virtual Box. This command will setup a virtual machine that enable log of extensions in terminal.

```
yarn vm
```
