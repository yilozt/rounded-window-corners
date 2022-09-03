// imports.gi
import * as GObject                from '@gi/GObject'
import { SnippetHook, GLSLEffect } from '@gi/Shell'

// local modules
import { loadShader }              from '@me/utils/io'

// types
import { Me }                      from '@global'

// ------------------------------------------------------------------- [imports]

const { declarations, code } = loadShader (
    `${Me.path}/effect/shader/clip_shadow.frag`
)

export const ClipShadowEffect = GObject.registerClass (
    {},
    class extends GLSLEffect {
        vfunc_build_pipeline (): void {
            this.add_glsl_snippet (
                SnippetHook.FRAGMENT,
                declarations,
                code,
                false
            )
        }
    }
)
