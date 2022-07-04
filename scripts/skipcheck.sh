#!/bin/bash

# This script is used by build:types in packages.json.
#
# Let typescript skip check error @gi folder when compiling by
# add `// #ts-nocheck` to first line.

cd $(dirname $0)/../@gi

for file in $(ls .); do
  sed -i '1i// @ts-nocheck' $file
done
