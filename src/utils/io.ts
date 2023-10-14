import * as Gio from 'gi://Gio'

import { _log, _logError } from './log.js'

// --------------------------------------------------------------- [end imports]

export const load = (path: string): string => {
  const file = Gio.File.new_for_path (path)

  const [, contents, ] = file.load_contents (null)

  const decoder = new TextDecoder ('utf-8')
  return decoder.decode (contents)
}

export const path = (mod_url: string, relative_path: string) => {
  const parent = Gio.File.new_for_uri (mod_url).get_parent ()

  const mod_dir = parent?.get_path ()
  return Gio.File.new_for_path (`${mod_dir}/${relative_path}`).get_path () ?? ''
}

export const uri = (mod_url: string, relative_path: string) => {
  const parent = Gio.File.new_for_uri (mod_url).get_parent ()

  const mod_uri = parent?.get_uri ()
  return `${mod_uri}/${relative_path}`
}

export const loadFile = (mod_url: string, relative_path: string) =>
  load (path (mod_url, relative_path) ?? '')

export const loadShader = (mod_url: string, relative_path: string) => {
  let [declarations, main] = load (path (mod_url, relative_path) ?? '').split (
    /^.*?main\(\s?\)\s?/m
  )

  declarations = declarations.trim ()
  main = main.trim ().replace (/^[{}]/gm, '').trim ()
  return { declarations, code: main }
}
