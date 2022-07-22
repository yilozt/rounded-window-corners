project('lib-patched-blureffect', 'c',
  version: '0.1',
  license: 'GPLv2+'
)

gnome = import('gnome')

enums = gnome.mkenums_simple('shell-enum-types',
  sources: [
    'patched-blur-effect.h',
  ]
)

sources = [
  'patched-blur-effect.c',
  'patched-blur-effect.h',
  enums,
]

mutter_cogl_dep = dependency('mutter-clutter-10')
mutter_dep = dependency('libmutter-10')
mutter_typelibdir = mutter_dep.get_variable('typelibdir')

prefix = get_option('prefix')
libdir = join_paths(prefix, get_option('libdir'))
pkglibdir = join_paths(libdir, 'patched-blur-effect')

lib = library('patched-blureffect', 
  sources: sources,
  dependencies: [mutter_cogl_dep, mutter_dep],
  install: true,
  build_rpath: mutter_typelibdir,
  install_rpath: mutter_typelibdir,
  install_dir: pkglibdir
)

gnome.generate_gir(lib,
  sources: sources,
  namespace: 'Patched',
  nsversion: '0.1',
  identifier_prefix: 'Patched',
  symbol_prefix: 'patched',
  includes: [
    'GObject-2.0',
    'Clutter-10',
    'Meta-10',
  ],
  install: true,
  install_dir_gir: pkglibdir,
  install_dir_typelib: pkglibdir,
)