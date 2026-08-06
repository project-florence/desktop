import { useEffect, useRef } from 'react'
import { createQualityTier } from '@/lib/quality'

const COUNT = 7000

const starVs = `
  attribute vec3 aPosition;
  uniform float uStretch;
  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;
  varying float vDistance;

  void main() {
    vec3 pos = aPosition;
    if (aPosition.z > -800.0) {
      pos.z += uStretch * (aPosition.z * 0.005);
    }
    vec4 mvPos = uModelViewMatrix * vec4(pos, 1.0);
    gl_Position = uProjectionMatrix * mvPos;
    gl_PointSize = (1.8 + uStretch * 0.04) * (300.0 / -mvPos.z);
    vDistance = -mvPos.z;
  }
`

const starFs = `
  precision highp float;
  uniform float uOpacity;
  varying float vDistance;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    float alpha = (1.0 - smoothstep(100.0, 950.0, vDistance)) * uOpacity;
    vec3 color = mix(vec3(1.0), vec3(0.75, 0.88, 1.0), dist * 2.0);
    gl_FragColor = vec4(color, alpha * (1.0 - dist * 2.0));
  }
`

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

function makeProgram(gl: WebGLRenderingContext, vsSrc: string, fsSrc: string) {
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSrc)
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSrc)
  if (!vs || !fs) return null
  const prog = gl.createProgram()
  if (!prog) return null
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn(gl.getProgramInfoLog(prog))
    gl.deleteProgram(prog)
    return null
  }
  return prog
}

function getUniformLocation(gl: WebGLRenderingContext, program: WebGLProgram, name: string) {
  const loc = gl.getUniformLocation(program, name)
  if (loc === null) console.warn('Uniform not found:', name)
  return loc
}

export function HyperspaceBackground({
  hyperdriveTriggered,
  onHyperdriveComplete,
}: {
  hyperdriveTriggered: boolean
  onHyperdriveComplete: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const flashRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(false)
  const hyperdriveActiveRef = useRef(false)
  const hyperdriveStartRef = useRef(0)
  const redirectedRef = useRef(false)
  const completeCallbackRef = useRef(onHyperdriveComplete)

  useEffect(() => {
    completeCallbackRef.current = onHyperdriveComplete
  }, [onHyperdriveComplete])

  useEffect(() => {
    if (hyperdriveTriggered && !hyperdriveActiveRef.current) {
      hyperdriveActiveRef.current = true
      hyperdriveStartRef.current = performance.now()
      redirectedRef.current = false
    }
  }, [hyperdriveTriggered])

  useEffect(() => {
    if (mountedRef.current) return
    mountedRef.current = true

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('webgl', { antialias: true })
    if (!ctx) { mountedRef.current = false; return }
    const gl = ctx

    const starProg = makeProgram(gl, starVs, starFs)
    if (!starProg) { mountedRef.current = false; return }

    const aStarPos = gl.getAttribLocation(starProg, 'aPosition')
    const uStarStretch = getUniformLocation(gl, starProg, 'uStretch')
    const uStarMV = getUniformLocation(gl, starProg, 'uModelViewMatrix')
    const uStarProj = getUniformLocation(gl, starProg, 'uProjectionMatrix')
    const uStarOpacity = getUniformLocation(gl, starProg, 'uOpacity')

    // star positions
    const positions = new Float32Array(COUNT * 3)
    const velocities = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) {
      const radius = 10 + Math.random() * 160
      const theta = Math.random() * Math.PI * 2
      positions[i * 3] = Math.cos(theta) * radius
      positions[i * 3 + 1] = Math.sin(theta) * radius
      positions[i * 3 + 2] = -Math.random() * 1000
      velocities[i] = 0.8 + Math.random() * 1.5
    }

    const starBuf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, starBuf)
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW)

    // view matrix: camera at (0,0,1) looking at origin
    const viewMatrix = new Float32Array([
      -1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, -1, 1,
    ])

    const projMatrix = new Float32Array(16)
    let animId = 0
    let hidden = false
    const quality = createQualityTier()
    let speed = 1.5
    let stretch = 0
    let whiteAlpha = 0

    function updateProjection() {
      const fov = 60 * Math.PI / 180
      const aspect = canvas!.width / canvas!.height || 1
      const near = 0.1, far = 1000
      const f = 1 / Math.tan(fov / 2)
      const rangeInv = 1 / (near - far)

      // column-major
      projMatrix.set([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) * rangeInv, -1,
        0, 0, 2 * far * near * rangeInv, 0,
      ])
    }

    function onVisibility() { hidden = document.hidden }
    document.addEventListener('visibilitychange', onVisibility)

    function resize() {
      const cfg = quality.getConfig()
      const w = Math.round(window.innerWidth * cfg.scale)
      const h = Math.round(window.innerHeight * cfg.scale)
      canvas!.width = w
      canvas!.height = h
      canvas!.style.width = window.innerWidth + 'px'
      canvas!.style.height = window.innerHeight + 'px'
      gl!.viewport(0, 0, w, h)
      updateProjection()
    }

    window.addEventListener('resize', resize)
    resize()

    function render() {
      if (!hidden) quality.frame()
      if (hidden) { animId = requestAnimationFrame(render); return }
      // hyperdrive state machine
      if (hyperdriveActiveRef.current) {
        const elapsed = (performance.now() - hyperdriveStartRef.current) / 1000

        if (elapsed < 2.2) {
          const t = elapsed / 2.2
          const easeIn = t * t * t
          speed = 1.5 + easeIn * 110
          stretch = easeIn * 140
          whiteAlpha = Math.max(0, (t - 0.6) * 2.5)
        } else if (elapsed < 3.2) {
          speed = 120
          stretch = 140
          whiteAlpha = 1
        } else if (!redirectedRef.current) {
          redirectedRef.current = true
          hyperdriveActiveRef.current = false
          completeCallbackRef.current()
          return // stop rendering
        }
      } else {
        speed = 1.5
        stretch = 0
        whiteAlpha = 0
      }

      // update HTML flash overlay opacity
      if (flashRef.current) {
        flashRef.current.style.opacity = String(whiteAlpha)
      }

      // update star Z positions
      for (let i = 0; i < COUNT; i++) {
        positions[i * 3 + 2] += speed * velocities[i] * 0.1
        if (positions[i * 3 + 2] > 0) {
          positions[i * 3 + 2] = -1000
        }
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, starBuf)
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, positions)

      // --- draw stars ---
      gl.useProgram(starProg)

      gl.bindBuffer(gl.ARRAY_BUFFER, starBuf)
      gl.enableVertexAttribArray(aStarPos)
      gl.vertexAttribPointer(aStarPos, 3, gl.FLOAT, false, 0, 0)

      gl.uniformMatrix4fv(uStarMV, false, viewMatrix)
      gl.uniformMatrix4fv(uStarProj, false, projMatrix)
      gl.uniform1f(uStarStretch, stretch)
      gl.uniform1f(uStarOpacity, 1)

      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
      gl.depthMask(false)

      gl.drawArrays(gl.POINTS, 0, COUNT)
      animId = requestAnimationFrame(render)
    }

    animId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animId)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('resize', resize)
      mountedRef.current = false
    }
  }, [])

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full z-0 pointer-events-none"
      />
      <div
        ref={flashRef}
        className="fixed inset-0 z-50 pointer-events-none bg-white"
        style={{ opacity: 0 }}
      />
    </>
  )
}
