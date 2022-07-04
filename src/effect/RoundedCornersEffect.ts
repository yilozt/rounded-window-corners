import { registerClass } from '@gi/gobject'
import { GLSLEffect } from '@gi/shell'
import { log } from 'mod'

export var RoundedCornersEffect = registerClass (
  {}, class RoundedCornersEffect extends GLSLEffect {
    vfunc_build_pipeline (): void {
      log ('vfunc_build_pipeline')
    }
  })
