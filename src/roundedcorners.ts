import { global } from '@global'

import * as Clutter                 from 'gi://Clutter'
import { Window, WindowActor }      from 'gi://Meta'
import { GLSLEffect, SnippetHook }  from 'gi://Shell'
import { Bin }                      from 'gi://St'
import { BindingFlags }             from 'gi://GObject'

import utils            from './utils'
import consts           from './consts'
import ClipShadowEffect from './effect/clip_shadow_effect'

const { dels, code } = utils.loadShader(
  import.meta.url,
  './effect/shader/rounded_corners.frag'
)

// Uniform locations
interface Uniforms {
  bounds: number,
  clip_radius: number,
  inner_bounds: number,
  inner_clip_radius: number,
  pixel_step: number,
  skip: number,
  border_width: number,
  border_brightness: number,
}
type UniformsKeys = keyof Uniforms

export class RoundedCornersManager {
  // Store connect handles of GObject, to disconnect when we needn't
  private map_connect?: number
  private close_connect?: number
  private restacked_connect?: number

  private resize_connects: Map<Window, number> = new Map()

  // shadow actors
  private shadows: Map<Window, Bin> = new Map()

  // Uniform locations of shaders
  private uniforms: Uniforms = {
    bounds: 0,
    clip_radius: 0,
    inner_bounds: 0,
    inner_clip_radius: 0,
    pixel_step: 0,
    skip: 0,
    border_width: 0,
    border_brightness: 0,
  }

  constructor() {

    // Init GLSLEffect and load shader
    const effect = new GLSLEffect()
    effect.add_glsl_snippet(SnippetHook.FRAGMENT, dels, code, false)
    this._init_uniforms(effect)
  }

  // Call When enable extension
  enable() {
    const wm = global.window_manager
    // Add effects when window opened
    this.map_connect = wm.connect('map', (_, actor) => {
      // Add rounded corners to window actor
      this._set_effect(actor)
      // Create shadow actor for window
      this._create_shadow(actor)

      // Update uniform variables when changed window size
      const source = actor.meta_window
      const handler = source.connect('size-changed', () => this.on_size_changed(actor))
      this.resize_connects.set(source, handler)
    })

    // Disconnect all signals of window when closed
    this.close_connect = wm.connect('destroy', (_, actor) => {
      const win = actor.meta_window
      const handler = this.resize_connects.get(win)
      if (handler) {
        win.disconnect(handler)
        this.resize_connects.delete(win)

        // Remove shadow actor
        const shadow = this.shadows.get(win)
        if (shadow) {
          this.shadows.delete(win)
          shadow.destroy()
        }
      }
    })

    // When windows restacked, change order of shadow actor too
    this.restacked_connect = global.display.connect('restacked', () => {
      global.get_window_actors().forEach(actor => {
        if (!actor.visible) {
          return
        }
        const shadow = this.shadows.get(actor.metaWindow)
        if (shadow) {
          global.windowGroup.set_child_above_sibling(shadow, actor)
        }
      })
    })
  }
  disable() {
    this.map_connect && global.window_manager.disconnect(this.map_connect)
    this.close_connect && global.window_manager.disconnect(this.close_connect)
    this.restacked_connect && global.display.disconnect(this.restacked_connect)
    this.resize_connects.forEach((handler, actor) => actor.disconnect(handler))
    this.resize_connects.clear()
  }

  query_shadow(win: Window): Bin | undefined {
    return this.shadows.get(win)
  }

  on_size_changed(actor: WindowActor): void {
    const win = actor.meta_window

    // When size changed. update uniforms for window
    this._update_uniforms(actor, { outer_bounds: this._compute_bounds(actor) })

    // Update BindConstraint for shadow
    const shadow = this.shadows.get(win)
    if (!shadow) {
      return
    }
    const offsets = this._compute_shadow_actor_offset(actor)
    const constraints = shadow.get_constraints()
    constraints.forEach((constraint, i) => {
      if (constraint instanceof Clutter.BindConstraint) {
        constraint.offset = offsets[i]
      }
    })
  }

  private _set_effect(actor: WindowActor) {
    const effect = new GLSLEffect()
    actor.add_effect_with_name(consts.ROUNDED_CORNERS_EFFECT, effect)

    // Todo extract GLSLEffect to a class
    this._update_uniforms(actor, {
      outer_bounds: this._compute_bounds(actor)
    })
  }

  private _init_uniforms(effect: GLSLEffect) {
    this.uniforms = {
      bounds: 0,
      clip_radius: 0,
      inner_bounds: 0,
      inner_clip_radius: 0,
      pixel_step: 0,
      skip: 0,
      border_width: 0,
      border_brightness: 0,
    }
    Object.keys(this.uniforms).forEach(k => {
      if (!this.uniforms) return
      this.uniforms[k as UniformsKeys] = effect.get_uniform_location(k)
    })
  }

  private _update_uniforms(
    actor: WindowActor,
    cfg?: EffectConfig,
  ) {
    const effect = actor.get_effect(consts.ROUNDED_CORNERS_EFFECT) as GLSLEffect | null
    if (!effect || !this.uniforms) {
      return
    }

    const _cfg: EffectConfig = {
      outer_bounds: { left: 0, top: 0, right: actor.width, bottom: actor.height },
      paddings: { left: 0, top: 0, right: 0, bottom: 0 },
      ...cfg
    }
    const { outer_bounds, paddings } = _cfg
    if (!outer_bounds || !paddings) {
      throw Error('Missing config to update uniforms')
    }

    // Todo: Test in HDPI
    const scale_factor = utils.scaleFactor()

    const border_width = 0
    const radius = 40
    const skip = false
    const border_brightness = 0

    const bounds = [
      outer_bounds.left + paddings.left,
      outer_bounds.top + paddings.top,
      outer_bounds.right - paddings.right,
      outer_bounds.bottom - paddings.bottom,
    ]

    const inner_bounds = [
      bounds[0] + border_width, bounds[1] + border_width,
      bounds[2] - border_width, bounds[3] - border_width
    ]

    let inner_radius = radius - border_width
    if (inner_radius < 0.001) {
      inner_radius = 0.0
    }

    const pixel_step = [1 / actor.get_width(), 1 / actor.get_height()]
    const _skip = skip ? 1 : 0

    effect.set_uniform_float(this.uniforms.bounds, 4, bounds)
    effect.set_uniform_float(this.uniforms.inner_bounds, 4, inner_bounds)
    effect.set_uniform_float(this.uniforms.pixel_step, 2, pixel_step)
    effect.set_uniform_float(this.uniforms.border_width, 1, [border_width])
    effect.set_uniform_float(this.uniforms.clip_radius, 1, [radius * scale_factor])
    effect.set_uniform_float(this.uniforms.border_brightness, 1, [border_brightness])
    effect.set_uniform_float(this.uniforms.inner_clip_radius, 1, [inner_radius])
    effect.set_uniform_float(this.uniforms.skip, 1, [_skip])
    effect.queue_repaint()
  }

  private _compute_bounds(actor: WindowActor): Bounds {
    const win = actor.meta_window
    const [x, y, width, height] = utils.computeWindowContentsOffset(win)
    return {
      left: x + 1,
      top: y + 1,
      right: x + actor.width + width,
      bottom: y + actor.height + height
    }
  }

  private _create_shadow(actor: WindowActor) {
    const style = 'box-shadow: -19px -23px 9px -7px rgba(0,0,0,0.75);'

    const shadow = new Bin({
      style: `padding: ${consts.SHADOW_PADDING}px; background: yellow; opacity: 0.8;`,
      child: new Bin({
        x_expand: true,
        y_expand: true,
        // TODO: make it configuable
        style: 'background: white; border-radius: 40px;' + style
      })
    })
    // We have to clip the shadow because of this issues:
    // https://gitlab.gnome.org/GNOME/gnome-shell/-/issues/4474
    shadow.add_effect_with_name(consts.CLIP_SHADOW_EFFECT, new ClipShadowEffect())

    const flag = BindingFlags.SYNC_CREATE

    for (const prop of [
      'pivot-point', 'visible', 'opacity',
      'translation-x', 'translation-y',
    ]) {
      actor.bind_property(prop, shadow, prop, flag)
    }

    // Insert shadow actor below window actor, now shadow actor
    // will show below window actor
    actor.get_parent()
      ?.insert_child_above(shadow, actor)

    // Add shadow into map so we can manager it later
    this.shadows.set(actor.metaWindow, shadow)

    // Bind position and size
    this._bind_shadow_constraint(actor, shadow)
  }

  private _compute_shadow_actor_offset(actor: WindowActor): number[] {
    const [offset_x, offset_y, offset_width, offset_height]
      = utils.computeWindowContentsOffset(actor.metaWindow)
    const shadow_padding = consts.SHADOW_PADDING * utils.scaleFactor()
    return [
      offset_x - shadow_padding,
      offset_y - shadow_padding,
      2 * shadow_padding + offset_width,
      2 * shadow_padding + offset_height
    ]
  }

  private _bind_shadow_constraint(actor: WindowActor, shadow: Bin) {
    const offsets = this._compute_shadow_actor_offset(actor)
    const coordinates = [
      Clutter.BindCoordinate.X, Clutter.BindCoordinate.Y,
      Clutter.BindCoordinate.WIDTH, Clutter.BindCoordinate.HEIGHT
    ]
    coordinates.map((coordinate, i) => new Clutter.BindConstraint({
      source: actor,
      coordinate,
      offset: offsets[i]
    })).forEach(constraint => shadow.add_constraint(constraint))
  }
}

interface Bounds {
  left: number,
  right: number,
  top: number,
  bottom: number,
}
type Paddings = Bounds
interface EffectConfig {
  paddings?: Paddings,
  outer_bounds?: Bounds,
}
