// imports.gi
import { BindConstraint, BindCoordinate } from '@gi/Clutter'
import { BindingFlags }                   from '@gi/GObject'
import { BlurMode }                       from '@gi/Shell'
import { Bin }                            from '@gi/St'

// local modules
import RepaintSignal                      from './effect/repaint-signal'
import { Connections }                    from './connections'
import settings                           from './utils/settings'
import * as UI                            from './utils/ui'
import constants                          from './utils/constants'
import { Padding }                        from './utils/types'
import { RoundedCornersManager }          from './rounded-corners-manager'

// types
import { WindowActor, Window }            from '@gi/Meta'
import { WM }                             from '@gi/Shell'
import { imports, BlurEffect, global }    from '@global'
import { SchemasKeys }                    from './utils/settings'
import { Settings }                       from '@gi/Gio'

// --------------------------------------------------------------- [end imports]

// Patched blur effect
let blurEffect: typeof BlurEffect | null = null

export class BlurEffectManager {
    private blur_actors = new Map<Window, Bin> ()
    private _enabled = false
    private connections = new Connections ()

    /** Called when extension is enable  */
    enable () {
        if (!this._check_lib ()) {
            return
        }

        this._enabled = true

        // try to add blur effect to windows have opened
        global.get_window_actors ().forEach ((a) => {
            this._should_enable_effect (a.meta_window) && this._add_effect (a)
        })

        const repaint = () => {
            this.blur_actors.forEach ((blur_actor) => {
                if (blur_actor.visible) {
                    blur_actor.get_effects ()[0].queue_repaint ()
                }
            })
        }

        const background = global.window_group.first_child
        const repaint_effect = new RepaintSignal ()
        background.add_effect_with_name ('Repaint Effect', repaint_effect)
        const c = this.connections

        c.connect (repaint_effect, 'repaint', () => repaint ())

        const wm = global.window_manager
        /** When window is opened  */
        c.connect (wm, 'map', (_: WM, actor: WindowActor) => {
            if (this._should_enable_effect (actor.meta_window)) {
                this._add_effect (actor)
            }
        })

        /** When window is closed  */
        c.connect (wm, 'destroy', (_: WM, actor: WindowActor) => {
            this._remove_effect (actor)
        })

        /** When window raised & down */
        c.connect (global.display, 'restacked', () => {
            this.blur_actors.forEach ((blur, win) => {
                if (!blur.visible) {
                    return
                }

                const actor: WindowActor = win.get_compositor_private ()
                global.window_group.set_child_below_sibling (blur, actor)
            })
        })

        /** When Settings has changed  */
        const gs = settings ().g_settings
        c.connect (gs, 'changed', (_: Settings, k: string) => {
            this._settings_changed (k)
        })
    }

    /** Called when extension is disable  */
    disable () {
        global.get_window_actors ().forEach ((a) => this._remove_effect (a))
        this.connections.disconnect_all ()
        global.window_group.first_child.remove_effect_by_name ('Repaint Effect')
        this._enabled = false
    }

    query_blur (win: Window): Bin | undefined {
        return this.blur_actors.get (win)
    }

    // ------------------------------------------------------- [private methods]

    private _check_lib (): boolean {
        if (this._enabled) {
            return false
        }

        try {
            blurEffect = imports.gi.Patched.BlurEffect
        } catch (e) {
            return false
        }

        if (!blurEffect) {
            return false
        }
        return true
    }

    /** Decide wether should add blur effect to a window */
    private _should_enable_effect (win: Window) {
        if (!win) {
            return false
        }
        // Skip when window shouldn't have rounded corners effect
        if (!RoundedCornersManager.should_enable_effect (win)) {
            return false
        }
        const class_instance = win.get_wm_class_instance ()
        if (!class_instance) {
            return false
        }
        return settings ().blur_list.includes (class_instance)
    }

    /** Add Blur effect to window  */
    private _add_effect (actor: WindowActor) {
        UI.WhenSurfaceActorIsReady (this.connections, actor, () => {
            const blur_actor = new Bin ()
            blur_actor.set_name ('Blur Actor')

            // Bind props

            const flag = BindingFlags.SYNC_CREATE
            for (const prop of [
                'pivot-point',
                'visible',
                'translation-x',
                'translation-y',
                'scale-x',
                'scale-y',
            ]) {
                actor.bind_property (prop, blur_actor, prop, flag)
            }

            // Bind Position and Size of blur actor
            const coordinates = [
                BindCoordinate.X,
                BindCoordinate.Y,
                BindCoordinate.WIDTH,
                BindCoordinate.HEIGHT,
            ]
            for (const coordinate of coordinates) {
                blur_actor.add_constraint (
                    new BindConstraint ({
                        source: actor,
                        coordinate,
                        offset: 0,
                    })
                )
            }

            this.blur_actors.set (actor.meta_window, blur_actor)

            if (!blurEffect) {
                return
            }
            const effect = new blurEffect ()
            effect.mode = BlurMode.BACKGROUND
            blur_actor.add_effect_with_name (constants.BLUR_EFFECT, effect)

            global.window_group.insert_child_below (blur_actor, actor)

            this.update_coordinates (actor.meta_window)
            this.update_blur_effect (actor)

            this.connections.connect (actor.meta_window, 'size-changed', () => {
                this.update_coordinates (actor.meta_window)
            })
        })
    }

    private _remove_effect (actor: WindowActor) {
        this.connections.disconnect_all (actor)
        this.connections.disconnect_all (actor.meta_window)

        const blur_actor = this.blur_actors.get (actor.meta_window)
        if (blur_actor) {
            const surface = actor.get_first_child ()
            if (surface) {
                surface.opacity = 255
            }

            blur_actor.destroy ()
            this.blur_actors.delete (actor.meta_window)
        }
    }

    compute_offset_of_blur (win: Window): [number, number, number, number] {
        const blur_actor = this.blur_actors.get (win)
        if (!blur_actor) {
            return [0, 0, 0, 0]
        }

        const cfg = UI.ChoiceRoundedCornersCfg (
            settings ().global_rounded_corner_settings,
            settings ().custom_rounded_corner_settings,
            win
        )
        const should_have_padding =
            cfg.keep_rounded_corners ||
            !(
                win.maximized_horizontally ||
                win.maximized_vertically ||
                win.fullscreen
            )

        const [x, y, width, height] = UI.computeWindowContentsOffset (win)

        // Set padding to zero when window should skip rounded corners
        const padding = should_have_padding ? cfg.padding : new Padding ()

        const scale = UI.scaleFactor ()

        return [
            x + padding.left * scale,
            y + padding.top * scale,
            width - (padding.left + padding.right + 1) * scale,
            height - (padding.top + padding.bottom + 1) * scale,
        ]
    }

    update_coordinates (win: Window) {
        const blur_actor = this.blur_actors.get (win)
        if (!blur_actor) {
            return
        }

        const constraints = blur_actor.get_constraints () as BindConstraint[]
        this.compute_offset_of_blur (win).forEach (
            (offset, i) => (constraints[i].offset = offset)
        )
    }

    update_blur_effect (actor: WindowActor) {
        const win = actor.meta_window
        const _effect = this.blur_actors.get (win)?.get_effects ()[0]
        const effect = _effect as BlurEffect
        if (effect) {
            effect.radius =
                settings ().global_rounded_corner_settings.border_radius
            effect.sigma = settings ().blur_sigma
            actor.first_child.opacity = settings ().blur_window_opacity
        }
    }

    private _settings_changed (k: string) {
        const key = k as SchemasKeys
        switch (key) {
        case 'black-list':
        case 'blur-list':
        case 'skip-libadwaita-app':
        case 'skip-libhandy-app':
            for (const actor of global.get_window_actors ()) {
                const win = actor.meta_window
                const blurred = this.blur_actors.get (win) !== undefined
                const should_be_blurred = this._should_enable_effect (win)

                if (blurred && !should_be_blurred) {
                    this._remove_effect (actor)
                }
                if (!blurred && should_be_blurred) {
                    this._add_effect (actor)
                }
            }
            break
        case 'blur-sigma':
        case 'blur-window-opacity':
        case 'custom-rounded-corner-settings':
        case 'global-rounded-corner-settings':
            this.blur_actors.forEach ((_, win) => {
                const actor = win.get_compositor_private ()
                this.update_blur_effect (actor as WindowActor)
                this.update_coordinates (win)
            })
            break
        }
    }
}
