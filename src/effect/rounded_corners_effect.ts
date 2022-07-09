import { log } from '@global'
import { Variant, VariantType } from 'gi://GLib'
import { ParamFlags, ParamSpec, param_spec_variant, registerClass } from 'gi://GObject'
import { GLSLEffect, SnippetHook } from 'gi://Shell'
import { Actor, PaintContext, PaintNode } from 'gi://Clutter'
import * as Meta from 'gi://Meta'

import { loadShader } from '../utils'

interface Paddings {
  'left': number,
  'right': number,
  'top':  number,
  'bottom': number,
  [key: string]: number,
}

export interface Bounds {
  left: number,
  right: number,
  top: number,
  bottom: number,
}

const DEFAULTS = {
  radius: 12,
  border_width: 0,
  border_brightness: 0,
  padding: new Variant(
    'a{su}', { 'left': 0, 'right': 0, 'top': 0, 'bottom': 0 }
  ),
  skip: false
}

type Uniforms = {
  bounds: number,
  clip_radius: number,
  inner_bounds: number,
  inner_clip_radius: number,
  pixel_step: number,
  skip: number,
  border_width: number,
  border_brightness: number
}
type UniformsKeys = keyof Uniforms

// We will load our shader from './shader' floder
const shader_vert = loadShader(import.meta.url, './shader/rounded_corners.vert')
const shader_frag = loadShader(import.meta.url, './shader/rounded_corners.frag')

export class RoundedCornersEffectClass extends GLSLEffect {
  private _uniforms !: Uniforms

  private radius            !: number
  private border_width      !: number
  private border_brightness !: number
  private padding           !: Variant
  private skip              !: boolean

  _init(): void {
    this._uniforms = {
      bounds: 0,
      clip_radius: 0,
      inner_bounds: 0,
      inner_clip_radius: 0,
      pixel_step: 0,
      skip: 0,
      border_width: 0,
      border_brightness: 0
    }

    super._init()
  }

  vfunc_build_pipeline(): void {
    this.add_glsl_snippet(SnippetHook.FRAGMENT, shader_frag.dels, shader_frag.main, false)
    this.load_uniforms()
  }

  vfunc_set_actor(actor?: Actor): void {
    if (actor) {
      super.vfunc_set_actor(actor)
      // this.update_uniforms()
    }
  }

  update_uniforms(paddings?: Paddings | null) {
    const pipeline  = this.get_pipeline()
    const uniforms  = this._uniforms
    const actor     = this.get_actor()
    if (!actor || !pipeline) {
      return
    }

    const [ w, h ]  = this.get_actor().get_size()

    if (!w || !h) { return }

    let bounds = null
    if (paddings) {
      const { left, right, bottom, top } = paddings
      bounds = [ left, top, w - right, h - bottom]
    } else {
      bounds = [0, 0, w, h]
    }

    const inner_bounds = [
      bounds[0] + this.border_width, bounds[1] + this.border_width,
      bounds[2] - this.border_width, bounds[3] - this.border_width
    ]

    let inner_radius = this.radius - this.border_width
    if (inner_radius < 0.001) {
      inner_radius = 0.0
    }

    const pixel_step   = [1 / w, 1 / h]
    const skip         = this.skip ? 1 : 0

    this.set_uniform_float(uniforms.bounds,            4, bounds)
    this.set_uniform_float(uniforms.inner_bounds,      4, inner_bounds)
    this.set_uniform_float(uniforms.pixel_step,        2, pixel_step)
    this.set_uniform_float(uniforms.border_width,      1, [this.border_width])
    this.set_uniform_float(uniforms.clip_radius,       1, [this.radius])
    this.set_uniform_float(uniforms.border_brightness, 1, [this.border_brightness])
    this.set_uniform_float(uniforms.inner_clip_radius, 1, [inner_radius])
    this.set_uniform_float(uniforms.skip,              1, [skip])
  }

  // private_stuff
  private load_uniforms() {
    Object.keys(this._uniforms).forEach(name => {
      this._uniforms[name as UniformsKeys] = this.get_uniform_location(name)
    })
  }

  vfunc_paint_target(node: PaintNode, paint_context: PaintContext): void {
    this.update_uniforms()
    super.vfunc_paint_target(node, paint_context)
  }
}

export const RoundedCornersEffect = registerClass(
  {
    Properties: {
      'radius': ParamSpec.uint('radius', 'radius', 'radius',
        ParamFlags.READWRITE,
        0, 100000, DEFAULTS.radius
      ),
      'border-width': ParamSpec.uint(
        'border-width', 'border-width', 'border-width',
        ParamFlags.READWRITE,
        0, 1000, DEFAULTS.border_width
      ),
      'border-brightness': ParamSpec.uint(
        'border-brightness', 'border-brightness', 'border-brightness',
        ParamFlags.READWRITE,
        0, 1000, DEFAULTS.border_brightness
      ),
      'padding': param_spec_variant(
        'padding', 'Padding', 'padding',
        new VariantType('a{su}'),
        DEFAULTS.padding,
        ParamFlags.READWRITE
      ),
      'skip': ParamSpec.boolean(
        'skip', 'skip', 'skip', ParamFlags.READWRITE, DEFAULTS.skip
      ),
    }
  },
  RoundedCornersEffectClass
)
