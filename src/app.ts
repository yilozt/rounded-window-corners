import { log } from '@global'

import { Settings }               from 'gi://Gio'
import { Point }                  from 'gi://Graphene'
import { Window, WindowActor }    from 'gi://Meta'
import { BindConstraint, Clone }  from 'gi://Clutter'
import { WM }                     from 'gi://Shell'

import { Workspace }      from '@imports/ui/workspace'
import { WindowPreview }  from '@imports/ui/windowPreview'
import { WorkspaceGroup } from '@imports/ui/workspaceAnimation'
import { WindowManager }  from '@imports/ui/windowManager'

import consts                    from './consts'
import { RoundedCornersManager } from './roundedcorners'
import utils                     from './utils'

export class Extension {
  private _origAddWindowClone!: (_: Window) => WindowPreview
  private _origCreateWindows!:  () => void
  private _origSizeChangeWindowDown!: (wm: WM, actor: WindowActor) => void

  private _rounded_corners = new RoundedCornersManager()
  private _settings!: Settings

  constructor() {
    log(consts.LOADED_MSG)
  }

  enable() {
    this._origAddWindowClone       = Workspace.prototype._addWindowClone
    this._origCreateWindows        = WorkspaceGroup.prototype._createWindows
    this._origSizeChangeWindowDown = WindowManager.prototype._sizeChangeWindowDone
    this._rounded_corners.enable()

    const extensionThis = this

    // Overview
    Workspace.prototype._addWindowClone = function(meta_window) {
      const clone: WindowPreview =
        extensionThis._origAddWindowClone.apply(this, [meta_window])
      const window_container = clone.window_container

      const source = extensionThis._rounded_corners.query_shadow(meta_window)

      if (!source) {
        return clone
      }

      const shadowActor = new Clone({
        source,
        pivot_point: new Point({ x: 0.5, y: 0.5 })
      })
      log(`shadow of window ${meta_window} => ` +
           `${extensionThis._rounded_corners.query_shadow(meta_window)}`)

      window_container.bind_property('scale-x', shadowActor, 'scale-x', 0)
      window_container.bind_property('scale-y', shadowActor, 'scale-y', 0)

      for (let i = 0; i < 4; i++) {
        shadowActor.add_constraint(new BindConstraint({
          coordinate: i,
          source: window_container
        }))
      }

      window_container.connect('notify::width', () => {
        const paddings = window_container.width
          / meta_window.get_frame_rect().width
          * consts.SHADOW_PADDING * utils.scaleFactor()

        shadowActor.get_constraints().forEach((_c, i) => {
          const c = _c as BindConstraint
          c.offset = i < 2 ? -paddings : paddings * 2
        })
      })

      clone.insert_child_above(shadowActor, window_container)

      shadowActor.connect('destroy', () =>
        log('Switching ws' + shadowActor + 'has destroy')
      )

      return clone
    }

    // Switching workspace
    WorkspaceGroup.prototype._createWindows = function() {
      extensionThis._origCreateWindows.apply(this)

      this._windowRecords.forEach(({ windowActor, clone }) => {
        const win = windowActor.metaWindow
        const shadow = extensionThis._rounded_corners.query_shadow(win)

        if (!shadow) {
          return
        }

        const shadow_clone = new Clone({ source: shadow })
        const shadow_paddings = consts.SHADOW_PADDING * utils.scaleFactor()

        log(`shadow of window ${win} => `, shadow)

        const frame_rect = win.get_frame_rect()
        shadow_clone.width  = frame_rect.width  + shadow_paddings * 2
        shadow_clone.height = frame_rect.height + shadow_paddings * 2
        shadow_clone.x = clone.x + frame_rect.x - windowActor.x - shadow_paddings
        shadow_clone.y = clone.y + frame_rect.y - windowActor.y - shadow_paddings

        clone.connect(
          'notify::translation-z',
          () => shadow_clone.translation_z = clone.translation_z + 0.003
        )

        shadow_clone.connect('destroy', () =>
          log('Switching ws' + shadow_clone + 'has destroy')
        )

        this.insert_child_above(shadow_clone, clone)
      })
      log(this._windowRecords)
    }

    // Window Size Changed
    WindowManager.prototype._sizeChangeWindowDone = function(shellwm, actor: WindowActor) {
      extensionThis._origSizeChangeWindowDown.apply(this, [shellwm, actor])
      // Update shadow actor
      extensionThis._rounded_corners.on_size_changed(actor)
    }
  }

  disable() {
    Workspace.prototype._addWindowClone           = this._origAddWindowClone
    WorkspaceGroup.prototype._createWindows       = this._origCreateWindows
    WindowManager.prototype._sizeChangeWindowDone = this._origSizeChangeWindowDown
    this._rounded_corners.disable()
  }
}
