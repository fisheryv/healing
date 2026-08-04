/**
 * suminagashi.js — GPU 流体模拟水墨画引擎
 *
 * 基于 src/suminagashi/index.html 的实现，封装为可复用模块。
 * 速度场（稳定流动）+ 染料场（吸光度蓄积）+ 和纸显示（减法混色）。
 *
 * 用法:
 *   const engine = new Suminagashi(canvas)
 *   engine.splatInk(x, y, color, strength)   // 投放一滴墨
 *   engine.splatVelocity(x, y, fx, fy)       // 投放速度
 *   engine.step(dt)                          // 推进模拟
 *   engine.render()                          // 渲染到 canvas
 *   engine.captureDataURL()                  // 截取当前画面
 *   engine.dispose()                         // 销毁释放资源
 */

import * as THREE from 'three'

// ── 墨色定义（显示色 → 吸光矢量） ──
export const INKS = {
  sumi: new THREE.Color('#1a1a1f'),
  ai: new THREE.Color('#16407a'),
  shu: new THREE.Color('#c8372d'),
  matsuba: new THREE.Color('#2e6e52'),
}
export const INK_KEYS = Object.keys(INKS)
const PAPER = new THREE.Color('#efeae0')

// 将显示色 c 转为吸光度矢量（越深 exp(-A) 越接近 c）
function inkAbsorption(c, strength) {
  const e = 0.012
  return new THREE.Vector3(
    -Math.log(Math.max(c.r, e)) * strength,
    -Math.log(Math.max(c.g, e)) * strength,
    -Math.log(Math.max(c.b, e)) * strength
  )
}

const VERT = /* glsl */`
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`

function prog(frag, uniforms) {
  return new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: frag,
    uniforms,
    depthTest: false,
    depthWrite: false,
  })
}

export class Suminagashi {
  constructor(canvas, opts = {}) {
    this.config = {
      SIM_RES: 256,
      DYE_RES: 1280,
      PRESSURE_ITER: 28,
      VEL_DISSIPATION: 0.16,
      DYE_DISSIPATION: 0.07,
      CURL: 14,
      SPLAT_RADIUS: 0.0026,
      SPLAT_FORCE: 5200,
      ...opts,
    }

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: true, // 用于 toDataURL 截图
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.renderer.autoClear = false

    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    this.scene = new THREE.Scene()
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null)
    this.scene.add(this.quad)

    this._initShaders()
    this.resize()
  }

  _initShaders() {
    this.advectMat = prog(/* glsl */`
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uVelocity, uSource;
      uniform vec2 uTexel;
      uniform float uDt, uDissipation;
      void main(){
        vec2 coord = vUv - uDt * texture2D(uVelocity, vUv).xy * uTexel;
        vec4 result = texture2D(uSource, coord);
        gl_FragColor = result / (1.0 + uDissipation * uDt);
      }
    `, {
      uVelocity: { value: null }, uSource: { value: null },
      uTexel: { value: new THREE.Vector2() }, uDt: { value: 0 }, uDissipation: { value: 0 },
    })

    this.splatMat = prog(/* glsl */`
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uTarget;
      uniform float uAspect, uRadius;
      uniform vec2 uPoint;
      uniform vec3 uColor;
      void main(){
        vec2 p = vUv - uPoint;
        p.x *= uAspect;
        vec3 splat = exp(-dot(p, p) / uRadius) * uColor;
        gl_FragColor = vec4(texture2D(uTarget, vUv).rgb + splat, 1.0);
      }
    `, {
      uTarget: { value: null }, uAspect: { value: 1 }, uRadius: { value: 0.001 },
      uPoint: { value: new THREE.Vector2() }, uColor: { value: new THREE.Vector3() },
    })

    this.curlMat = prog(/* glsl */`
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uVelocity;
      uniform vec2 uTexel;
      void main(){
        float L = texture2D(uVelocity, vUv - vec2(uTexel.x, 0.0)).y;
        float R = texture2D(uVelocity, vUv + vec2(uTexel.x, 0.0)).y;
        float B = texture2D(uVelocity, vUv - vec2(0.0, uTexel.y)).x;
        float T = texture2D(uVelocity, vUv + vec2(0.0, uTexel.y)).x;
        gl_FragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
      }
    `, { uVelocity: { value: null }, uTexel: { value: new THREE.Vector2() } })

    this.vorticityMat = prog(/* glsl */`
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uVelocity, uCurl;
      uniform vec2 uTexel;
      uniform float uCurlStrength, uDt;
      void main(){
        float L = texture2D(uCurl, vUv - vec2(uTexel.x, 0.0)).x;
        float R = texture2D(uCurl, vUv + vec2(uTexel.x, 0.0)).x;
        float B = texture2D(uCurl, vUv - vec2(0.0, uTexel.y)).x;
        float T = texture2D(uCurl, vUv + vec2(0.0, uTexel.y)).x;
        float C = texture2D(uCurl, vUv).x;
        vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
        force /= length(force) + 0.0001;
        force *= uCurlStrength * C;
        force.y *= -1.0;
        vec2 vel = texture2D(uVelocity, vUv).xy + force * uDt;
        gl_FragColor = vec4(clamp(vel, -1000.0, 1000.0), 0.0, 1.0);
      }
    `, {
      uVelocity: { value: null }, uCurl: { value: null },
      uTexel: { value: new THREE.Vector2() }, uCurlStrength: { value: 0 }, uDt: { value: 0 },
    })

    this.divergeMat = prog(/* glsl */`
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uVelocity;
      uniform vec2 uTexel;
      void main(){
        float L = texture2D(uVelocity, vUv - vec2(uTexel.x, 0.0)).x;
        float R = texture2D(uVelocity, vUv + vec2(uTexel.x, 0.0)).x;
        float B = texture2D(uVelocity, vUv - vec2(0.0, uTexel.y)).y;
        float T = texture2D(uVelocity, vUv + vec2(0.0, uTexel.y)).y;
        vec2 C = texture2D(uVelocity, vUv).xy;
        if (vUv.x - uTexel.x < 0.0) L = -C.x;
        if (vUv.x + uTexel.x > 1.0) R = -C.x;
        if (vUv.y - uTexel.y < 0.0) B = -C.y;
        if (vUv.y + uTexel.y > 1.0) T = -C.y;
        gl_FragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
      }
    `, { uVelocity: { value: null }, uTexel: { value: new THREE.Vector2() } })

    this.pressureMat = prog(/* glsl */`
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uPressure, uDivergence;
      uniform vec2 uTexel;
      void main(){
        float L = texture2D(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
        float R = texture2D(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
        float B = texture2D(uPressure, vUv - vec2(0.0, uTexel.y)).x;
        float T = texture2D(uPressure, vUv + vec2(0.0, uTexel.y)).x;
        float div = texture2D(uDivergence, vUv).x;
        gl_FragColor = vec4((L + R + B + T - div) * 0.25, 0.0, 0.0, 1.0);
      }
    `, { uPressure: { value: null }, uDivergence: { value: null }, uTexel: { value: new THREE.Vector2() } })

    this.gradientMat = prog(/* glsl */`
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uPressure, uVelocity;
      uniform vec2 uTexel;
      void main(){
        float L = texture2D(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
        float R = texture2D(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
        float B = texture2D(uPressure, vUv - vec2(0.0, uTexel.y)).x;
        float T = texture2D(uPressure, vUv + vec2(0.0, uTexel.y)).x;
        vec2 vel = texture2D(uVelocity, vUv).xy - vec2(R - L, T - B);
        gl_FragColor = vec4(vel, 0.0, 1.0);
      }
    `, { uPressure: { value: null }, uVelocity: { value: null }, uTexel: { value: new THREE.Vector2() } })

    this.clearMat = prog(/* glsl */`
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uTexture;
      uniform float uValue;
      void main(){ gl_FragColor = uValue * texture2D(uTexture, vUv); }
    `, { uTexture: { value: null }, uValue: { value: 0.8 } })

    this.displayMat = prog(/* glsl */`
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uDye;
      uniform vec2 uTexel;
      uniform vec3 uPaper;
      uniform float uTime;

      float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float noise(vec2 p){
        vec2 i=floor(p), f=fract(p);
        f=f*f*(3.0-2.0*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
                   mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
      }

      void main(){
        float fiber = noise(vUv * 420.0) * 0.028
                    + noise(vUv * 180.0) * 0.022
                    + noise(vUv * 60.0)  * 0.018;
        vec3 A = texture2D(uDye, vUv).rgb;
        vec3 col = uPaper * exp(-A) + fiber;
        vec2 uv2 = vUv * (1.0 - vUv.yx);
        float vign = pow(uv2.x * uv2.y * 15.0, 0.18);
        col *= 0.92 + 0.08 * vign;
        gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
      }
    `, {
      uDye: { value: null }, uTexel: { value: new THREE.Vector2() },
      uPaper: { value: new THREE.Vector3(PAPER.r, PAPER.g, PAPER.b) },
      uTime: { value: 0 },
    })
  }

  _makeRT(w, h) {
    return new THREE.WebGLRenderTarget(w, h, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType,
      depthBuffer: false,
    })
  }

  _makeDoubleFBO(w, h) {
    const self = this
    return {
      read: self._makeRT(w, h),
      write: self._makeRT(w, h),
      texel: new THREE.Vector2(1 / w, 1 / h),
      swap() { const t = this.read; this.read = this.write; this.write = t },
      resize(nw, nh) {
        this.read.setSize(nw, nh); this.write.setSize(nw, nh)
        this.texel.set(1 / nw, 1 / nh)
      },
    }
  }

  _simSizes() {
    const w = this.renderer.domElement.clientWidth
    const h = this.renderer.domElement.clientHeight
    const aspect = w / h
    const sim = this.config.SIM_RES
    const dye = Math.min(this.config.DYE_RES, Math.max(w, h))
    return aspect >= 1
      ? { sw: Math.round(sim * aspect), sh: sim, dw: dye, dh: Math.round(dye / aspect) }
      : { sw: sim, sh: Math.round(sim / aspect), dw: Math.round(dye * aspect), dh: dye }
  }

  resize() {
    const w = this.renderer.domElement.clientWidth
    const h = this.renderer.domElement.clientHeight
    this.renderer.setSize(w, h, false)

    const S = this._simSizes()
    this.S = S
    if (!this.velocity) {
      this.velocity = this._makeDoubleFBO(S.sw, S.sh)
      this.dye = this._makeDoubleFBO(S.dw, S.dh)
      this.pressure = this._makeDoubleFBO(S.sw, S.sh)
      this.curlRT = this._makeRT(S.sw, S.sh)
      this.divergeRT = this._makeRT(S.sw, S.sh)
    } else {
      this.velocity.resize(S.sw, S.sh)
      this.pressure.resize(S.sw, S.sh)
      this.curlRT.setSize(S.sw, S.sh)
      this.divergeRT.setSize(S.sw, S.sh)
      this.dye.resize(S.dw, S.dh)
    }
  }

  _blit(mat, target) {
    this.quad.material = mat
    this.renderer.setRenderTarget(target)
    this.renderer.render(this.scene, this.camera)
  }

  /** 在 (x,y) 处投放速度向量 (fx, fy) */
  splatVelocity(x, y, fx, fy, radiusMul = 1) {
    const m = this.splatMat
    m.uniforms.uTarget.value = this.velocity.read.texture
    m.uniforms.uAspect.value = this.renderer.domElement.clientWidth / this.renderer.domElement.clientHeight
    m.uniforms.uPoint.value.set(x, y)
    m.uniforms.uRadius.value = this.config.SPLAT_RADIUS * radiusMul
    m.uniforms.uColor.value.set(fx, fy, 0)
    this._blit(m, this.velocity.write)
    this.velocity.swap()
  }

  /** 在 (x,y) 处投放墨水（吸光度矢量） */
  splatDye(x, y, absorption, radiusMul = 1) {
    const m = this.splatMat
    m.uniforms.uTarget.value = this.dye.read.texture
    m.uniforms.uAspect.value = this.renderer.domElement.clientWidth / this.renderer.domElement.clientHeight
    m.uniforms.uPoint.value.set(x, y)
    m.uniforms.uRadius.value = this.config.SPLAT_RADIUS * radiusMul
    m.uniforms.uColor.value.copy(absorption)
    this._blit(m, this.dye.write)
    this.dye.swap()
  }

  /** 投放一滴墨：同时添加染料和随机速度 */
  dropInk(x, y, color, strength) {
    const abs = inkAbsorption(color, strength * 0.22)
    this.splatDye(x, y, abs, 1.0)
    const angle = Math.random() * Math.PI * 2
    const speed = 60 + Math.random() * 80
    this.splatVelocity(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 1.2)
  }

  /**
   * 沿笔触方向投放墨水（连续笔触，无随机溅射）。
   * 染料沿 (dirX, dirY) 方向流动，形成连贯墨迹而非墨点。
   */
  strokeInk(x, y, color, strength, dirX, dirY, radiusMul = 0.8) {
    const abs = inkAbsorption(color, strength * 0.22)
    this.splatDye(x, y, abs, radiusMul)
    // 沿笔触方向添加速度（让墨水沿笔迹流动，而非四散溅射）
    const v = 30 + strength * 50
    this.splatVelocity(x, y, dirX * v, dirY * v, 1.0)
  }

  /** 推进一个模拟步 */
  step(dt) {
    const c = this.config

    // curl
    this.curlMat.uniforms.uVelocity.value = this.velocity.read.texture
    this.curlMat.uniforms.uTexel.value.copy(this.velocity.texel)
    this._blit(this.curlMat, this.curlRT)

    // vorticity confinement
    this.vorticityMat.uniforms.uVelocity.value = this.velocity.read.texture
    this.vorticityMat.uniforms.uCurl.value = this.curlRT.texture
    this.vorticityMat.uniforms.uTexel.value.copy(this.velocity.texel)
    this.vorticityMat.uniforms.uCurlStrength.value = c.CURL
    this.vorticityMat.uniforms.uDt.value = dt
    this._blit(this.vorticityMat, this.velocity.write)
    this.velocity.swap()

    // divergence
    this.divergeMat.uniforms.uVelocity.value = this.velocity.read.texture
    this.divergeMat.uniforms.uTexel.value.copy(this.velocity.texel)
    this._blit(this.divergeMat, this.divergeRT)

    // pressure: 衰减后迭代
    this.clearMat.uniforms.uTexture.value = this.pressure.read.texture
    this.clearMat.uniforms.uValue.value = 0.8
    this._blit(this.clearMat, this.pressure.write)
    this.pressure.swap()

    this.pressureMat.uniforms.uDivergence.value = this.divergeRT.texture
    this.pressureMat.uniforms.uTexel.value.copy(this.velocity.texel)
    for (let i = 0; i < c.PRESSURE_ITER; i++) {
      this.pressureMat.uniforms.uPressure.value = this.pressure.read.texture
      this._blit(this.pressureMat, this.pressure.write)
      this.pressure.swap()
    }

    // gradient subtract
    this.gradientMat.uniforms.uPressure.value = this.pressure.read.texture
    this.gradientMat.uniforms.uVelocity.value = this.velocity.read.texture
    this.gradientMat.uniforms.uTexel.value.copy(this.velocity.texel)
    this._blit(this.gradientMat, this.velocity.write)
    this.velocity.swap()

    // advect velocity
    this.advectMat.uniforms.uVelocity.value = this.velocity.read.texture
    this.advectMat.uniforms.uSource.value = this.velocity.read.texture
    this.advectMat.uniforms.uTexel.value.copy(this.velocity.texel)
    this.advectMat.uniforms.uDt.value = dt
    this.advectMat.uniforms.uDissipation.value = c.VEL_DISSIPATION
    this._blit(this.advectMat, this.velocity.write)
    this.velocity.swap()

    // advect dye
    this.advectMat.uniforms.uVelocity.value = this.velocity.read.texture
    this.advectMat.uniforms.uSource.value = this.dye.read.texture
    this.advectMat.uniforms.uTexel.value.copy(this.dye.texel)
    this.advectMat.uniforms.uDissipation.value = c.DYE_DISSIPATION
    this._blit(this.advectMat, this.dye.write)
    this.dye.swap()
  }

  /** 渲染到 canvas */
  render(time = 0) {
    this.displayMat.uniforms.uDye.value = this.dye.read.texture
    this.displayMat.uniforms.uTexel.value.copy(this.dye.texel)
    this.displayMat.uniforms.uTime.value = time * 0.001
    this._blit(this.displayMat, null)
  }

  /** 截取当前画面为 data URL */
  captureDataURL() {
    this.render(performance.now())
    return this.renderer.domElement.toDataURL('image/png')
  }

  /** 销毁释放资源 */
  dispose() {
    if (this.velocity) {
      this.velocity.read.dispose(); this.velocity.write.dispose()
      this.dye.read.dispose(); this.dye.write.dispose()
      this.pressure.read.dispose(); this.pressure.write.dispose()
      this.curlRT.dispose(); this.divergeRT.dispose()
    }
    this.quad.geometry.dispose()
    this.renderer.dispose()
  }
}
