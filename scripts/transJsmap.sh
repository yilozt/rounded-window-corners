#!/bin/bash

cd $(dirname $0)/../_build

for file in $(find . -name '*.js.map'); do
  sed -i 's#../src#./debug/src#' "$file"
done
