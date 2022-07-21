// imports.gi
import { Point }                 from '@gi/Graphene'
import { Window, WindowActor }   from '@gi/Meta'
import { BindConstraint, Clone } from '@gi/Clutter'
import { WM }                    from '@gi/Shell'

// gnome-shell modules
import { Workspace }             from '@imports/ui/workspace'
import { WindowPreview }         from '@imports/ui/windowPreview'
import { WorkspaceGroup }        from '@imports/ui/workspaceAnimation'
import { WindowManager }         from '@imports/ui/windowManager'
import { openPrefs }             from '@imports/misc/extensionUtils'

// local modules
import constants                 from './utils/constants'
import { RoundedCornersManager } from './rounded-corners-manager'
import { _log as log }           from './utils/log'
import { scaleFactor }           from './utils/ui'
import * as WindowPicker         from './utils/pick-window'
import { connections }           from './connections'

// --------------------------------------------------------------- [end imports]
export class Extension {
    private _orig_add_window_clone !: (_: Window) => WindowPreview
    private _switch_ws_patch       !: () => void
    private _size_changed_patch    !: (wm: WM, actor: WindowActor) => void
    private _rounded_corners_manager = new RoundedCornersManager ()

    constructor () {
        log (constants.LOADED_MSG)
    }

    enable () {
        openPrefs ()

        this._orig_add_window_clone = Workspace.prototype._addWindowClone
        this._switch_ws_patch = WorkspaceGroup.prototype._createWindows
        this._size_changed_patch = WindowManager.prototype._sizeChangeWindowDone

        this._rounded_corners_manager.enable ()
        WindowPicker.init ()

        const self = this

        // When there is new window added into overview, this function will be
        // called. We need add our shadow actor for rounded corners windows.
        Workspace.prototype._addWindowClone = function (window) {
            const clone = self._orig_add_window_clone.apply (this, [window])
            const window_container = clone.window_container

            const source = self._rounded_corners_manager.query_shadow (window)

            if (!source) {
                return clone
            }

            const pivot_point = new Point ({ x: 0.5, y: 0.5 })
            const shadow_clone = new Clone ({
                source,
                pivot_point,
            })
            log (
                `shadow of window ${window} => ` +
                    `${self._rounded_corners_manager.query_shadow (window)}`
            )

            for (const prop of ['scale-x', 'scale-y']) {
                window_container.bind_property (prop, shadow_clone, prop, 0)
            }

            for (let i = 0; i < 4; i++) {
                shadow_clone.add_constraint (
                    new BindConstraint ({
                        coordinate: i,
                        source: window_container,
                    })
                )
            }

            window_container.connect ('notify::width', () => {
                const paddings =
                    (window_container.width / window.get_frame_rect ().width) *
                    (constants.SHADOW_PADDING * scaleFactor ())

                shadow_clone.get_constraints ().forEach ((_c, i) => {
                    const c = _c as BindConstraint
                    c.offset = i < 2 ? -paddings : paddings * 2
                })
            })

            clone.insert_child_above (shadow_clone, window_container)

            return clone
        }

        // Switching workspace
        WorkspaceGroup.prototype._createWindows = function () {
            self._switch_ws_patch.apply (this)

            this._windowRecords.forEach (({ windowActor: actor, clone }) => {
                const win = actor.meta_window
                const shadow = self._rounded_corners_manager.query_shadow (win)

                if (!shadow) {
                    return
                }

                const shadow_clone = new Clone ({ source: shadow })
                const paddings = constants.SHADOW_PADDING * scaleFactor ()

                log (`shadow of window ${win} => `, shadow)

                const frame_rect = win.get_frame_rect ()
                shadow_clone.width = frame_rect.width + paddings * 2
                shadow_clone.height = frame_rect.height + paddings * 2
                shadow_clone.x = clone.x + frame_rect.x - actor.x - paddings
                shadow_clone.y = clone.y + frame_rect.y - actor.y - paddings

                clone.connect (
                    'notify::translation-z',
                    () =>
                        (shadow_clone.translation_z =
                            clone.translation_z + 0.003)
                )

                shadow_clone.connect ('destroy', () =>
                    log ('Switching ws' + shadow_clone + 'has destroy')
                )

                this.insert_child_above (shadow_clone, clone)
            })
            log (this._windowRecords)
        }

        // Window Size Changed
        WindowManager.prototype._sizeChangeWindowDone = function (
            shell_wm,
            actor
        ) {
            self._size_changed_patch.apply (this, [shell_wm, actor])
            // Update shadow actor
            self._rounded_corners_manager.on_size_changed (actor)
            self._rounded_corners_manager._on_focus_changed (actor.meta_window)
        }
    }

    disable () {
        // Restore patched methods
        Workspace.prototype._addWindowClone = this._orig_add_window_clone
        WorkspaceGroup.prototype._createWindows = this._switch_ws_patch
        WindowManager.prototype._sizeChangeWindowDone = this._size_changed_patch

        this._rounded_corners_manager.disable ()

        connections ().disconnect_all ()
    }
}
