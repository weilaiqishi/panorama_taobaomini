// index.ts
import { $window as window, Clock, PerspectiveCamera, PLATFORM, Scene, sRGBEncoding, TextureLoader, WebGL1Renderer, Color } from 'three-platformize'
import { TaobaoPlatform } from 'three-platformize/src/TaobaoPlatform'
import EventTarget, { Touch } from 'three-platformize/src/libs/EventTarget'
import { GLTFLoader } from 'three-platformize/examples/jsm/loaders/GLTFLoader'
import { Demo } from 'three-platformize-demo/src/index'
import { PanoramaLoader } from './PanoramaLoader'

function isDev() {
  return my.getSystemInfoSync().app === 'taobao'
}

// @ts-ignore
Page({
  data: {
  },
  async loadContent() {
    try {
      my.showLoading()
      const demo = new (PanoramaLoader)(this.deps) as Demo;
      await demo.init();

      (this.currDemo as Demo)?.dispose()
      this.currDemo = demo;
    } catch (error) {
      // @ts-ignore
      my.alert({ content: error + ':' + JSON.stringify(error) })
    } finally {
      my.hideLoading()
    }
  },
  onCanvasReady() {
    // @ts-ignore
    Promise.all([
      new Promise(resolve => my.createSelectorQuery().select('.canvas').boundingClientRect().exec(resolve)),
      new Promise((resolve, reject) => {
        my.createCanvas({
          id: 'gl',
          success: resolve,
          fail: reject
        })
      })
    ])
      .then(async ([res, canvas]) => {
        await this.initCanvas(canvas, res[0])
        this.loadContent()
      })
      .catch(() => my.alert({ content: '初始canvas失败' }))
  },
  async initCanvas(canvas, canvasRect) {
    try {
      this.platform = new TaobaoPlatform(canvas);
      PLATFORM.set(this.platform);

      console.log(window.innerWidth, window.innerHeight, window.devicePixelRatio)
      console.log(canvas.width, canvas.height)

      const canW = Math.round(canvasRect.width * 1.01) // 确保填满屏幕
      const canH = Math.round(canvasRect.height * 1.01)
      const renderer = new WebGL1Renderer({ canvas, antialias: false, alpha: true });
      // const camera = new PerspectiveCamera(75, canW / canH, 0.1, 1000);
      const camera = new PerspectiveCamera(90, canW / canH, 0.1, 100);
      const scene = new Scene();
      const clock = new Clock();
      const gltfLoader = new GLTFLoader();
      const textureLoader = new TextureLoader();

      this.deps = { renderer, camera, scene, clock, gltfLoader, textureLoader };

      // scene.position.z = -3;
      renderer.outputEncoding = sRGBEncoding;
      renderer.setPixelRatio(isDev() ? 1 : window.devicePixelRatio);
      renderer.setSize(canW, canH);

      // scene.background = new Color(0xffffff);
      // const geo = new PlaneBufferGeometry()
      // const mat = new MeshBasicMaterial({ color: 0x123456 })
      // scene.add(new Mesh(geo, mat))

      const render = () => {
        if (this.disposing) return
        canvas.requestAnimationFrame(render);
        (this.currDemo as Demo)?.update()
        renderer.render(scene, camera);
      }

      render()
    } catch (error) {
      // @ts-ignore
      my.alert({ content: error + ':' + JSON.stringify(error) })
    }
  },

  // ide中webgl点击事件没反应
  onTX(e) {
    const { x, y } = e.changedTouches[0]
    this.platform.dispatchTouchEvent(e)
  },

  onUnload() {
    this.disposing = true;
    this.currDemo?.dispose()
    PLATFORM.dispose()
  },
})
