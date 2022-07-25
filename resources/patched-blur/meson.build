project('lib-patched-blureffect', 'c',
  version: '0.1',
  license: 'GPLv2+'
)

# Match version of gnome-shell dynamically
r = run_command('gnome-shell', '--version').stdout()
version = r.split(' ')[2].split('.')[0].to_int() - 32
message(':: Gnome shell version: ', r)
message(':: Fetch Api version: ', version)

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

mutter_clutter_dep = dependency('mutter-clutter-@0@'.format(version))
mutter_dep = dependency('libmutter-@0@'.format(version))
mutter_typelibdir = mutter_dep.get_variable('typelibdir')

prefix = get_option('prefix')
libdir = join_paths(prefix, get_option('libdir'))
pkglibdir = join_paths(libdir, 'patched-blur-effect')

lib = library('patched-blureffect', 
  sources: sources,
  dependencies: [mutter_clutter_dep, mutter_dep],
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
    'Clutter-@0@'.format(version),
    'Meta-@0@'.format(version),
  ],
  install: true,
  install_dir_gir: pkglibdir,
  install_dir_typelib: pkglibdir,
)