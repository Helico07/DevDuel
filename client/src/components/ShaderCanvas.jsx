import { useEffect, useRef } from 'react';

// ─── GLSL Shaders ─────────────────────────────────────────────────────────────
// Kept as module-level constants so they are not re-created on every render.

const VERTEX_SHADER = `
attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAGMENT_SHADER = `
precision highp float;
varying vec2 v_texCoord;
uniform float u_time;
uniform vec2 u_resolution;

void main() {
    vec2 uv = v_texCoord;

    // Subtle animated grid
    vec2 grid = fract(uv * 20.0 - u_time * 0.1);
    float line = smoothstep(0.02, 0.0, grid.x) + smoothstep(0.02, 0.0, grid.y);

    // Flowing sine-wave pulse across the surface
    float pulse = sin(uv.x * 5.0 + u_time) * cos(uv.y * 5.0 + u_time) * 0.5 + 0.5;

    // DevDuel palette
    vec3 bg     = vec3(0.039, 0.055, 0.09);   // Deep Navy  #0a0e17
    vec3 accent = vec3(0.545, 0.36,  0.965);  // Electric Violet #8b5cf6

    vec3 color = mix(bg, accent * 0.15, pulse);
    color += line * accent * 0.1;

    // Code-rain particle effect
    float rain  = fract(sin(dot(floor(uv * vec2(40.0, 1.0)), vec2(12.9898, 78.233))) * 43758.5453);
    float speed = 0.5 + rain * 1.5;
    float drop  = smoothstep(0.98, 1.0, fract(uv.y + u_time * 0.2 * speed + rain));
    color += drop * accent * 0.4 * (1.0 - uv.y);

    gl_FragColor = vec4(color, 1.0);
}`;

// ─── ShaderCanvas ─────────────────────────────────────────────────────────────
// Renders the animated WebGL background used in the hero section.
//
// Why useRef + useEffect instead of useState?
// The WebGL context, animation frame ID, and mouse position are imperative /
// side-effect data that should never trigger React re-renders.  useRef gives us
// a mutable container that persists across renders without re-rendering on change.
// useEffect wires up the GL lifecycle after the DOM is ready and tears it down
// (cancelAnimationFrame + removeEventListener) when the component unmounts.
//
// Props:
//   className — Tailwind classes applied to the <canvas> (e.g. position, opacity)

export default function ShaderCanvas({ className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Canvas size sync ──────────────────────────────────────────────────────
    // WebGL's drawing buffer (canvas.width/height) must match the CSS layout size
    // (canvas.clientWidth/Height) or the image will be blurry / stretched.
    // ResizeObserver fires whenever the element's layout size changes.
    function syncSize() {
      const w = canvas.clientWidth  || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width  = w;
        canvas.height = h;
      }
    }

    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(syncSize);
      ro.observe(canvas);
    }
    syncSize();

    // ── WebGL setup ───────────────────────────────────────────────────────────
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    function compileShader(type, src) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      return shader;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, compileShader(gl.VERTEX_SHADER,   VERTEX_SHADER));
    gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    // Full-screen quad (2 triangles as a TRIANGLE_STRIP)
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

    const posLoc  = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uTime  = gl.getUniformLocation(prog, 'u_time');
    const uRes   = gl.getUniformLocation(prog, 'u_resolution');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');

    // ── Mouse tracking ────────────────────────────────────────────────────────
    // u_mouse is in pixel coordinates matching u_resolution (ShaderToy convention)
    let mouse = { x: canvas.width / 2, y: canvas.height / 2 };

    function onMouseMove(e) {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        const nx = (e.clientX - rect.left)  / rect.width;
        const ny = 1.0 - (e.clientY - rect.top) / rect.height;  // flip Y for GL coords
        mouse.x  = nx * canvas.width;
        mouse.y  = ny * canvas.height;
      }
    }
    window.addEventListener('mousemove', onMouseMove);

    // ── Render loop ───────────────────────────────────────────────────────────
    let rafId;
    function render(t) {
      if (typeof ResizeObserver === 'undefined') syncSize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime)  gl.uniform1f(uTime,  t * 0.001);
      if (uRes)   gl.uniform2f(uRes,   canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafId = requestAnimationFrame(render);
    }
    rafId = requestAnimationFrame(render);

    // ── Cleanup ───────────────────────────────────────────────────────────────
    // React StrictMode mounts → unmounts → remounts in dev, so cleanup is critical
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      if (ro) ro.disconnect();
    };
  }, []); // empty deps — run once on mount, clean up on unmount

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: '100%' }}
      className={className}
    />
  );
}
