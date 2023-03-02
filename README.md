<div align="center">
  <h1>Rounded Window Corners</h1>
  <p><i>A gnome-shell extensions that try to add rounded corners for all windows</i></p>
  <a href="https://extensions.gnome.org/extension/5237/rounded-window-corners/">
    <img src="https://img.shields.io/badge/Install%20from-extensions.gnome.org-4A86CF?style=for-the-badge&logo=Gnome&logoColor=white"/>
  </a>  
</div>

## Features

- Works with Gnome 40+
- Custom border radius and clip paddings for windows
- Black list for applications which draw window decoration itself
- Custom shadow for rounded corners windows
- Skip libadwaita / libhandy application
- [Superelliptical][1] shape for rounded corners, thanks to [@YuraIz][2]
- A simple reset preferences dialog

## Compatibility

- [_Compiz alike magic lamp effect_][3]
  
  Hide shadow when magic lamp effect running.
  Need to restart (disable then enable) this extension when
  _Compiz alike magic lamp effect_ enabled. 

## Notes

- The rounded corners effect for window is base on this [shader][4] from
  mutter project
- The TypeScript support for GJS is power by [gi.ts][5]

## Screenshots

![2022-07-29 23-49-57][6]


## Installation

### From Ego

Install extensions from [here][7].

### From source code

It will install extensions to `~/.local/share/gnome-shell/extensions`,
need to install `yarn`, Node.js and `gettext`

```bash
git clone https://github.com/yilozt/rounded-window-corners
cd rounded-window-corners
yarn install && yarn ext:install
```

In NixOS, you can use `nix-shell` to enter a development shell before
run `yarn install`.

You may need to install those packages when building this extensions. Feel free
to open issues if you got error.

```bash
sudo pacman -S nodejs yarn gettext        # Arch Linix
sudo apt install nodejs yarnpkg gettext   # Ubuntu
sudo dnf install nodejs yarnpkg gettext   # Fedora
```

### From Releases / Github Actions

Download extensions pack from [Releases][8] Page, or download git version from
[Github Actions][9]. After download extensions pack, you need use
`gnome-extensions` to install it, then restart gnome-shell to enable this
extensions.

[![release-badge][10]][8]
[![pack-padge][11]][9]

```bash
gnome-extensions install rounded-window-corners@yilozt.shell-extension.zip
```

## Translations

[![weblate-state][12]][13]

You can help translate this extensions by using [Weblate][13], or update po
files then open a pull request.

To add new translations for extensions, you can add `.po` files in `po`
directory via `msginit`, then use your favorite text editor to edit it.

```bash
cd po && msginit   # Add po file for new translations
```

You can run `yarn ext:install` or `yarn dev` to install extensions with with
new translations. In XOrg sessions, just press `Alt + F2 -> r` to restart
gnome-session then preview the result. In Wayland session, have to logout
session then login again to reload extensions.

`yarn dev` will watch changes of `.po` files, once you have update translations,
it will compile and install extensions automatically.

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

Need to install [`Vagrant`](https://github.com/hashicorp/vagrant) and
Virtual Box. This command will setup a virtual machine that enable log of
extensions in terminal.

```
yarn vm
```

<!-- links -->

[1]: https://en.wikipedia.org/wiki/Superellipse
[2]: https://github.com/YuraIz
[3]: https://extensions.gnome.org/extension/3740/compiz-alike-magic-lamp-effect/
[4]: https://gitlab.gnome.org/GNOME/mutter/-/blob/main/src/compositor/meta-background-content.c#L138
[5]: https://gitlab.gnome.org/ewlsh/gi.ts
[6]: https://user-images.githubusercontent.com/32430186/181902857-d4d10740-82fe-4941-b064-d436b9ea7317.png
[7]: https://extensions.gnome.org/extension/5237/rounded-window-corners/
[8]: https://github.com/yilozt/rounded-window-corners/releases
[9]: https://github.com/yilozt/rounded-window-corners/actions/workflows/pack.yml
[10]: https://img.shields.io/github/v/release/yilozt/rounded-window-corners?style=flat-square
[11]: https://img.shields.io/github/actions/workflow/status/yilozt/rounded-window-corners/pack.yml?branch=main&style=flat-square
[12]: https://hosted.weblate.org/widgets/rounded-window-corners/-/rounded-window-corners/multi-auto.svg
[13]: https://hosted.weblate.org/engage/rounded-window-corners/