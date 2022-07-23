type Deps = {
    [id: string]: string
}

export default {
    arch: 'sudo pacman -S meson glib2 gobject-introspection',
    fedora:
        'sudo dnf install meson glib2-devel mutter-devel' +
        ' gobject-introspection-devel',
} as Deps
