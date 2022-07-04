#!/bin/bash

lib="/usr/lib/gnome-shell/libgnome-shell.so"

cd $(dirname $0)/../
mkdir -p shell_src
cd shell_src

for resource in $(gresource list $lib); do
    path=$(echo $resource| sed 's#/org/gnome/shell#.#')
    mkdir -p $(dirname $path)
    gresource extract $lib $resource > $path
done