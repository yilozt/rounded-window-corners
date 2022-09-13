// imports.gi
import { Point }                      from '@gi/Graphene'
import * as Clutter                   from '@gi/Clutter'
import * as GLib                      from '@gi/GLib'
import { Settings }                   from '@gi/Gio'
import { MonitorManager }             from '@gi/Meta'

// gnome-shell modules
import { WindowPreview }              from '@imports/ui/windowPreview'
import { WorkspaceGroup }             from '@imports/ui/workspaceAnimation'
import { WindowManager }              from '@imports/ui/windowManager'
import BackgroundMenu                 from '@imports/ui/backgroundMenu'
import { sessionMode, layoutManager } from '@imports/ui/main'
import { overview }                   from '@imports/ui/main'

// local modules
import { constants }                  from '@me/utils/constants'
import { RoundedCornersManager }      from '@me/manager/rounded_corners_manager'
import { stackMsg, _log }             from '@me/utils/log'
import * as UI                        from '@me/utils/ui'
import { connections }                from '@me/utils/connections'
import { SchemasKeys, settings }      from '@me/utils/settings'
import { Services }                   from '@me/dbus/services'
import { LinearFilterEffect }         from '@me/effect/linear_filter_effect'
import { init_translations }          from '@me/utils/i18n'

// types, which will be removed in output
import { WM }                         from '@gi/Shell'
import { RoundedCornersCfg }          from '@me/utils/types'
import { Window, WindowActor }        from '@gi/Meta'
import { global }                     from '@global'
import { registerClass }              from '@gi/GObject'

// --------------------------------------------------------------- [end imports]

export class Extension {
    // The methods of gnome-shell to monkey patch
    private _orig_add_window     !: (_: Window) => void
    private _orig_create_windows !: () => void
    private _orig_sync_stacking  !: () => void
    private _orig_size_changed   !: (wm: WM, actor: WindowActor) => void
    private _add_background_menu !: typeof BackgroundMenu.addBackgroundMenu

    private _services: Services | null = null
    private _rounded_corners_manager: RoundedCornersManager | null = null

    private _fs_timeout_id = 0

    constructor () {
        // Show loaded message in debug mode
        _log (constants.LOADED_MSG)
    }

    enable () {
        // Restore original methods, those methods will be restore when
        // extensions is disabled
        this._orig_add_window = WindowPreview.prototype._addWindow
        this._orig_create_windows = WorkspaceGroup.prototype._createWindows
        this._orig_sync_stacking = WorkspaceGroup.prototype._syncStacking
        this._orig_size_changed = WindowManager.prototype._sizeChangeWindowDone
        this._add_background_menu = BackgroundMenu.addBackgroundMenu

        this._services = new Services ()
        this._rounded_corners_manager = new RoundedCornersManager ()

        this._services.export ()

        // Enable rounded corners effects when gnome-shell is ready
        //
        // https://github.com/aunetx/blur-my-shell/blob/
        //  21d4bbde15acf7c3bf348f7375a12f7b14c3ab6f/src/extension.js#L87

        if (layoutManager._startingUp) {
            const id = layoutManager.connect ('startup-complete', () => {
                this._enable_effect_managers ()
                layoutManager.disconnect (id)
            })
        } else {
            this._enable_effect_managers ()
        }

        // Have to toggle fullscreen for all windows when changed scale factor
        // of windows because rounded-corners-manager may got incorrect frame
        // rect & buffer rect to calculate position of shadow & bound of rounded
        // corners.
        // FIXME: This is an ugly way but works. Should found a better way to
        // solve this problem.

        const monitor_manager = MonitorManager.get ()
        type _Window = Window & { __extensions_rounded_window_fs?: 1 }

        connections.get ().connect (monitor_manager, 'monitors-changed', () => {
            if (sessionMode.isLocked || sessionMode.isGreeter) {
                return
            }
            for (const win of this._rounded_corners_manager?.windows () ?? []) {
                (win as _Window).__extensions_rounded_window_fs = 1
                win.make_fullscreen ()
            }

            // waiting 3 seconds then restore marked windows.
            this._fs_timeout_id = GLib.timeout_add_seconds (0, 3, () => {
                for (const _win of this._rounded_corners_manager?.windows () ??
                    []) {
                    const win = _win as _Window
                    if (win && win.__extensions_rounded_window_fs == 1) {
                        win.unmake_fullscreen ()
                        delete win.__extensions_rounded_window_fs
                    }
                }
                return false
            })
        })

        // Restore window that have __extensions_rounded_window_fs props when
        // unlocked
        for (const win_actor of global.get_window_actors ()) {
            const win = win_actor.meta_window as _Window
            if (win.__extensions_rounded_window_fs === 1) {
                win.unmake_fullscreen ()
                delete win.__extensions_rounded_window_fs
            }
        }

        const self = this

        // WindowPreview is a widgets that show content of window in overview.
        // this widget also contain a St.Label (show title of window), icon and
        // close button for window.
        //
        // When there is new window added into overview, this function will be
        // called. We need add our shadow actor and blur actor of rounded
        // corners window into overview.
        //
        WindowPreview.prototype._addWindow = function (window) {
            // call original method from gnome-shell
            self._orig_add_window.apply (this, [window])

            // Make sure patched method only be called in _init() of
            // WindowPreview
            // https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js
            // /ui/windowPreview.js#L42

            const stack = stackMsg ()
            if (
                stack === undefined ||
                stack.indexOf ('_updateAttachedDialogs') !== -1 ||
                stack.indexOf ('addDialog') !== -1
            ) {
                return
            }

            // If the window don't have rounded corners and shadows,
            // just return
            let cfg: RoundedCornersCfg | null = null
            let has_rounded_corners = false
            const shadow = self._rounded_corners_manager?.query_shadow (window)
            if (shadow) {
                cfg = UI.ChoiceRoundedCornersCfg (
                    settings ().global_rounded_corner_settings,
                    settings ().custom_rounded_corner_settings,
                    window
                )
                has_rounded_corners = UI.ShouldHasRoundedCorners (window, cfg)
            }
            if (!has_rounded_corners || !shadow) {
                return
            }

            _log (`Add shadow for ${window.title} in overview`)

            // WindowPreview.window_container used to show content of window
            const window_container = this.window_container
            let first_child: Clutter.Actor | null = window_container.first_child

            // Set linear filter to let it looks better
            first_child?.add_effect (new LinearFilterEffect ())

            // Add a clone of shadow to overview
            const shadow_clone = new OverviewShadowActor (shadow, this)
            for (const prop of ['scale-x', 'scale-y']) {
                window_container.bind_property (prop, shadow_clone, prop, 1)
            }
            this.insert_child_below (shadow_clone, window_container)

            // Disconnect all signals when Window preview in overview is destroy
            const c = connections.get ()
            c.connect (this, 'destroy', () => {
                first_child?.clear_effects ()
                first_child = null
                c.disconnect_all (this)
            })
        }

        // Just Like the monkey patch when enter overview, need to add shadow
        // actor and blur actor into WorkspaceGroup to see them when switching
        // workspace
        WorkspaceGroup.prototype._createWindows = function () {
            self._orig_create_windows.apply (this)

            this._windowRecords.forEach (({ windowActor: actor, clone }) => {
                const win = actor.meta_window
                const frame_rect = win.get_frame_rect ()
                const cfg = UI.ChoiceRoundedCornersCfg (
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
                    const shadow_clone = new Clutter.Clone ({ source: shadow })
                    const paddings =
                        constants.SHADOW_PADDING * UI.WindowScaleFactor (win)

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

                    // Add reference shadow clone for clone actor, so that we
                    // can restack position of shadow when we need
                    ;(clone as WsAnimationActor)._shadow_clone = shadow_clone
                    clone.bind_property ('visible', shadow_clone, 'visible', 0)
                    this.insert_child_below (shadow_clone, clone)
                }
            })
        }

        // Let shadow actor always behind the window clone actor when we
        // switch workspace by Ctrl+Alt+Left/Right
        //
        // Fix #55
        WorkspaceGroup.prototype._syncStacking = function () {
            self._orig_sync_stacking.apply (this, [])
            for (const { clone } of this._windowRecords) {
                const shadow_clone = (clone as WsAnimationActor)._shadow_clone
                if (shadow_clone && shadow_clone.visible) {
                    this.set_child_below_sibling (shadow_clone, clone)
                }
            }
        }

        // Window Size Changed
        WindowManager.prototype._sizeChangeWindowDone = function (
            shell_wm,
            actor
        ) {
            self._orig_size_changed.apply (this, [shell_wm, actor])
            // Update shadow actor
            if (!self._rounded_corners_manager) {
                return
            }
            self._rounded_corners_manager.on_size_changed (actor)
            self._rounded_corners_manager._on_focus_changed (actor.meta_window)
        }

        if (settings ().enable_preferences_entry) {
            UI.SetupBackgroundMenu ()
        }
        BackgroundMenu.addBackgroundMenu = (actor, layout) => {
            this._add_background_menu (actor, layout)
            if (settings ().enable_preferences_entry) {
                UI.AddBackgroundMenuItem (actor._backgroundMenu)
            }
        }

        // Gnome-shell will not disable extensions when _logout/shutdown/restart
        // system, it means that the signal handlers will not be cleaned when
        // gnome-shell is closing.
        //
        // Now clear all resources manually before gnome-shell closes
        connections.get ().connect (global.display, 'closing', () => {
            _log ('Clear all resources because gnome-shell is shutdown')
            this.disable ()
        })

        connections
            .get ()
            .connect (
                settings ().g_settings,
                'changed',
                (_: Settings, key: string) => {
                    if ((key as SchemasKeys) === 'enable-preferences-entry') {
                        settings ().enable_preferences_entry
                            ? UI.SetupBackgroundMenu ()
                            : UI.RestoreBackgroundMenu ()
                    }
                }
            )

        _log ('Enabled')
    }

    disable () {
        // Restore patched methods
        WindowPreview.prototype._addWindow = this._orig_add_window
        WorkspaceGroup.prototype._createWindows = this._orig_create_windows
        WorkspaceGroup.prototype._syncStacking = this._orig_sync_stacking
        WindowManager.prototype._sizeChangeWindowDone = this._orig_size_changed
        BackgroundMenu.addBackgroundMenu = this._add_background_menu

        // Remove main loop sources
        if (this._fs_timeout_id != 0) {
            GLib.Source.remove (this._fs_timeout_id)
            this._fs_timeout_id = 0
        }

        // Remove the item to open preferences page in background menu
        UI.RestoreBackgroundMenu ()

        this._services?.unexport ()
        this._disable_effect_managers ()

        // Disconnect all signals in global connections.get()
        connections.get ().disconnect_all ()
        connections.del ()

        // Set all props to null
        this._rounded_corners_manager = null
        this._services = null

        _log ('Disabled')
    }

    private _enable_effect_managers () {
        this._rounded_corners_manager?.enable ()
    }

    private _disable_effect_managers () {
        this._rounded_corners_manager?.disable ()
    }
}

export function init () {
    init_translations ()
    return new Extension ()
}

/**
 * Copy shadow of rounded corners window and show it in overview.
 * This actor will be created when window preview has created for overview
 */
const OverviewShadowActor = registerClass (
    {},
    class extends Clutter.Clone {
        _window_preview          !: WindowPreview

        /**
         * Create shadow actor for WindowPreview in overview
         * @param source the shadow actor create for rounded corners shadow
         * @param window_preview the window preview has shown in overview
         */
        _init (source: Clutter.Actor, window_preview: WindowPreview): void {
            super._init ({
                source, // the source shadow actor shown in desktop
                name: constants.OVERVIEW_SHADOW_ACTOR,
                pivot_point: new Point ({ x: 0.5, y: 0.5 }),
            })

            this._window_preview = window_preview
        }

        /**
         * Recompute the position and size of shadow in overview
         * This virtual function will be called when we:
         * - entering/closing overview
         * - dragging window
         * - position and size of window preview in overview changed
         * @param box The bound box of shadow actor
         */
        vfunc_allocate (box: Clutter.ActorBox): void {
            const leaving_overview =
                overview._overview.controls._workspacesDisplay._leavingOverview

            // The window container that shown in overview
            const window_container_box = leaving_overview
                ? this._window_preview.window_container.get_allocation_box ()
                : this._window_preview.get_allocation_box ()

            // Meta.Window contain the all information about a window
            const meta_win = this._window_preview._windowActor.meta_window

            // As we known, preview shown in overview has been scaled
            // in overview
            const container_scaled =
                window_container_box.get_width () /
                meta_win.get_frame_rect ().width
            const paddings =
                constants.SHADOW_PADDING *
                container_scaled *
                UI.WindowScaleFactor (meta_win)

            // Setup bounds box of shadow actor
            box.set_origin (-paddings, -paddings)
            box.set_size (
                window_container_box.get_width () + 2 * paddings,
                window_container_box.get_height () + 2 * paddings
            )

            // Make bounds box effect actor
            super.vfunc_allocate (box)
        }
    }
)

type WsAnimationActor = Clutter.Actor & { _shadow_clone?: Clutter.Actor }
