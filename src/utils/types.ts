/** Location of uniform variants of rounded corners effect */
export class Uniforms {
    bounds = 0
    clip_radius = 0
    inner_bounds = 0
    inner_clip_radius = 0
    pixel_step = 0
    skip = 0
    border_width = 0
    border_brightness = 0
}

/** Bounds of rounded corners  */
export class Bounds {
    x1 = 0
    y1 = 0
    x2 = 0
    y2 = 0
}

export interface Padding {
    left: number
    right: number
    top: number
    bottom: number
}

/** Store into settings, rounded corners configuration  */
export interface RoundedCornersCfg {
    keep_rounded_corners: boolean
    border_radius: number
    padding: Padding
    enabled: boolean
}

export interface CustomRoundedCornersCfg {
    [wm_class_instance: string]: RoundedCornersCfg
}

export interface BoxShadow {
    opacity: number
    spread_radius: number
    blur_offset: number
    vertical_offset: number
    horizontal_offset: number
}

export const box_shadow_css = (box_shadow: BoxShadow) => {
    return `box-shadow: ${box_shadow.horizontal_offset}px
            ${box_shadow.vertical_offset}px
            ${box_shadow.blur_offset}px
            ${box_shadow.spread_radius}px
            rgba(0,0,0, ${box_shadow.opacity / 100})`
}
