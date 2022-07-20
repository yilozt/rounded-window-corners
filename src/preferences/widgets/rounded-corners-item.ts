// imports.gi
import * as GObject          from '@gi/GObject'
import * as Gtk              from '@gi/Gtk'

// local modules
import { template_url }      from '../../utils/io'
import { RoundedCornersCfg } from '../../utils/types'
import { connections }       from '../../connections'

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

        watch (on_cfg_changed: (cfg: RoundedCornersCfg) => void) {
            connections ().connect (
                this._rounded_in_maximized_switch,
                'state-set',
                () => on_cfg_changed (this.cfg)
            )
            for (const scale of this._scales) {
                connections ().connect (scale, 'value-changed', () => {
                    on_cfg_changed (this.cfg)
                })
            }
        }

        unwatch () {
            for (const scale of this._scales) {
                connections ().disconnect_all (scale)
            }
            connections ().disconnect_all (this._rounded_in_maximized_switch)
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
    }
)
