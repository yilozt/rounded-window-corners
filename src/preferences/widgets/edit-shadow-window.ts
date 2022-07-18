// imports.gi
import * as Adw           from '@gi/Adw'
import * as Gtk           from '@gi/Gtk'
import { registerClass }  from '@gi/GObject'

// local modules
import { box_shadow_css } from '../../types'
import { template_url }   from '../../utils'
import settings           from '../../settings'

// just used to mark type of value, will be remove in output javascript
import { BoxShadow }      from '../../types'

// ----------------------------------------------------------------- end imports

/// Shadow edit window
///
/// This widget used to edit shadow of windows which use rounded corners
/// effects.

export default registerClass (
    {
        Template: template_url (import.meta.url, './edit-shadow-window.ui'),
        GTypeName: 'EditShadowWindow',
        InternalChildren: [
            'opacity_scale',
            'spread_radius_scale',
            'blur_offset_scale',
            'vertical_offset_scale',
            'horizontal_offset_scale',
            'unfocus_shadow_widget',
            'focus_shadow_widget',
            'focus_toggle_button',
        ],
    },
    class extends Adw.Window {
        private _opacity_scale           !: Gtk.Scale
        private _spread_radius_scale     !: Gtk.Scale
        private _blur_offset_scale       !: Gtk.Scale
        private _vertical_offset_scale   !: Gtk.Scale
        private _horizontal_offset_scale !: Gtk.Scale
        private _unfocus_shadow_widget   !: Gtk.Widget
        private _focus_shadow_widget     !: Gtk.Widget
        private _focus_toggle_button     !: Gtk.ToggleButton

        // CssProvider to change style of preview widgets in edit window
        private unfocus_provider = new Gtk.CssProvider ()
        private focus_provider = new Gtk.CssProvider ()

        // Load box-shadow from settings
        private focus_shadow: BoxShadow = settings ().focus_shadow
        private unfocus_shadow: BoxShadow = settings ().unfocus_shadow

        constructor () {
            super ()

            // Init style of preview widgets
            this._unfocus_shadow_widget
                .get_style_context ()
                .add_provider (
                    this.unfocus_provider,
                    Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
                )
            this._focus_shadow_widget
                .get_style_context ()
                .add_provider (
                    this.focus_provider,
                    Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
                )

            // Init value controls from settings
            this.update_widget ()
            this.update_style ()

            // Update values of controls when click toggle button
            this._focus_toggle_button.connect ('toggled', () =>
                this.update_widget ()
            )
        }

        private update_widget () {
            const shadow = this._focus_toggle_button.get_active ()
                ? this.focus_shadow
                : this.unfocus_shadow
            this._vertical_offset_scale.set_value (shadow.vertical_offset)
            this._horizontal_offset_scale.set_value (shadow.horizontal_offset)
            this._blur_offset_scale.set_value (shadow.blur_offset)
            this._spread_radius_scale.set_value (shadow.spread_radius)
            this._opacity_scale.set_value (shadow.opacity)
        }

        private update_cfg () {
            const shadow: BoxShadow = {
                vertical_offset: this._vertical_offset_scale.get_value (),
                horizontal_offset: this._horizontal_offset_scale.get_value (),
                blur_offset: this._blur_offset_scale.get_value (),
                spread_radius: this._spread_radius_scale.get_value (),
                opacity: this._opacity_scale.get_value (),
            }
            if (this._focus_toggle_button.get_active ()) {
                this.focus_shadow = shadow
            } else {
                this.unfocus_shadow = shadow
            }

            // Store into settings
            settings ().unfocus_shadow = this.unfocus_shadow
            settings ().focus_shadow = this.focus_shadow
        }

        private update_style () {
            const gen_style = (
                normal_style: BoxShadow,
                hover_style: BoxShadow
            ) =>
                new TextEncoder ().encode (`
            label {
                background-color: white;
                transition: box-shadow 200ms;
                ${box_shadow_css (normal_style)};
            }
            label:hover {
                ${box_shadow_css (hover_style)};
            }`)
            this.unfocus_provider.load_from_data (
                gen_style (this.unfocus_shadow, this.focus_shadow)
            )
            this.focus_provider.load_from_data (
                gen_style (this.focus_shadow, this.unfocus_shadow)
            )
        }

        // signal handles

        _hide_window_cb () {
            this.hide ()
        }

        on_value_changed () {
            this.update_cfg ()
            this.update_style ()
        }
    }
)
