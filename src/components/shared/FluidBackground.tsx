import { useEffect, useRef } from 'react'
import { createQualityTier } from '@/lib/quality'

const vsSource = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`

const fsSource = `
  precision highp float;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_mouse;

  vec2 grad(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(dot(grad(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
                   dot(grad(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
               mix(dot(grad(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
                   dot(grad(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
  }

  void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;
    st.x *= aspect;

    vec2 mouseST = u_mouse;
    mouseST.x *= aspect;

    float dist = distance(st, mouseST);
    float brush = 1.0 - smoothstep(0.0, 0.5, dist);

    float t = u_time * 0.15;

    vec2 q = vec2(0.0);
    q.x = noise(st * 3.0 + vec2(t) + brush * 0.5);
    q.y = noise(st * 3.0 + vec2(t * 0.6) - brush * 0.5);

    vec2 r = vec2(0.0);
    r.x = noise(st * 3.0 + 3.0 * q + vec2(1.7, 9.2) + t * 0.1);
    r.y = noise(st * 3.0 + 3.0 * q + vec2(8.3, 2.8) + t * 0.08);

    float f = noise(st * 3.0 + 4.0 * r);

    vec3 colDarkViolet  = vec3(0.03, 0.01, 0.10);
    vec3 colCyan        = vec3(0.00, 0.75, 0.90);
    vec3 colMagenta     = vec3(0.85, 0.10, 0.60);
    vec3 colWarmGold    = vec3(1.00, 0.60, 0.20);

    vec3 color = mix(colDarkViolet, colCyan, clamp(f * f * 3.0, 0.0, 1.0));
    color = mix(color, colMagenta, clamp(length(q) * 1.2, 0.0, 1.0));
    color = mix(color, colWarmGold, clamp(r.x + brush * 0.3, 0.0, 1.0));
    color += vec3(1.0, 0.9, 0.7) * pow(brush, 4.0) * 0.6;

    color = pow(color, vec3(1.1));
    gl_FragColor = vec4(color, 1.0);
  }
`

export function FluidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mountedRef = useRef(false)

  useEffect(() => {
    if (mountedRef.current) return
    mountedRef.current = true

    const canvasEl = canvasRef.current
    if (!canvasEl) return

    const quality = createQualityTier()

    const glCtx = canvasEl.getContext('webgl', { powerPreference: 'high-performance', antialias: false })
    if (!glCtx) {
      console.warn('WebGL not supported')
      return
    }

    const canvas: HTMLCanvasElement = canvasEl
    const gl: WebGLRenderingContext = glCtx

    let mouseX = 0.5
    let mouseY = 0.5
    let targetMouseX = 0.5
    let targetMouseY = 0.5
    let animId = 0

    function createShader(gl: WebGLRenderingContext, type: number, source: string) {
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn(gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
      }
      return shader
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource)
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource)
    if (!vs || !fs) { mountedRef.current = false; return }

    const program = gl.createProgram()
    if (!program) { mountedRef.current = false; return }
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    gl.useProgram(program)

    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW)

    const posLoc = gl.getAttribLocation(program, 'position')
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

    const resLoc = gl.getUniformLocation(program, 'u_resolution')
    const timeLoc = gl.getUniformLocation(program, 'u_time')
    const mouseLoc = gl.getUniformLocation(program, 'u_mouse')

    function updateMouse(e: MouseEvent | TouchEvent) {
      let x: number, y: number
      if ('touches' in e && e.touches.length > 0) {
        x = e.touches[0].clientX
        y = e.touches[0].clientY
      } else if ('clientX' in e) {
        x = e.clientX
        y = e.clientY
      } else {
        return
      }
      targetMouseX = x / window.innerWidth
      targetMouseY = 1.0 - (y / window.innerHeight)
    }

    window.addEventListener('mousemove', updateMouse)
    window.addEventListener('touchmove', updateMouse)

    function resize() {
      const cfg = quality.getConfig()
      const w = Math.round(window.innerWidth * cfg.scale)
      const h = Math.round(window.innerHeight * cfg.scale)
      canvas.width = w
      canvas.height = h
      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = window.innerHeight + 'px'
      gl.viewport(0, 0, w, h)
    }
    window.addEventListener('resize', resize)
    resize()

    let hidden = false
    function onVisibility() { hidden = document.hidden }
    document.addEventListener('visibilitychange', onVisibility)

    function render(time: number) {
      if (!hidden) quality.frame()
      if (hidden) return
      gl.useProgram(program)
      mouseX += (targetMouseX - mouseX) * 0.1
      mouseY += (targetMouseY - mouseY) * 0.1
      gl.uniform2f(resLoc, canvas.width, canvas.height)
      gl.uniform1f(timeLoc, time * 0.001)
      gl.uniform2f(mouseLoc, mouseX, mouseY)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      animId = requestAnimationFrame(render)
    }
    animId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animId)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('mousemove', updateMouse)
      window.removeEventListener('touchmove', updateMouse)
      window.removeEventListener('resize', resize)
      mountedRef.current = false
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full z-0 pointer-events-none"
    />
  )
}
