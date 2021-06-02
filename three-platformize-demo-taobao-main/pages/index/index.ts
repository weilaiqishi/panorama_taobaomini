// index.ts
import * as THREE from 'three-platformize'
import { TaobaoPlatform } from 'three-platformize/src/TaobaoPlatform'
import EventTarget, { Touch } from 'three-platformize/src/libs/EventTarget'
import { GLTFLoader } from 'three-platformize/examples/jsm/loaders/GLTFLoader'
import { Demo } from 'three-platformize-demo/src/index'

import { PanoramaLoader } from './PanoramaLoader'

const eventBus = require('../../utils/EventEmitter').eventBus
const tbFont = require('../../utils/tbFont')
const utils = require('../../utils/utils')

// @ts-ignore
Page({
  data: {},
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
      THREE.PLATFORM.set(this.platform);

      console.log(THREE.$window.innerWidth, THREE.$window.innerHeight, THREE.$window.devicePixelRatio)
      console.log(canvas.width, canvas.height)

      const canW = Math.round(canvasRect.width * 1.01) // 确保填满屏幕
      const canH = Math.round(canvasRect.height * 1.01)
      const renderer = new THREE.WebGL1Renderer({ canvas, antialias: false, alpha: true });
      // const camera = new PerspectiveCamera(75, canW / canH, 0.1, 1000);
      const camera = new THREE.PerspectiveCamera(90, canW / canH, 0.1, 100);
      const scene = new THREE.Scene();
      // scene.add(new THREE.AxisHelper(1000))
      const clock = new THREE.Clock();
      // const gltfLoader = new GLTFLoader();
      const textureLoader = new THREE.TextureLoader();
      const dpr = tbFont.isDev() ? 1 : THREE.$window.devicePixelRatio
      this.deps = { canvas, renderer, camera, scene, clock, textureLoader, eventBus, dpr }; // gltfLoader, ,

      // scene.position.z = -3;
      // renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.setPixelRatio(tbFont.isDev() ? 1 : dpr);
      renderer.setSize(canW, canH);

      // scene.background = new THREE.Color(0x000000);
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
  async loadContent() {
    const demo = new (PanoramaLoader)(this.deps) as Demo;
    await demo.init();

    (this.currDemo as Demo)?.dispose()
    this.currDemo = demo;
  },
  // ide中webgl点击事件没反应
  onTX(e) {
    this.deps.eventBus.emit('click', e)
    this.platform.dispatchTouchEvent(e)
  },
  onUnload() {
    this.disposing = true;
    this.currDemo?.dispose()
    THREE.PLATFORM.dispose()
  },
})
