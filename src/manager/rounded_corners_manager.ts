// imports.gi
import * as Clutter               from '@gi/Clutter'
import { ShadowMode, WindowType } from '@gi/Meta'
import { WindowClientType }       from '@gi/Meta'
import { Bin }                    from '@gi/St'
import { Binding, BindingFlags }  from '@gi/GObject'
import { ThemeContext }           from '@gi/St'

// local modules
import * as UI                    from '@me/utils/ui'
import { _log }                   from '@me/utils/log'
import { constants }              from '@me/utils/constants'
import { ClipShadowEffect }       from '@me/effect/clip_shadow_effect'
import * as types                 from '@me/utils/types'
import { settings }               from '@me/utils/settings'
import { Connections }            from '@me/utils/connections'
import { RoundedCornersEffect }   from '@me/effect/rounded_corners_effect'

// types, those import statements will be removed in output javascript files.
import { SchemasKeys }            from '../utils/settings'
import { Window, WindowActor }    from '@gi/Meta'
import { WM }                     from '@gi/Shell'
import { global }                 from '@global'
import * as Gio                   from '@gi/Gio'
type RoundedCornersEffectType = InstanceType<typeof RoundedCornersEffect>

// --------------------------------------------------------------- [end imports]

export class RoundedCornersManager {
    /** Store connect handles of GObject, to disconnect when we needn't */
    private connections: Connections | null = null

    /**
     * This map is used to store Meta.Window, and some information about it.
     * Cache those information can reduce repeat compute.
     * include:
     * - Shadow Actor
     * - AppType: Libhandy | LibAdwaita | Other
     * - Bindings: Store the property Bindings between Window Actor and shadow
     *            Actor
     */
    private rounded_windows: Map<
        Window,
        {
            shadow: Bin
            app_type: UI.AppType
            bindings: {
                [prop: string]: Binding | undefined
            }
        }
    > | null = null

    /** Rounded corners settings */
    private global_rounded_corners: types.RoundedCornersCfg | null = null
    private custom_rounded_corners: types.CustomRoundedCornersCfg | null = null

    // -------------------------------------------------------- [public methods]

    /** Call When enable extension */
    enable () {
        this.connections = new Connections ()
        this.rounded_windows = new Map ()
        this.global_rounded_corners = settings ().global_rounded_corner_settings
        this.custom_rounded_corners = settings ().custom_rounded_corner_settings

        // watch settings
        this.connections.connect (
            settings ().g_settings,
            'changed',
            (_: Gio.Settings, key: string) =>
                this._on_settings_changed (key as SchemasKeys)
        )

        const wm = global.window_manager

        // Try to add rounded corners effect to all windows
        const window_actors = global.get_window_actors ()
        _log (`Windows count when enable: ${window_actors.length}`)
        for (const actor of window_actors) {
            this._add_effect (actor)
        }

        // Add effects when window opened
        this.connections.connect (wm, 'map', (_: WM, actor: WindowActor) => {
            const win = actor.get_meta_window ()

            // If wm_class_instance of Meta.Window is null, try to add rounded
            // corners when wm_class_instance is set
            if (win?.get_wm_class_instance () == null) {
                const notify_id = win.connect ('notify::wm-class', () => {
                    this._add_effect (actor)
                    win.disconnect (notify_id)
                })
            } else {
                this._add_effect (actor)
            }
        })

        // Connect 'minimized' signal, hide shadow actor when window minimized
        this.connections.connect (
            wm,
            'minimize',
            (_: WM, actor: WindowActor) => {
                const win = actor.get_meta_window ()
                const info = this.rounded_windows?.get (win)
                const shadow = info?.shadow
                const bindings = info?.bindings
                if (shadow && bindings) {
                    // Disconnect bindings temporary, it will be restored
                    // when un-minimized
                    const visible_binding = bindings['visible']
                    if (visible_binding) {
                        visible_binding.unbind ()
                        delete bindings['visible']
                    }
                    shadow.visible = false
                }
            }
        )

        // Restore visible of shadow when un-minimized
        this.connections.connect (
            wm,
            'unminimize',
            (_: WM, actor: WindowActor) => {
                const win = actor.get_meta_window ()
                const info = this.rounded_windows?.get (win)
                const shadow = info?.shadow
                const bindings = info?.bindings
                if (!shadow || !bindings) {
                    return
                }

                const restore_binding = () => {
                    if (!bindings['visible']) {
                        bindings['visible'] = actor.bind_property (
                            'visible',
                            shadow,
                            'visible',
                            BindingFlags.SYNC_CREATE
                        )
                    }
                }

                // Handle visible of shader with Compiz alike magic lamp effect
                // After MagicLampUnminimizeEffect completed, then show shadow
                //
                // https://github.com/hermes83/compiz-alike-magic-lamp-effect
                const effect = actor.get_effect ('unminimize-magic-lamp-effect')
                if (effect) {
                    type Effect = Clutter.Effect & { timerId: Clutter.Timeline }
                    const timer_id = (effect as Effect).timerId

                    const id = timer_id.connect ('new-frame', (source) => {
                        // Effect completed when get_process() touch 1.0
                        // Need show shadow here
                        if (source.get_progress () > 0.98) {
                            _log ('Handle Unminimize with Magic Lamp Effect')

                            restore_binding ()
                            source.disconnect (id)
                        }
                    })
                    return
                }

                restore_binding ()
            }
        )

        // Disconnect all signals of window when closed
        this.connections.connect (wm, 'destroy', (_: WM, actor: WindowActor) =>
            this._remove_effect (actor)
        )

        // When windows restacked, change order of shadow actor too
        this.connections.connect (global.display, 'restacked', () => {
            global.get_window_actors ().forEach ((actor) => {
                if (!actor.visible) {
                    return
                }
                const shadow = this.rounded_windows?.get (
                    actor.meta_window
                )?.shadow
                if (shadow) {
                    global.window_group.set_child_below_sibling (shadow, actor)
                }
            })
        })
    }

    /** Call when extension is disabled */
    disable () {
        // Remove rounded effect and shadow actor for all windows
        global
            .get_window_actors ()
            .forEach ((actor) => this._remove_effect (actor))

        // Remove all shadows store in map
        this.rounded_windows?.clear ()

        // Disconnect all signal
        this.connections?.disconnect_all ()

        // Set all props to null
        this.rounded_windows = null
        this.connections = null
        this.global_rounded_corners = null
        this.custom_rounded_corners = null
    }

    query_shadow (win: Window): Bin | undefined {
        return this.rounded_windows?.get (win)?.shadow
    }

    /** Return all rounded corners window  */
    windows (): IterableIterator<Window> | undefined {
        return this.rounded_windows?.keys ()
    }

    // ------------------------------------------------------- [private methods]

    /** Compute outer bound of rounded corners for window actor */
    private _compute_bounds (
        actor: WindowActor,
        [x, y, width, height]: [number, number, number, number]
    ): types.Bounds {
        const bounds = {
            x1: x + 1,
            y1: y + 1,
            x2: x + actor.width + width,
            y2: y + actor.height + height,
        }

        // Kitty draw it's window decoration by itself, we need recompute the
        // outer bounds for kitty.
        const kitty_adjustment =
            actor.meta_window.get_client_type () === WindowClientType.WAYLAND &&
            actor.meta_window.get_wm_class_instance () === 'kitty'
        if (kitty_adjustment) {
            const scale = UI.WindowScaleFactor (actor.meta_window)
            bounds.x1 += 11 * scale /* shadow in left   of kitty */
            bounds.y1 += 35 * scale /* shadow in top    of kitty */
            bounds.x2 -= 11 * scale /* shadow in right  of kitty */
            bounds.y2 -= 11 * scale /* shadow in bottom of kitty */
        }

        return bounds
    }

    /** Bind property between shadow actor and window actor */
    private _bind_shadow_actor_props (
        actor: WindowActor,
        shadow: Bin
    ): { [prop: string]: Binding | undefined } {
        const flag = BindingFlags.SYNC_CREATE
        const bindings: { [prop: string]: Binding | undefined } = {}

        for (const prop of [
            'pivot-point',
            'visible',
            'translation-x',
            'translation-y',
            'scale-x',
            'scale-y',
        ]) {
            bindings[prop] = actor.bind_property (prop, shadow, prop, flag)
        }

        // restore bindings map, key: property, value: GLib.Binding
        return bindings
    }

    /**
     * Create Shadow for rounded corners window
     * @param actor -  window actor which has been setup rounded corners effect
     */
    private _create_shadow (actor: WindowActor): Bin {
        const shadow = new Bin ({
            name: 'Shadow Actor',
            child: new Bin ({
                x_expand: true,
                y_expand: true,
            }),
        })
        ;(shadow.first_child as Bin).add_style_class_name ('shadow')

        this._update_shadow_actor_style (
            actor.meta_window,
            shadow,
            this.global_rounded_corners?.border_radius,
            actor.meta_window.appears_focused
                ? settings ().focused_shadow
                : settings ().unfocused_shadow
        )

        // We have to clip the shadow because of this issues:
        // https://gitlab.gnome.org/GNOME/gnome-shell/-/issues/4474
        shadow.add_effect_with_name (
            constants.CLIP_SHADOW_EFFECT,
            new ClipShadowEffect ()
        )

        // Insert shadow actor below window actor, now shadow actor
        // will show below window actor
        const parent = actor.get_parent ()
        parent != null && parent.insert_child_below (shadow, actor)

        // Return the shadow we create, it will be store into
        // this.rounded_windows

        this._bind_shadow_constraint (actor, shadow)

        return shadow
    }

    private _compute_shadow_actor_offset (
        actor: WindowActor,
        [offset_x, offset_y, offset_width, offset_height]: [
            number,
            number,
            number,
            number
        ]
    ): number[] {
        const win = actor.meta_window
        const shadow_padding =
            constants.SHADOW_PADDING * UI.WindowScaleFactor (win)

        // If remove UI.scaleFactor(), it should can be works if
        // experimental-features of mutter  'scale-monitor-framebuffer' enabled
        // (Fractional scaling in Wayland)
        // const shadow_padding = constants.SHADOW_PADDING * UI.scaleFactor ()
        return [
            offset_x - shadow_padding,
            offset_y - shadow_padding,
            2 * shadow_padding + offset_width,
            2 * shadow_padding + offset_height,
        ]
    }

    private _bind_shadow_constraint (actor: WindowActor, shadow: Bin) {
        const coordinates = [
            Clutter.BindCoordinate.X,
            Clutter.BindCoordinate.Y,
            Clutter.BindCoordinate.WIDTH,
            Clutter.BindCoordinate.HEIGHT,
        ]
        coordinates
            .map (
                (coordinate) =>
                    new Clutter.BindConstraint ({
                        source: actor,
                        coordinate,
                        offset: 0,
                    })
            )
            .forEach ((constraint) => shadow.add_constraint (constraint))
    }

    /** Update css style of shadow actor */
    private _update_shadow_actor_style (
        win: Window,
        actor: Bin,
        border_radius = this.global_rounded_corners?.border_radius,
        shadow = settings ().focused_shadow,
        padding = this.global_rounded_corners?.padding
    ) {
        if (!border_radius || !padding) {
            return
        }
        const { left, right, top, bottom } = padding

        // Increasing border_radius when smoothing is on
        if (this.global_rounded_corners !== null) {
            border_radius *= 1.0 + this.global_rounded_corners.smoothing
        }

        // Sadly, the scale of style of St.Widget may be different between scale
        // of window if there are two monitor with different scale factor.
        // - Scale of Style always as same as primary monitor
        // - Scale of window as same as the monitor window located.
        //
        // So, we have to adjustment this different

        const original_scale = ThemeContext.get_for_stage (
            global.stage as Clutter.Stage
        ).scale_factor
        const win_scale = UI.WindowScaleFactor (win)

        // Now scale factor for shadow actor should be correct.
        const scale_of_style = win_scale / original_scale

        // _log (JSON.stringify ({ original_scale, win_scale }))

        actor.style = `padding: ${constants.SHADOW_PADDING * scale_of_style}px
        /*background: yellow*/;`

        const child = actor.first_child as Bin

        if (
            win.maximized_horizontally ||
            win.maximized_vertically ||
            win.fullscreen
        ) {
            child.style = 'opacity: 0;'
        } else {
            child.style = `
                background: white;
                border-radius: ${border_radius * scale_of_style}px;
                ${types.box_shadow_css (shadow, scale_of_style)};
                margin: ${top * scale_of_style}px
                        ${right * scale_of_style}px
                        ${bottom * scale_of_style}px
                        ${left * scale_of_style}px;`
        }

        child.queue_redraw ()
    }

    /** Add Rounded corners when window actor is ready */
    private _setup_rounded_corners_effect (actor: WindowActor) {
        const _setup_effect = (actor_to_add_effect: Clutter.Actor) => {
            const effect = new RoundedCornersEffect ()
            const name = constants.ROUNDED_CORNERS_EFFECT

            actor_to_add_effect.add_effect_with_name (name, effect)

            this.connections?.connect (
                actor.get_texture (),
                'size-changed',
                () => {
                    this.on_size_changed (actor)
                }
            )

            // Update shadows and rounded corners bounds
            this.on_size_changed (actor)
            this._on_focus_changed (actor.meta_window)
        }

        const win = actor.meta_window
        if (win.get_client_type () === WindowClientType.X11) {
            // Add rounded corners to surface actor for X11 client
            if (actor.first_child) {
                _setup_effect (actor.first_child)
            } else {
                // Surface Actor may not ready in some time, waiting it by
                // connect 'notify::first-child'
                const id = actor.connect ('notify::first-child', () => {
                    // now it's ready
                    _setup_effect (actor.first_child)
                    actor.disconnect (id)
                })
            }
        } else {
            // Add rounded corners to WindowActor for Wayland client
            _setup_effect (actor)
        }
    }

    /**
     * Add rounded corners effect and setup shadow actor for a window actor
     * @param actor - window to add effect
     */
    private _add_effect (actor: WindowActor & { shadow_mode?: ShadowMode }) {
        // If application failed check, just return and don't add rounded
        // corners to it.
        const [should_rounded, app_type] = this.should_enable_effect (
            actor.meta_window
        )
        if (!should_rounded) {
            return
        }

        const win = actor.meta_window

        // Add rounded corners to window actor when actor_to_setup is ready
        if (!this.connections || !this.rounded_windows) {
            return
        }

        // The shadow of window
        const shadow = this._create_shadow (actor)

        const bindings = this._bind_shadow_actor_props (actor, shadow)

        this.rounded_windows.set (win, { shadow, app_type, bindings })

        // turn off original shadow for x11 window
        if (actor.shadow_mode !== undefined) {
            actor.shadow_mode = ShadowMode.FORCED_OFF
        }

        // Connect signals of window, those signals will be disconnected
        // when window is destroyed

        // Update uniform variables when changed window size
        const source = actor.meta_window

        this.connections.connect (actor, 'notify::size', () => {
            this.on_size_changed (actor)
        })

        // Update shadow actor when focus of window has changed.
        this.connections.connect (source, 'notify::appears-focused', () => {
            this._on_focus_changed (source)
        })

        // When window is switch between different monitor,
        // 'workspace-changed' signal emit.
        this.connections.connect (source, 'workspace-changed', () => {
            const shadow = this.rounded_windows?.get (source)?.shadow
            if (shadow) {
                _log ('Recompute style of shadow...')
                this._update_shadow_actor_style (actor.meta_window, shadow)
            }
        })

        // Add rounded corers to window
        this._setup_rounded_corners_effect (actor)
    }

    /** Remove rounded corners effect for window actor */
    private _remove_rounded_corners_effect (actor: WindowActor) {
        const name = constants.ROUNDED_CORNERS_EFFECT
        this._get_actor_to_rounded (actor)?.remove_effect_by_name (name)
    }

    /**`
     * Remove rounded corners effect and shadow actor for a window actor
     * This method will be called when window is open, or change of settings
     * need remove rounded corners.
     * It will remove all connected signals, and clear all resources.
     */
    private _remove_effect (actor: WindowActor & { shadow_mode?: ShadowMode }) {
        if (!this.rounded_windows || !this.connections) {
            return
        }

        const win = actor.meta_window
        this._remove_rounded_corners_effect (actor)

        // Restore shadow for x11 windows
        if (actor.shadow_mode) {
            actor.shadow_mode = ShadowMode.AUTO
        }

        // Remove shadow actor
        const shadow = this.rounded_windows.get (win)?.shadow
        if (shadow) {
            global.window_group.remove_child (shadow)
            shadow.destroy ()
        }
        this.rounded_windows.delete (win)

        // Remove handle for window, those handle has been added
        // in `_add_effect()`
        this.connections.disconnect_all (actor.get_texture ())
        this.connections.disconnect_all (win)
        this.connections.disconnect_all (actor)
    }

    /**
     * Check whether a window should be enable rounded corners effect
     * @param win WindowActor to test
     * @return {[boolean, UI.AppType]}
     */
    should_enable_effect (win: Window): [boolean, UI.AppType] {
        // DING (Desktop Icons NG) is a extensions that create a gtk
        // application to show desktop grid on background, we need to
        // skip it coercively.
        // https://extensions.gnome.org/extension/2087/desktop-icons-ng-ding/
        if (win.gtk_application_id === 'com.rastersoft.ding') {
            return [false, UI.AppType.Other]
        }

        // Skip when application in black list.

        const wm_class_instance = win.get_wm_class_instance ()
        if (wm_class_instance == null) {
            _log (`Warning: wm_class_instance of ${win}: ${win.title} is null`)
            return [false, UI.AppType.Other]
        }

        if (settings ().black_list.includes (wm_class_instance)) {
            return [false, UI.AppType.Other]
        }

        // Check type of window, only need to add rounded corners to normal
        // window and dialog.

        const normal_type = [
            WindowType.NORMAL,
            WindowType.DIALOG,
            WindowType.MODAL_DIALOG,
        ].includes (win.window_type)
        if (!normal_type) {
            return [false, UI.AppType.Other]
        }

        // Skip libhandy / libadwaita applications according the settings.
        const { getAppType, AppType } = UI

        // Try cache first
        const app_type =
            this.rounded_windows?.get (win)?.app_type ?? getAppType (win)
        _log ('Check Type of window:' + `${win.title} => ${AppType[app_type]}`)

        if (settings ().skip_libadwaita_app) {
            if (getAppType (win) === AppType.LibAdwaita) {
                return [false, app_type]
            }
        }
        if (settings ().skip_libhandy_app) {
            if (getAppType (win) === AppType.LibHandy) {
                return [false, app_type]
            }
        }

        return [true, app_type]
    }

    /**
     * In Wayland, we will add rounded corners effect to WindowActor
     * In XOrg, we will add rounded corners effect to WindowActor.first_child
     */
    private _get_actor_to_rounded (actor: WindowActor): Clutter.Actor | null {
        const client_type = actor.meta_window.get_client_type ()

        return client_type == WindowClientType.X11
            ? actor.get_first_child ()
            : actor
    }

    /** Query rounded corners effect of window actor  */
    private _get_rounded_corners (
        actor: WindowActor
    ): RoundedCornersEffectType | null | undefined {
        const name = constants.ROUNDED_CORNERS_EFFECT
        type Res = RoundedCornersEffectType | null | undefined
        return this._get_actor_to_rounded (actor)?.get_effect (name) as Res
    }

    /** Traversal all windows, add or remove rounded corners for them */
    private _update_all_window_effect_state () {
        global.get_window_actors ().forEach ((actor) => {
            const [should_have_effect] = this.should_enable_effect (
                actor.meta_window
            )
            const has_effect = this._get_rounded_corners (actor) != null

            if (should_have_effect && !has_effect) {
                this._add_effect (actor)
                return
            }

            if (!should_have_effect && has_effect) {
                this._remove_effect (actor)
                return
            }
        })
    }

    /** Update style for all shadow actors */
    private _update_all_shadow_actor_style () {
        this.rounded_windows?.forEach (({ shadow }, win) => {
            const actor: WindowActor = win.get_compositor_private ()
            const shadow_cfg = actor.meta_window.appears_focused
                ? settings ().focused_shadow
                : settings ().unfocused_shadow
            const { border_radius, padding } = this._get_rounded_corners_cfg (
                actor.meta_window
            )

            this._update_shadow_actor_style (
                win,
                shadow,
                border_radius,
                shadow_cfg,
                padding
            )
        })
    }

    private _get_rounded_corners_cfg (win: Window): types.RoundedCornersCfg {
        return UI.ChoiceRoundedCornersCfg (
            this.global_rounded_corners ??
                settings ().global_rounded_corner_settings,
            this.custom_rounded_corners ??
                settings ().custom_rounded_corner_settings,
            win
        )
    }

    /**
     * This method will be called when global rounded corners settings changed.
     */
    update_all_rounded_corners_settings () {
        this.global_rounded_corners = settings ().global_rounded_corner_settings
        this.custom_rounded_corners = settings ().custom_rounded_corner_settings

        this.rounded_windows?.forEach ((shadow, win) => {
            const actor: WindowActor = win.get_compositor_private ()
            this.on_size_changed (actor)
        })
        this._update_all_shadow_actor_style ()
    }

    // ------------------------------------------------------- [signal handlers]

    /**
     * This handler will be called when settings of extensions changed
     * @param key Key of settings in schemas have changed
     */
    private _on_settings_changed (key: SchemasKeys): void {
        switch (key) {
        case 'skip-libadwaita-app':
        case 'skip-libhandy-app':
        case 'black-list':
            this._update_all_window_effect_state ()
            break
        case 'focused-shadow':
        case 'unfocused-shadow':
            this._update_all_shadow_actor_style ()
            break
        case 'global-rounded-corner-settings':
        case 'custom-rounded-corner-settings':
        case 'border-color':
        case 'border-width':
            this.update_all_rounded_corners_settings ()
            break
        default:
        }
    }

    /**
     * This handler of 'size-changed' signal for Meta.Window, used to update
     * uniforms variants of shader of rounded corners effect, also used to
     * update bind constraint of shadow actor.
     * @param actor - Window actor correlate Meta.Window
     */
    on_size_changed (actor: WindowActor): void {
        const win = actor.meta_window

        const window_info = this.rounded_windows?.get (win)
        if (!window_info) {
            return
        }

        // Cache the offset, so that we can calculate this value once
        const content_offset_of_win = UI.computeWindowContentsOffset (win)

        const cfg = this._get_rounded_corners_cfg (win)

        // Skip rounded corners when window is fullscreen & maximize
        let effect = this._get_rounded_corners (actor)
        const should_rounded = UI.ShouldHasRoundedCorners (win, cfg)

        if (!should_rounded && effect) {
            _log ('Remove rounded effect for maximized window', win.title)
            this._remove_rounded_corners_effect (actor)
            return
        }
        // Restore Rounded effect when un-maximized
        if (should_rounded && !effect) {
            const actor_to_add = this._get_actor_to_rounded (actor)
            const name = constants.ROUNDED_CORNERS_EFFECT
            if (actor_to_add) {
                effect = new RoundedCornersEffect ()
                actor_to_add.add_effect_with_name (name, effect)
                _log ('Restore rounded effect for maximized window', win.title)
            }
        }

        // When size changed. update uniforms for window
        effect?.update_uniforms (
            UI.WindowScaleFactor (win),
            cfg,
            this._compute_bounds (actor, content_offset_of_win),
            {
                width: settings ().border_width,
                color: settings ().border_color,
            }
        )

        // Update BindConstraint for shadow
        const shadow = window_info.shadow
        if (!shadow) {
            return
        }
        const offsets = this._compute_shadow_actor_offset (
            actor,
            content_offset_of_win
        )
        const constraints = shadow.get_constraints ()
        constraints.forEach ((constraint, i) => {
            if (constraint instanceof Clutter.BindConstraint) {
                constraint.offset = offsets[i]
            }
        })
    }

    /**
     * Handler of 'notify::appears-focus' signal of Meta.Window, will be called
     * when focus of window has changed. Use to update shadow actor of rounded
     * corners window
     * @params win - Meta.Window
     */
    _on_focus_changed (win: Window) {
        const shadow = this.rounded_windows?.get (win)?.shadow
        if (!shadow) {
            return
        }

        const shadow_settings = win.appears_focused
            ? settings ().focused_shadow
            : settings ().unfocused_shadow

        const { border_radius, padding } = this._get_rounded_corners_cfg (win)

        this._update_shadow_actor_style (
            win,
            shadow,
            border_radius,
            shadow_settings,
            padding
        )
    }
}
