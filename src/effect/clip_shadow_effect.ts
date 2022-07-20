import * as GObject from 'gi://GObject'
import * as Shell   from 'gi://Shell'

import utils        from '../utils'

const { dels, code } = utils.loadShader(import.meta.url, './shader/clip_shadow.frag')

export default GObject.registerClass({}, class ClipShadowEffect extends Shell.GLSLEffect {
  vfunc_build_pipeline(): void {
    this.add_glsl_snippet(Shell.SnippetHook.FRAGMENT, dels, code, false)
  }
})
