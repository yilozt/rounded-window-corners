// imports.gi
import * as Clutter               from '@gi/Clutter'
import { ShadowMode, WindowType } from '@gi/Meta'
import { WindowClientType }       from '@gi/Meta'
import { Bin }                    from '@gi/St'
import { BindingFlags }           from '@gi/GObject'

// local modules
import * as UI                    from '../utils/ui'
import { _log }                   from '../utils/log'
import constants                  from '../utils/constants'
import ClipShadowEffect           from '../effect/clip_shadow_effect'
import * as types                 from '../utils/types'
import settings                   from '../utils/settings'
import { Connections }            from '../utils/connections'
import RoundedCornersEffect       from '../effect/rounded-corners-effect'

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
    private connections = new Connections ()

    /** Shadow actors of window */
    private shadows: Map<Window, Bin> = new Map ()

    /** Rounded corners settings */
    private global_rounded_corners = settings ().global_rounded_corner_settings
    private custom_rounded_corners = settings ().custom_rounded_corner_settings

    constructor () {
        // watch settings
        this.connections.connect (
            settings ().g_settings,
            'changed',
            (_: Gio.Settings, key: string) =>
                this._on_settings_changed (key as SchemasKeys)
        )
    }

    // -------------------------------------------------------- [public methods]

    /** Call When enable extension */
    enable () {
        const wm = global.window_manager

        // Try to add rounded corners effect to all windows
        for (const actor of global.get_window_actors ()) {
            this._add_effect (actor)
        }

        // Add effects when window opened
        this.connections.connect (wm, 'map', (_: WM, actor: WindowActor) => {
            this._add_effect (actor)
        })

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
                const shadow = this.shadows.get (actor.meta_window)
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

        this.shadows.clear ()

        // Disconnect all signal
        this.connections.disconnect_all ()
    }

    query_shadow (win: Window): Bin | undefined {
        return this.shadows.get (win)
    }

    // ------------------------------------------------------- [private methods]

    /** Compute outer bound of rounded corners for window actor */
    private _compute_bounds (actor: WindowActor): types.Bounds {
        const win = actor.meta_window
        const [x, y, width, height] = UI.computeWindowContentsOffset (win)
        return {
            x1: x + 1,
            y1: y + 1,
            x2: x + actor.width + width,
            y2: y + actor.height + height,
        }
    }

    /**
     * Create Shadow for rounded corners window
     * @param actor -  window actor which has been setup rounded corners effect
     */
    private _create_shadow (actor: WindowActor) {
        const shadow = new Bin ({
            name: 'Shadow Actor',
            style: `padding: ${constants.SHADOW_PADDING}px
                             /*background: yellow*/;`,
            child: new Bin ({
                x_expand: true,
                y_expand: true,
            }),
        })
        ;(shadow.first_child as Bin).add_style_class_name ('shadow')

        this._update_shadow_actor_style (shadow)

        // We have to clip the shadow because of this issues:
        // https://gitlab.gnome.org/GNOME/gnome-shell/-/issues/4474
        shadow.add_effect_with_name (
            constants.CLIP_SHADOW_EFFECT,
            new ClipShadowEffect ()
        )

        const flag = BindingFlags.SYNC_CREATE

        for (const prop of [
            'pivot-point',
            'visible',
            'translation-x',
            'translation-y',
            'scale-x',
            'scale-y',
        ]) {
            actor.bind_property (prop, shadow, prop, flag)
        }

        actor.first_child.bind_property ('opacity', shadow, 'opacity', flag)

        // Insert shadow actor below window actor, now shadow actor
        // will show below window actor
        const parent = actor.get_parent ()
        parent != null && parent.insert_child_below (shadow, actor)

        // Add shadow into map so we can manager it later
        this.shadows.set (actor.meta_window, shadow)

        // Bind position and size
        this._bind_shadow_constraint (actor, shadow)
    }

    private _compute_shadow_actor_offset (actor: WindowActor): number[] {
        const [offset_x, offset_y, offset_width, offset_height] =
            UI.computeWindowContentsOffset (actor.meta_window)
        const shadow_padding = constants.SHADOW_PADDING * UI.scaleFactor ()
        return [
            offset_x - shadow_padding,
            offset_y - shadow_padding,
            2 * shadow_padding + offset_width,
            2 * shadow_padding + offset_height,
        ]
    }

    private _bind_shadow_constraint (actor: WindowActor, shadow: Bin) {
        const offsets = this._compute_shadow_actor_offset (actor)
        const coordinates = [
            Clutter.BindCoordinate.X,
            Clutter.BindCoordinate.Y,
            Clutter.BindCoordinate.WIDTH,
            Clutter.BindCoordinate.HEIGHT,
        ]
        coordinates
            .map (
                (coordinate, i) =>
                    new Clutter.BindConstraint ({
                        source: actor,
                        coordinate,
                        offset: offsets[i],
                    })
            )
            .forEach ((constraint) => shadow.add_constraint (constraint))
    }

    /** Update css style of shadow actor */
    private _update_shadow_actor_style (
        actor: Bin,
        border_radius = this.global_rounded_corners.border_radius,
        shadow = settings ().focused_shadow,
        { left, right, bottom, top } = this.global_rounded_corners.padding
    ) {
        const child = actor.first_child as Bin
        child.style = `background: white;
                       border-radius: ${border_radius * UI.scaleFactor ()}px;
                       ${types.box_shadow_css (shadow)};
                       margin: ${top}px ${right}px ${bottom}px ${left}px;`
        child.queue_redraw ()
    }

    /**
     * Add rounded corners effect and setup shadow actor for a window actor
     * @param actor - window to add effect
     */
    private _add_effect (actor: WindowActor & { shadow_mode?: ShadowMode }) {
        if (!RoundedCornersManager.should_enable_effect (actor.meta_window)) {
            return
        }

        const win = actor.meta_window

        // Add rounded corners to window actor when actor_to_setup is ready
        const ready = (actor_to_add_effect: Clutter.Actor) => {
            {
                const effect = new RoundedCornersEffect ()
                const name = constants.ROUNDED_CORNERS_EFFECT

                actor_to_add_effect.add_effect_with_name (name, effect)

                const cfg = this._get_rounded_corners_cfg (actor.meta_window)
                const skip_cfg = cfg.keep_rounded_corners
                this._setup_effect_skip_property (skip_cfg, win, effect)
                effect.update_uniforms (cfg, this._compute_bounds (actor), {
                    width: settings ().border_width,
                    color: settings ().border_color,
                })
            }

            // turn off original shadow for x11 window
            if (actor.shadow_mode !== undefined) {
                actor.shadow_mode = ShadowMode.FORCED_OFF
            }

            // Create shadow actor for window
            this._create_shadow (actor)

            this.on_size_changed (actor)

            // Update uniform variables when changed window size
            const source = actor.meta_window
            this.connections.connect (source, 'size-changed', () => {
                this.on_size_changed (actor)
            })

            // Need to listen 'damaged' signal, overwise XWayland client
            // will don't show contents, util you resize it manually
            this.connections.connect (actor, 'damaged', () => {
                this.on_size_changed (actor)
            })

            // Update shadow actor when focus of window has changed.
            this.connections.connect (source, 'notify::appears-focused', () => {
                this._on_focus_changed (source)
            })
        }

        UI.WhenSurfaceActorIsReady (this.connections, actor, () => {
            if (win.get_client_type () == WindowClientType.X11) {
                ready (actor.first_child)
            } else {
                ready (actor)
            }
        })
    }

    /**`
     * Remove rounded corners effect and shadow actor for a window actor
     * This method will be called when window is open, or change of settings
     * need remove rounded corners.
     */
    private _remove_effect (actor: WindowActor & { shadow_mode?: ShadowMode }) {
        const win = actor.meta_window
        const name = constants.ROUNDED_CORNERS_EFFECT
        if (win.get_client_type () == WindowClientType.X11) {
            actor.get_first_child ()?.remove_effect_by_name (name)
        } else {
            actor.remove_effect_by_name (name)
        }

        // Restore shadow for x11 windows
        if (actor.shadow_mode) {
            actor.shadow_mode = ShadowMode.AUTO
        }

        // Remove shadow actor
        const shadow = this.shadows.get (win)
        if (shadow) {
            global.window_group.remove_child (shadow)
            shadow.destroy ()
            this.shadows.delete (win)
        }

        // Remove handle for window, those handle has been added
        // in `_add_effect()`
        this.connections.disconnect_all (win)
        this.connections.disconnect_all (actor)
    }

    /**
     * Check whether a window should be enable rounded corners effect
     * @param win WindowActor to test
     */
    static should_enable_effect (win: Window): boolean {
        // Skip when application in black list.

        const wm_class_instance = win.get_wm_class_instance ()
        if (wm_class_instance == null) {
            _log (`Warning: wm_class_instance of ${win}: ${win.title} is null`)
            return false
        }

        if (settings ().black_list.includes (wm_class_instance)) {
            return false
        }

        // Check type of window, only need to add rounded corners to normal
        // window and dialog.

        const normal_type = [
            WindowType.NORMAL,
            WindowType.DIALOG,
            WindowType.MODAL_DIALOG,
        ].includes (win.window_type)
        if (!normal_type) {
            return false
        }

        // Skip libhandy / libadwaita applications according the settings.
        const { getAppType, AppType } = UI

        const app_type = getAppType (win)
        _log ('Check Type of window:' + `${win.title} => ${AppType[app_type]}`)

        if (settings ().skip_libadwaita_app) {
            if (getAppType (win) === AppType.LibAdwaita) {
                return false
            }
        }
        if (settings ().skip_libhandy_app) {
            if (getAppType (win) === AppType.LibHandy) {
                return false
            }
        }

        return true
    }

    /** Query rounded corners effect of window actor  */
    private _get_rounded_corners (
        actor: WindowActor
    ): RoundedCornersEffectType | null | undefined {
        const client_type = actor.meta_window.get_client_type ()
        const name = constants.ROUNDED_CORNERS_EFFECT

        type Res = RoundedCornersEffectType | null | undefined

        if (client_type == WindowClientType.X11) {
            return actor.get_first_child ()?.get_effect (name) as Res
        } else {
            return actor.get_effect (name) as Res
        }
    }

    /** Traversal all windows, add or remove rounded corners for them */
    private _update_all_window_effect_state () {
        global.get_window_actors ().forEach ((actor) => {
            const should_enable = RoundedCornersManager.should_enable_effect (
                actor.meta_window
            )
            const has_effect = this._get_rounded_corners (actor) != null

            if (should_enable && !has_effect) {
                this._add_effect (actor)
                return
            }

            if (!should_enable && has_effect) {
                this._remove_effect (actor)
                return
            }
        })
    }

    /** Update style for all shadow actors */
    private _update_all_shadow_actor_style () {
        global.get_window_actors ().forEach ((actor) => {
            const shadow = this.shadows.get (actor.meta_window)
            const shadow_cfg = actor.meta_window.appears_focused
                ? settings ().focused_shadow
                : settings ().unfocused_shadow
            if (shadow) {
                const { border_radius, padding } =
                    this._get_rounded_corners_cfg (actor.meta_window)

                this._update_shadow_actor_style (
                    shadow,
                    border_radius,
                    shadow_cfg,
                    padding
                )
            }
        })
    }

    private _get_rounded_corners_cfg (win: Window): types.RoundedCornersCfg {
        return UI.ChoiceRoundedCornersCfg (
            this.global_rounded_corners,
            this.custom_rounded_corners,
            win
        )
    }

    /**
     * This method will be called when global rounded corners settings changed.
     */
    private _update_rounded_corners_settings () {
        this.global_rounded_corners = settings ().global_rounded_corner_settings
        this.custom_rounded_corners = settings ().custom_rounded_corner_settings

        global
            .get_window_actors ()
            .filter ((actor) => this._get_rounded_corners (actor) != null)
            .forEach ((actor) => this.on_size_changed (actor))
        this._update_all_shadow_actor_style ()
    }

    /** Skip effect window is maximized */
    private _setup_effect_skip_property (
        keep_rounded_corners: boolean,
        win: Window,
        effect: RoundedCornersEffectType
    ): boolean {
        const maximized =
            win.maximized_horizontally ||
            win.maximized_vertically ||
            win.fullscreen
        effect.skip = !keep_rounded_corners && maximized
        return effect.skip
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
            this._update_rounded_corners_settings ()
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

        // When size changed. update uniforms for window
        const effect = this._get_rounded_corners (actor)

        if (effect) {
            const cfg = this._get_rounded_corners_cfg (win)
            this._setup_effect_skip_property (
                cfg.keep_rounded_corners,
                win,
                effect
            )
            effect.update_uniforms (cfg, this._compute_bounds (actor), {
                width: settings ().border_width,
                color: settings ().border_color,
            })
        }

        // Update BindConstraint for shadow
        const shadow = this.shadows.get (win)
        if (!shadow) {
            return
        }
        const offsets = this._compute_shadow_actor_offset (actor)
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
        const shadow = this.shadows.get (win)
        if (!shadow) {
            return
        }

        const shadow_settings = win.appears_focused
            ? settings ().focused_shadow
            : settings ().unfocused_shadow

        const { border_radius, padding } = this._get_rounded_corners_cfg (win)

        this._update_shadow_actor_style (
            shadow,
            border_radius,
            shadow_settings,
            padding
        )
    }
}
