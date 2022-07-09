import * as GLib from 'gi://GLib'
import * as Gio  from 'gi://Gio'
import * as Meta from 'gi://Meta'

import ByteArray from '@imports/byteArray'

const load = (path: string): string => {
  const buffer = GLib.file_get_contents(path)[1]

  const contents = ByteArray.toString(buffer)
  GLib.free(buffer)
  return contents
}

/**
 * Load file for ES module with relative path
 *
 * @param {string} mod_url The path the modules located, usually is `import.meta.url`
 * @param {string} relative_path relative path of file to load
 * @returns {string}file contents.
 */
export const loadFile = (mod_url: string,  relative_path: string): string => {
  const mod_dir = Gio.File.new_for_uri(mod_url).get_parent()?.get_path()
  return load(`${mod_dir}/${relative_path}`)
}

type Shader = {
  dels: string
  main: string
}

export const loadShader = (mod_url: string, relative_path: string): Shader => {
  let [dels, main] = loadFile(mod_url, relative_path)
    .split(/^.*?main\(\s?\)\s?/m)

  dels = dels.trim()
  main = main.trim().replace(/^[{}]/gm, '').trim()
  return { dels, main }
}

export const computeOffset = (meta_window: Meta.Window) => {
  const bufferRect = meta_window.get_buffer_rect()
  const frameRect  = meta_window.get_frame_rect()
  return [
    frameRect.x - bufferRect.x,
    frameRect.y - bufferRect.y,
    frameRect.width - bufferRect.width,
    frameRect.height - bufferRect.height
  ]
}

export enum AppType {
  LibHandy,
  LibAdwaita,
  Other
}

export const getAppType = (meta_window: Meta.Window): AppType => {
  const contents = load(`/proc/${meta_window.get_pid()}/maps`)

  if (contents.match(/libhandy.*?so/)) {
    return AppType.LibHandy
  } else if (contents.match(/libadwaita.*?so/)) {
    return AppType.LibAdwaita
  } else {
    return AppType.Other
  }
}

export default {
  loadFile, loadShader, computeOffset, getAppType, AppType
}
