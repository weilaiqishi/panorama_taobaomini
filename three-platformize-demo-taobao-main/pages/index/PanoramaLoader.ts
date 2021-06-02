import { Demo } from 'three-platformize-demo/src/index'
import * as THREE from 'three-platformize';

const utils = require('../../utils/utils')
const [requestAnimationFrame, cancelAnimationFrame] = utils.makeAnimationFrame()

export class PanoramaLoader extends Demo {
  mesh1
  mesh2
  mainScene
  canClick = true

  current = 0
  guidepostsMap
  guidepostsMaterial
  guideposts: any[] = []
  time = 0

  panoramasCount = 0
  panoramas = ['https://topfullstackkimeng.oss-cn-hangzhou.aliyuncs.com/night1.jpg', 'https://isv.alibabausercontent.com/00000000/imgextra/i3/3981030266/O1CN0154rnpS1Dps2LsPLyM_!!3981030266-0-isvtu-00000000.jpg']
  panoramasTexture: any = []
  guidepostsOption = [
    [
      {
        x: 4340 / 7680 * 100,
        y: 2170 / 3840 * 100,
        next: 1
      },
    ],
    [
      {
        x: 4340 / 7680 * 100,
        y: 2170 / 3840 * 100,
        next: 0
      },
    ]
  ];
  async init(): Promise<void> {
    // 主场景
    this.mainScene = new THREE.Scene()
    this.add(this.mainScene)

    // 全景调整摄像机放球体中心
    this.deps.camera.position.set(-0.1, 0, 0)
    this.addControl()

    // 注册点击事件
    this.deps.eventBus.on('click', (e) => { this.handleClick(e) })

    // 准备精灵贴图
    this.guidepostsMap = this.deps.textureLoader.load('https://isv.alibabausercontent.com/00000000/imgextra/i2/3981030266/O1CN01aXsnkp1Dps2HJfGil_!!3981030266-2-isvtu-00000000.png')
    this.guidepostsMaterial = new THREE.SpriteMaterial({
      map: this.guidepostsMap,
      fog: true
    });

    // 加载texture
    await this.loadTexture()

    // 进入场景
    this.changePanoramas(0, 'first')
    // setTimeout(() => {
    //   this.changePanoramas(1, 'test')
    // }, 10000);
  }

  loadTexture() {
    return new Promise((resolve) => {
      const length = this.panoramas.length
      const textureLoader = this.deps.textureLoader;
      this.panoramasTexture = this.panoramas.map(src => {
        const texture = textureLoader.load(src, () => {
          this.panoramasCount++
          console.log('load ', this.panoramasCount)
          this.deps.eventBus.emit('loadImg', this.panoramasCount)
          if (this.panoramasCount === length) {
            resolve(true)
            this.deps.eventBus.emit('loadImged')
          }
        })
        this.transformTexture(texture)
        return texture
      })
    })
  }

  changePanoramas(index, from = 'none') {
    console.log('changePanoramas ', index, from)
    const textureLoader = this.deps.textureLoader;
    this.current = index

    // 释放旧路标
    this.disposeGuidepost()

    this.time++

    // 画球
    if (from === 'first') {
      const texture1 = this.panoramasTexture[index]
      const texture2 = this.panoramasTexture[index]
      const material1 = new THREE.MeshBasicMaterial({ map: texture1, transparent: false, fog: false })
      const material2 = new THREE.MeshBasicMaterial({ map: texture2, transparent: true, opacity: 0, fog: false })
      // 渲染球体的双面
      material1.side = THREE.DoubleSide
      material2.side = THREE.DoubleSide

      // 首次准备球体
      // 两个球过渡用
      const geometry = new THREE.SphereGeometry(50, 256, 256)
      this.mesh1 = new THREE.Mesh(geometry, material1)
      this.mesh2 = new THREE.Mesh(geometry, material2)

      this.mainScene.add(this.mesh1)
      this.mainScene.add(this.mesh2)

      // 画地标
      this.guidepostsOption[index] && this.guidepostsOption[index].forEach(({ x, y }) => {
        this.addGuidepost(y, x, 50)
      })
    } else {
      this.mesh1.material.map = this.panoramasTexture[index]
      this.mesh1.material.map.needsUpdate = true;
      let time = 0
      const change = () => {
        time++
        if (time <= 60) {
          if (time % 3 === 0) {
            this.mesh1.material.setValues({ opacity: time / 60, transparent: true })
            this.mesh2.material.setValues({ opacity: 1 - time / 60, transparent: true })

            if (time === 60) {
              this.mesh2.material.map = this.panoramasTexture[index]
              this.mesh1.material.setValues({ transparent: false, opacity: 1 })
              this.mesh2.material.setValues({ transparent: true, opacity: 0 })

              // 画地标
              this.guidepostsOption[index] && this.guidepostsOption[index].forEach(({ x, y }) => {
                this.addGuidepost(y, x, 50)
              })
            }
            this.mesh1.material.needsUpdate = true;
            this.mesh2.material.needsUpdate = true;
          }

          requestAnimationFrame(change)
        }
      }
      change()
    }
  }

  handleClick = utils.debounce(
    (() => {
      const mouse = new THREE.Vector2()
      const raycaster = new THREE.Raycaster()
      // const spherical = new THREE.Spherical()

      return function (e) {
        if (!this.canClick) { return }
        if (!this.guideposts.length) { return }
        const { canvas, camera, dpr } = this.deps
        this.canClick = false

        const innerWidth = canvas.width
        const innerHeight = canvas.height
        const clientX = e.changedTouches[0].x * dpr
        const clientY = e.changedTouches[0].y * dpr

        // 将鼠标点击位置的屏幕坐标转成threejs中的标准坐标
        mouse.x = (clientX / innerWidth) * 2 - 1
        mouse.y = -(clientY / innerHeight) * 2 + 1

        //更新鼠标和射线位置
        raycaster.setFromCamera(mouse, camera)

        const intersects = raycaster.intersectObjects(this.guideposts)
        if (intersects.length > 0) {
          // 求射中了哪个路标
          const { object: { uuid } } = intersects[0]
          let index = 0
          for (const i in this.guideposts) {
            if (this.guideposts[i].uuid === uuid) {
              index = Number(i)
              break
            }
          }
          this.changePanoramas(this.guidepostsOption[this.current][index].next, 'click')

          // 射线和球体求交，选中一系列直线
          // const intersects = raycaster.intersectObjects([mesh])
          // if (intersects.length > 0) {
          //   //取点击到的最近的那个物体的交点
          //   const pointClicked = intersects[0].point
          //   console.log(pointClicked)
          //   spherical.setFromVector3(pointClicked)

          //   // 尝试贴精灵
          //   // 球面坐标转化成空间坐标
          //   // const pointCl = new THREE.Vector3().setFromSphericalCoords(spherical.radius, spherical.phi, spherical.theta)
          //   // console.log(pointCl)
          //   // const { x, y, z } = pointCl
          //   // const material = this.guidepostsMaterial.clone();
          //   // const sprite = new THREE.Sprite(material);
          //   // sprite.position.set(x, y, z);
          //   // sprite.position.normalize();
          //   // sprite.position.multiplyScalar(3);
          //   // this.mainScene.add(sprite)
          // }
        }
        this.canClick = true
      }
    })()
    , 500
  )

  transformTexture(texture) {
    // 内纹理是镜像 需要再镜像还原
    texture.center = new THREE.Vector2(0.5, 0.5);
    texture.rotation = Math.PI;
    texture.flipY = false;
    texture.minFilter = THREE.LinearFilter
  }

  percentTosSpherical(top, left, radius) {
    if (left > 50) {
      left -= 50
    } else {
      left += 50
    }
    const phi = top / 100 * Math.PI
    const theta = Math.PI / 2 - (left / 50 * Math.PI)
    return new THREE.Vector3().setFromSphericalCoords(radius, phi, theta)
  }

  addGuidepost(top, left, radius) {
    const { x, y, z } = this.percentTosSpherical(top, left, radius)
    const material = this.guidepostsMaterial.clone();
    const sprite = new THREE.Sprite(material);
    sprite.position.set(x, y, z);
    sprite.position.normalize();
    sprite.position.multiplyScalar(5);
    this.guideposts.push(sprite)
    this.mainScene.add(sprite)
  }

  update(): void {
    this.orbitControl?.update();
  }

  disposeGuidepost() {
    this.guideposts.forEach(item => {
      this.mainScene.remove(item)
    })
    this.guideposts = []
  }

  dispose(): void {
    this.reset();
  }
}

export default PanoramaLoader
