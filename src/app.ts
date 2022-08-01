// imports.gi
import { Point }                       from '@gi/Graphene'
import { BindConstraint, Clone }       from '@gi/Clutter'
import { Source, timeout_add_seconds } from '@gi/GLib'
import { MonitorManager }              from '@gi/Meta'

// gnome-shell modules
import { Workspace }                   from '@imports/ui/workspace'
import { WorkspaceGroup }              from '@imports/ui/workspaceAnimation'
import { WindowManager }               from '@imports/ui/windowManager'
import BackgroundMenu                  from '@imports/ui/backgroundMenu'
import { sessionMode }                 from '@imports/ui/main'

// local modules
import constants                       from './utils/constants'
import { RoundedCornersManager }       from './manager/rounded-corners-manager'
import { _log as log }                 from './utils/log'
import { AddBackgroundMenuItem }       from './utils/ui'
import { RestoreBackgroundMenu }       from './utils/ui'
import { SetupBackgroundMenu }         from './utils/ui'
import { WindowScaleFactor }           from './utils/ui'
import { ChoiceRoundedCornersCfg }     from './utils/ui'
import Connections                     from './utils/connections'
import settings                        from './utils/settings'
import Services                        from './dbus/services'

// types, which will be removed in output
import { WM }                          from '@gi/Shell'
import { WindowPreview }               from '@imports/ui/windowPreview'
import { RoundedCornersCfg }           from './utils/types'
import { Window, WindowActor }         from '@gi/Meta'

// --------------------------------------------------------------- [end imports]
export class Extension {
    // The methods of gnome-shell to monkey patch
    private _orig_add_window_clone !: (_: Window) => WindowPreview
    private _switch_ws_patch       !: () => void
    private _size_changed_patch    !: (wm: WM, actor: WindowActor) => void
    private _add_background_menu   !: typeof BackgroundMenu.addBackgroundMenu

    private _services: Services | null = null
    private _rounded_corners_manager: RoundedCornersManager | null = null

    private _timeout_handler = 0

    constructor () {
        // Show loaded message in debug mode
        log (constants.LOADED_MSG)
    }

    enable () {
        // Restore original methods, those methods will be restore when
        // extensions is disabled
        this._orig_add_window_clone = Workspace.prototype._addWindowClone
        this._switch_ws_patch = WorkspaceGroup.prototype._createWindows
        this._size_changed_patch = WindowManager.prototype._sizeChangeWindowDone
        this._add_background_menu = BackgroundMenu.addBackgroundMenu

        this._services = new Services ()
        this._rounded_corners_manager = new RoundedCornersManager ()

        this._services.export ()
        this._enable_effect_managers ()

        // Have to toggle fullscreen for all windows when changed scale factor
        // of windows because rounded-corners-manager may got incorrect frame
        // rect & buffer rect to calculate position of shadow & bound of rounded
        // corners.
        // FIXME: This is an ugly way but works. Should found a better way to
        // solve this problem.

        const monitor_manager = MonitorManager.get ()
        Connections.get ().connect (monitor_manager, 'monitors-changed', () => {
            if (sessionMode.isLocked || sessionMode.isGreeter) {
                return
            }
            for (const win of this._rounded_corners_manager?.windows () ?? []) {
                (win as Window & { __fs?: 1 }).__fs = 1
                win.make_fullscreen ()
            }

            // waiting 3 seconds then restore marked windows.
            this._timeout_handler = timeout_add_seconds (0, 3, () => {
                for (const _win of this._rounded_corners_manager?.windows () ??
                    []) {
                    const win = _win as Window & { __fs?: 1 }
                    if (win && win.__fs == 1) {
                        win.unmake_fullscreen ()
                        delete win.__fs
                    }
                }
                return false
            })
        })

        const self = this

        // When there is new window added into overview, this function will be
        // called. We need add our shadow actor and blur actor of rounded
        // corners window into overview.
        Workspace.prototype._addWindowClone = function (window) {
            const clone = self._orig_add_window_clone.apply (this, [window])
            const window_container = clone.window_container

            let cfg: RoundedCornersCfg | null = null
            let has_rounded_corners = false

            const shadow = self._rounded_corners_manager?.query_shadow (window)

            if (shadow) {
                cfg = ChoiceRoundedCornersCfg (
                    settings ().global_rounded_corner_settings,
                    settings ().custom_rounded_corner_settings,
                    window
                )
                const maximized =
                    window.maximized_horizontally ||
                    window.maximized_vertically ||
                    window.fullscreen
                has_rounded_corners = cfg.keep_rounded_corners || !maximized
            }
            if (shadow && has_rounded_corners) {
                const source = shadow
                const pivot_point = new Point ({ x: 0.5, y: 0.5 })
                const shadow_clone = new Clone ({ source, pivot_point })

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
                        (window_container.width /
                            window.get_frame_rect ().width) *
                        (constants.SHADOW_PADDING * WindowScaleFactor (window))

                    shadow_clone.get_constraints ().forEach ((_c, i) => {
                        const c = _c as BindConstraint
                        c.offset = i < 2 ? -paddings : paddings * 2
                    })
                })

                clone.insert_child_above (shadow_clone, window_container)
            }

            return clone
        }

        // Just Like the monkey patch when enter overview, need to add shadow
        // actor and blur actor into WorkspaceGroup to see them when switching
        // workspace
        WorkspaceGroup.prototype._createWindows = function () {
            self._switch_ws_patch.apply (this)

            this._windowRecords.forEach (({ windowActor: actor, clone }) => {
                const win = actor.meta_window
                const frame_rect = win.get_frame_rect ()
                const cfg = ChoiceRoundedCornersCfg (
                    settings ().global_rounded_corner_settings,
                    settings ().custom_rounded_corner_settings,
                    win
                )
                const maximized =
                    win.maximized_horizontally ||
                    win.maximized_vertically ||
                    win.fullscreen
                const has_rounded_corners =
                    cfg.keep_rounded_corners || !maximized

                const shadow = self._rounded_corners_manager?.query_shadow (win)
                if (shadow && has_rounded_corners) {
                    // Only create shadow actor when window should have rounded
                    // corners when switching workspace

                    // Copy shadow actor to workspace group, so that to see
                    // shadow when switching workspace
                    const shadow_clone = new Clone ({ source: shadow })
                    const paddings =
                        constants.SHADOW_PADDING * WindowScaleFactor (win)

                    shadow_clone.width = frame_rect.width + paddings * 2
                    shadow_clone.height = frame_rect.height + paddings * 2
                    shadow_clone.x = clone.x + frame_rect.x - actor.x - paddings
                    shadow_clone.y = clone.y + frame_rect.y - actor.y - paddings

                    clone.connect (
                        'notify::translation-z',
                        () =>
                            (shadow_clone.translation_z =
                                clone.translation_z + 0.006)
                    )

                    this.insert_child_below (shadow_clone, clone)
                    this.set_child_below_sibling (shadow_clone, clone)
                }
            })
        }

        // Window Size Changed
        WindowManager.prototype._sizeChangeWindowDone = function (
            shell_wm,
            actor
        ) {
            self._size_changed_patch.apply (this, [shell_wm, actor])
            // Update shadow actor
            if (!self._rounded_corners_manager) {
                return
            }
            self._rounded_corners_manager.on_size_changed (actor)
            self._rounded_corners_manager._on_focus_changed (actor.meta_window)
        }

        SetupBackgroundMenu ()
        BackgroundMenu.addBackgroundMenu = (actor, layout) => {
            this._add_background_menu (actor, layout)
            AddBackgroundMenuItem (actor._backgroundMenu)
        }

        log ('Enabled')
    }

    disable () {
        // Restore patched methods
        Workspace.prototype._addWindowClone = this._orig_add_window_clone
        WorkspaceGroup.prototype._createWindows = this._switch_ws_patch
        WindowManager.prototype._sizeChangeWindowDone = this._size_changed_patch
        BackgroundMenu.addBackgroundMenu = this._add_background_menu

        // Remove main loop sources
        if (this._timeout_handler != 0) {
            Source.remove (this._timeout_handler)
            this._timeout_handler = 0
        }

        // Remove the item to open preferences page in background menu
        RestoreBackgroundMenu ()

        this._services?.unexport ()
        this._disable_effect_managers ()

        // Disconnect all signals in global Connections.get()
        Connections.get ().disconnect_all ()
        Connections.del ()

        // Set all props to null
        this._rounded_corners_manager = null
        this._services = null

        log ('Disabled')
    }

    private _enable_effect_managers () {
        this._rounded_corners_manager?.enable ()
    }

    private _disable_effect_managers () {
        this._rounded_corners_manager?.disable ()
    }
}
