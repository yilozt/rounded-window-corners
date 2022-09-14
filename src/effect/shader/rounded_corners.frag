// This shader is copied from Mutter project:
// https://gitlab.gnome.org/GNOME/mutter/-/blob/main/src/compositor/meta-background-content.c
//
// With a litte change to make it works well with windows

// The uniforms variables for controls
uniform vec4  bounds;           // x, y: top left; z, w: bottom right
uniform float clip_radius;
uniform vec4  inner_bounds;
uniform float inner_clip_radius;
uniform vec2  pixel_step;
uniform float border_width;
uniform vec4  border_color;
uniform float smoothing;


float circle_bounds(vec2 p, vec2 center, float clip_radius) {
  vec2 delta = p - vec2(center.x, center.y);
  float dist_squared = dot(delta, delta);

  // Fully outside the circle
  float outer_radius = clip_radius + 0.5;
  if(dist_squared >= (outer_radius * outer_radius))
    return 0.0;

  // Fully inside the circle
  float inner_radius = clip_radius - 0.5;
  if(dist_squared <= (inner_radius * inner_radius))
    return 1.0;

  // Only pixels on the edge of the curve need expensive antialiasing
  return outer_radius - sqrt(dist_squared);
}

float squircle_bounds(vec2 p, vec2 center, float clip_radius, float exponent) {
  vec2 delta = abs(p - center);

  float pow_dx = pow(delta.x, exponent);
  float pow_dy = pow(delta.y, exponent);
  
  float dist = pow(pow_dx + pow_dy, 1.0 / exponent);

  return clamp(clip_radius - dist + 0.5, 0.0, 1.0);
}

float rounded_rect_coverage(vec2 p, vec4 bounds, float clip_radius, float exponent) {
  // Outside the bounds
  if(p.x < bounds.x || p.x > bounds.z || p.y < bounds.y || p.y > bounds.w) {
    return 0.0;
  }
  
  vec2 center;
  
  float center_left = bounds.x + clip_radius;
  float center_right = bounds.z - clip_radius;

  if(p.x < center_left)
    center.x = center_left;
  else if(p.x > center_right)
    center.x = center_right;
  else
    return 1.0; // The vast majority of pixels exit early here

  float center_top = bounds.y + clip_radius;
  float center_bottom = bounds.w - clip_radius;

  if(p.y < center_top)
      center.y = center_top;
  else if(p.y > center_bottom)
    center.y = center_bottom;
  else
    return 1.0;
  
  if(exponent <= 2.0) {
    return circle_bounds(p, center, clip_radius);
  } else {
    return squircle_bounds(p, center, clip_radius, exponent);
  }
}

void main() {
  float exponent = smoothing * 10.0 + 2.0;

  float radius = clip_radius * 0.5 * exponent;

  float max_radius = min(bounds.z - bounds.x, bounds.w - bounds.y) * 0.5;

  if(radius > max_radius) {
    exponent *= max_radius / radius;
    radius = max_radius;
  }

  float inner_radius = inner_clip_radius * (radius / clip_radius);

  vec2 texture_coord = cogl_tex_coord0_in.xy / pixel_step;

  float outer_alpha = rounded_rect_coverage(texture_coord, bounds, radius, exponent);

  // Clip window corners first
  cogl_color_out.a *= outer_alpha;

  // Draw border later
  if(border_width > 0.9 || border_width < -0.9) {
    float inner_alpha = rounded_rect_coverage(texture_coord, inner_bounds, inner_radius, exponent);
    float border_alpha = clamp(abs(outer_alpha - inner_alpha), 0.0, 1.0);

    if (border_width > 0.9) {
      // If border is drawing inside window, mix color of window
      cogl_color_out = mix(cogl_color_out, vec4(border_color.rgb, 1.0), border_alpha * border_color.a);
      cogl_color_out.a *= outer_alpha;
    } else {
      // If border is drawing outside window, just draw border
      cogl_color_out = mix(cogl_color_out, border_color, border_alpha);
    }
  }
}
