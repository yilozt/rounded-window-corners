import { Actor }                   from '@gi/Clutter'
import { Binding }                 from '@gi/GObject'
import { ShadowMode, WindowActor } from '@gi/Meta'
import { Bin }                     from '@gi/St'
import * as Graphene               from '@gi/Graphene'
import { SchemasKeys }             from '@me/utils/settings'

/** Bounds of rounded corners  */
export class Bounds {
  x1 = 0
  y1 = 0
  x2 = 0
  y2 = 0
}

export class Padding {
  left = 0
  right = 0
  top = 0
  bottom = 0
}

/** Store into settings, rounded corners configuration  */
export interface RoundedCornersCfg {
  keep_rounded_corners: {
    maximized: boolean
    fullscreen: boolean
  }
  border_radius: number
  smoothing: number
  padding: Padding
  enabled: boolean
}

export interface CustomRoundedCornersCfg {
  [wm_class_instance: string]: RoundedCornersCfg
}

export interface BoxShadow {
  opacity: number
  spread_radius: number
  blur_offset: number
  vertical_offset: number
  horizontal_offset: number
}

export const box_shadow_css = (box_shadow: BoxShadow, scale = 1) => {
  return `box-shadow: ${box_shadow.horizontal_offset * scale}px
          ${box_shadow.vertical_offset * scale}px
          ${box_shadow.blur_offset * scale}px
          ${box_shadow.spread_radius * scale}px
          rgba(0,0,0, ${box_shadow.opacity / 100})`
}

export interface EffectManager {
  enabled: boolean
  on_settings_changed(key: SchemasKeys): void
  on_add_effect(actor: ExtensionsWindowActor): void
  on_remove_effect(actor: ExtensionsWindowActor): void
  on_minimize(actor: ExtensionsWindowActor): void
  on_unminimize(actor: ExtensionsWindowActor): void
  on_restacked(actor: ExtensionsWindowActor): void
  on_size_changed(actor: ExtensionsWindowActor): void
  on_focus_changed(actor: ExtensionsWindowActor): void
  on_switch_workspace?: (actor: ExtensionsWindowActor) => void
}

export type ExtensionsWindowActor = WindowActor & {
  __rwc_rounded_window_info?: {
    shadow: Bin
    visible_binding: Binding
  }
  __rwc_blurred_window_info?: {
    blur_actor: Actor
    visible_binding: Binding
  }
  shadow_mode?: ShadowMode
  __rwc_last_size?: Graphene.Size
}
