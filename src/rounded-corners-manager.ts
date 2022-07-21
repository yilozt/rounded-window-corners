// imports.gi
import * as Clutter            from '@gi/Clutter'
import { WindowType }          from '@gi/Meta'
import { Bin }                 from '@gi/St'
import { BindingFlags }        from '@gi/GObject'

// local modules
import * as UI                 from './utils/ui'
import { _log }                from './utils/log'
import constants               from './utils/constants'
import ClipShadowEffect        from './effect/clip_shadow_effect'
import * as types              from './utils/types'
import settings                from './utils/settings'
import { Connections }         from './connections'
import RoundedCornersEffect    from './effect/rounded-corners-effect'

// types, those import statements will be removed in output javascript files.
import { SchemasKeys }         from './utils/settings'
import { Window, WindowActor } from '@gi/Meta'
import { WM }                  from '@gi/Shell'
import { global }              from '@global'
import * as Gio                from '@gi/Gio'

// --------------------------------------------------------------- [end imports]

const e = new RoundedCornersEffect ()
type RoundedCornersEffectType = typeof e

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
        this.shadows.forEach ((shadow, win) => {
            shadow.destroy ()
            const actor = win.get_compositor_private () as Clutter.Actor
            actor.remove_effect_by_name (constants.ROUNDED_CORNERS_EFFECT)
        })

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
            'opacity',
            'translation-x',
            'translation-y',
        ]) {
            actor.bind_property (prop, shadow, prop, flag)
        }

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
        shadow = settings ().focus_shadow,
        { left, right, bottom, top } = this.global_rounded_corners.padding
    ) {
        const child = actor.first_child as Bin
        child.style = `background: white;
                       border-radius: ${border_radius}px;
                       ${types.box_shadow_css (shadow)};
                       margin: ${top}px ${right}px ${bottom}px ${left}px;`
        child.queue_redraw ()
    }

    /**
     * Add rounded corners effect and setup shadow actor for a window actor
     * @param actor - window to add effect
     */
    private _add_effect (actor: WindowActor) {
        if (!this._should_enable_effect (actor.meta_window)) {
            return
        }

        // Add rounded corners to window actor
        {
            const effect = new RoundedCornersEffect ()
            const name = constants.ROUNDED_CORNERS_EFFECT
            actor.add_effect_with_name (name, effect)

            const cfg = this._get_rounded_corners_cfg (actor.meta_window)
            const skip_cfg = cfg.keep_rounded_corners
            const win = actor.meta_window
            this._setup_effect_skip_property (skip_cfg, win, effect)
            effect.update_uniforms (cfg, this._compute_bounds (actor))
        }

        // Create shadow actor for window
        this._create_shadow (actor)

        this.on_size_changed (actor)

        // Update uniform variables when changed window size
        const source = actor.meta_window
        this.connections.connect (source, 'size-changed', () => {
            this.on_size_changed (actor)
        })
        this.connections.connect (source, 'notify::appears-focused', () => {
            this._on_focus_changed (source)
        })
    }

    /**`
     * Remove rounded corners effect and shadow actor for a window actor
     * This method will be called when window is open, or change of settings
     * need remove rounded corners.
     */
    private _remove_effect (actor: WindowActor) {
        const win = actor.meta_window
        actor.remove_effect_by_name (constants.ROUNDED_CORNERS_EFFECT)

        // Remove shadow actor
        const shadow = this.shadows.get (win)
        if (shadow) {
            global.window_group.remove_child (shadow)
            shadow.destroy ()
            this.shadows.delete (win)
        }

        // Remove handle for window
        this.connections.disconnect_all (win)
    }

    /**
     * Check whether a window should be enable rounded corners effect
     * @param win WindowActor to test
     */
    private _should_enable_effect (win: Window): boolean {
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

    /** Traversal all windows, add or remove rounded corners for them */
    private _update_all_window_effect_state () {
        global.get_window_actors ().forEach ((actor) => {
            const should_enable = this._should_enable_effect (actor.meta_window)
            const effect_name = constants.ROUNDED_CORNERS_EFFECT
            const has_effect = actor.get_effect (effect_name) != null

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
                ? settings ().focus_shadow
                : settings ().unfocus_shadow
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
        const k = win.get_wm_class_instance ()
        if (
            k == null ||
            !this.custom_rounded_corners[k] ||
            !this.custom_rounded_corners[k].enabled
        ) {
            return this.global_rounded_corners
        }

        const custom_cfg = this.custom_rounded_corners[k]
        // Need to skip border radius item from custom settings
        custom_cfg.border_radius = this.global_rounded_corners.border_radius
        return custom_cfg
    }

    /**
     * This method will be called when global rounded corners settings changed.
     */
    private _update_rounded_corners_settings () {
        this.global_rounded_corners = settings ().global_rounded_corner_settings
        this.custom_rounded_corners = settings ().custom_rounded_corner_settings

        const effect_name = constants.ROUNDED_CORNERS_EFFECT
        global
            .get_window_actors ()
            .filter ((actor) => actor.get_effect (effect_name) != null)
            .forEach ((actor) => this.on_size_changed (actor))
        this._update_all_shadow_actor_style ()
    }

    /** Skip effect window is maximized */
    private _setup_effect_skip_property (
        keep_rounded_corners: boolean,
        win: Window,
        effect: RoundedCornersEffectType
    ): boolean {
        const skip =
            !keep_rounded_corners &&
            (win.maximized_horizontally ||
                win.maximized_vertically ||
                win.fullscreen)
        effect.skip = skip
        return skip
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
        case 'focus-shadow':
        case 'unfocus-shadow':
            this._update_all_shadow_actor_style ()
            break
        case 'global-rounded-corner-settings':
        case 'custom-rounded-corner-settings':
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
        const effect = actor.get_effect (
            constants.ROUNDED_CORNERS_EFFECT
        ) as RoundedCornersEffectType | null

        if (effect) {
            const cfg = this._get_rounded_corners_cfg (win)
            if (
                !this._setup_effect_skip_property (
                    cfg.keep_rounded_corners,
                    win,
                    effect
                )
            ) {
                effect.update_uniforms (
                    this._get_rounded_corners_cfg (win),
                    this._compute_bounds (actor)
                )
            }
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
    private _on_focus_changed (win: Window) {
        const shadow = this.shadows.get (win)
        if (!shadow) {
            return
        }

        const shadow_settings = win.appears_focused
            ? settings ().focus_shadow
            : settings ().unfocus_shadow

        const { border_radius, padding } = this._get_rounded_corners_cfg (win)

        this._update_shadow_actor_style (
            shadow,
            border_radius,
            shadow_settings,
            padding
        )
    }
}
