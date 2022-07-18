// imports.gi
import * as GObject                from '@gi/GObject'
import { SnippetHook, GLSLEffect } from '@gi/Shell'

// local modules
import utils                       from '../utils'

// ------------------------------------------------------------------- [imports]

const { declarations, code } = utils.loadShader (
    import.meta.url,
    './shader/clip_shadow.frag'
)

class ClipShadowEffect extends GLSLEffect {
    vfunc_build_pipeline (): void {
        this.add_glsl_snippet (SnippetHook.FRAGMENT, declarations, code, false)
    }
}

export default GObject.registerClass ({}, ClipShadowEffect)
