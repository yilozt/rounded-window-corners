varying vec2 vsPos;

const vec2 rect[4] = vec2[] (
  vec2(0.0, 0.0), vec2(1.0, 0.0), vec2(0.0, 1.0), vec2(1.0, 1.0)
);

void main() {
vsPos = rect[gl_VertexID];
}