// imports.gi
import * as GObject          from '@gi/GObject'
import * as Gtk              from '@gi/Gtk'

// local modules
import { template_url }      from '../../utils'
import { RoundedCornersCfg } from '../../types'

// ------------------------------------------------------------------ end import

export default GObject.registerClass (
    {
        Template: template_url (import.meta.url, './rounded-corners-item.ui'),
        GTypeName: 'RoundedCornersItem',
        InternalChildren: [
            'rounded_in_maximized_switch',
            'border_radius_scale',
            'padding_left_scale',
            'padding_right_scale',
            'padding_top_scale',
            'padding_bottom_scale',
        ],
    },
    class extends Gtk.ListBox {
        private _rounded_in_maximized_switch !: Gtk.Switch
        private _border_radius_scale         !: Gtk.Scale
        private _padding_left_scale          !: Gtk.Scale
        private _padding_right_scale         !: Gtk.Scale
        private _padding_top_scale           !: Gtk.Scale
        private _padding_bottom_scale        !: Gtk.Scale

        private _scales = [
            this._border_radius_scale,
            this._padding_bottom_scale,
            this._padding_left_scale,
            this._padding_right_scale,
            this._padding_top_scale,
        ]
        constructor () {
            super ()
            //     this._scales.forEach ((scale) =>
            //         scale.set_format_value_func ((scale, val) => {
            //             _log (scale)
            //             return val + ' px'
            //         })
            //     )
        }

        private connects: Map<GObject.Object, number> = new Map ()

        watch (on_cfg_changed: (cfg: RoundedCornersCfg) => void) {
            if (this.connect.length != 0) {
                throw Error ('Only can watch once.')
            }
            this.connects.set (
                this._rounded_in_maximized_switch,
                this._rounded_in_maximized_switch.connect (
                    'notify::active',
                    () => on_cfg_changed (this.cfg)
                )
            )
            this._scales.map ((scale) =>
                this.connects.set (
                    scale.adjustment,
                    scale.adjustment.connect ('value-changed', () =>
                        on_cfg_changed (this.cfg)
                    )
                )
            )
        }

        unwatch () {
            this.connects.forEach ((v, k) => k.disconnect (v))
            this.connects.clear ()
        }

        get cfg (): RoundedCornersCfg {
            return {
                padding: {
                    left: this._padding_left_scale.get_value (),
                    right: this._padding_right_scale.get_value (),
                    top: this._padding_top_scale.get_value (),
                    bottom: this._padding_bottom_scale.get_value (),
                },
                keep_rounded_corners: this._rounded_in_maximized_switch.active,
                border_radius: this._border_radius_scale.get_value (),
                enabled: true,
            }
        }

        set cfg (cfg: RoundedCornersCfg) {
            this._rounded_in_maximized_switch.active = cfg.keep_rounded_corners
            this._border_radius_scale.set_value (cfg.border_radius)
            this._padding_left_scale.set_value (cfg.padding.left)
            this._padding_right_scale.set_value (cfg.padding.right)
            this._padding_top_scale.set_value (cfg.padding.top)
            this._padding_bottom_scale.set_value (cfg.padding.bottom)
        }

        vfunc_dispose (): void {
            this._scales.forEach ((scale) => scale.set_format_value_func (null))
            super.vfunc_dispose ()
        }
    }
)
