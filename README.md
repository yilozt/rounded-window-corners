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

## Screenshots

![2022-07-29 23-49-57](https://user-images.githubusercontent.com/32430186/181902857-d4d10740-82fe-4941-b064-d436b9ea7317.png)


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
