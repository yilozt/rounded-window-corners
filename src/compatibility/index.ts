import { CompizeAlikeMagicLampEffect } from '@me/compatibility/compiz_alike_magic_lamp_effect'
import { RoundedCornersManager }       from '@me/manager/rounded_corners_manager'

type DetailCompatibility = {
    enable(rounded_corners_manager: RoundedCornersManager | null): void
    disable(): void
}

export class Compatibility {
    private enable_list: null | DetailCompatibility[] = null
    enable (rounded_corners_manager: RoundedCornersManager | null) {
        this.enable_list = [new CompizeAlikeMagicLampEffect ()]

        for (const e of this.enable_list) {
            e.enable (rounded_corners_manager)
        }
    }

    disable () {
        for (const e of this.enable_list ?? []) {
            e.disable ()
        }
        this.enable_list = null
    }
}
