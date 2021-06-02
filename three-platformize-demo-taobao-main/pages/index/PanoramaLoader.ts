import { Demo } from 'three-platformize-demo/src/index'
import * as THREE from 'three-platformize';

const utils = require('../../utils/utils')

export class PanoramaLoader extends Demo {
  mesh;
  scene;
  material;
  geometry;

  guidepostsMap;
  guidepostsMaterial;
  guideposts: any[] = [];
  time = 0

  panoramas = ['https://topfullstackkimeng.oss-cn-hangzhou.aliyuncs.com/night1.jpg', 'https://isv.alibabausercontent.com/00000000/imgextra/i3/3981030266/O1CN0154rnpS1Dps2LsPLyM_!!3981030266-0-isvtu-00000000.jpg'];
  guidepostsOption = [
    [
      {
        x: 4340 / 7680 * 100,
        y: 2170 / 3840 * 100,
        next: 1
      },
    ]
  ];
  async init(): Promise<void> {
    // 场景
    this.scene = new THREE.Scene()
    this.add(this.scene)

    this.geometry = new THREE.SphereGeometry(50, 256, 256)

    // 全景调整摄像机放球体中心
    this.deps.camera.position.set(-0.1, 0, 0)
    this.addControl()

    // 注册点击事件
    this.deps.eventBus.on('click', (e) => { this.handleClick(e) })

    // 准备精灵贴图
    this.guidepostsMap = this.deps.textureLoader.load('https://isv.alibabausercontent.com/00000000/imgextra/i2/3981030266/O1CN01aXsnkp1Dps2HJfGil_!!3981030266-2-isvtu-00000000.png')
    this.guidepostsMaterial = new THREE.SpriteMaterial({
      map: this.guidepostsMap,
      color: 0xffffff,
      fog: true,
    });

    // 进入场景
    this.changePanoramas(0)
    setTimeout(() => {
      this.changePanoramas(1)
    }, 5000)
  }

  changePanoramas(index) {
    const textureLoader = this.deps.textureLoader;
    // 释放旧全景
    this.disposeMesh()
    this.disposeGuidepost()

    // 画球
    this.time++
    const texture = textureLoader.load(this.panoramas[index])
    // 内纹理是镜像 需要再镜像还原
    texture.center = new THREE.Vector2(0.5, 0.5);
    texture.rotation = Math.PI;
    texture.flipY = false;
    this.material = new THREE.MeshBasicMaterial({ map: texture })
    // 渲染球体的双面
    this.material.side = THREE.DoubleSide
    this.mesh = new THREE.Mesh(this.geometry, this.material)
    this.scene.add(this.mesh)

    // 画地标
    this.guidepostsOption[index] && this.guidepostsOption[index].forEach(({ x, y }) => {
      this.addGuidepost(y, x, 50)
    })
    
    this.update()
  }

  handleClick = utils.debounce(
    (() => {
      const mouse = new THREE.Vector2()
      const raycaster = new THREE.Raycaster()
      const spherical = new THREE.Spherical()

      return function (e) {
        const { canvas, camera, dpr } = this.deps
        const { mesh } = this
        if (!mesh) { return }
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
          this.changePanoramas(this.guideposts[index].next)
        }

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
        //   // this.scene.add(sprite)
        // }
      }
    })()
    , 500
  )

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
    this.scene.add(sprite)
  }

  update(): void {
    this.orbitControl?.update();
  }

  disposeMesh() {
    if (this.mesh) {
      this.scene.remove(this.mesh)
      this.material.dispose()
    }
  }

  disposeGuidepost() {
    this.guideposts.forEach(item => {
      this.scene.remove(item)
    })
    this.guideposts = []
  }

  dispose(): void {
    this.reset();
  }
}

export default PanoramaLoader
