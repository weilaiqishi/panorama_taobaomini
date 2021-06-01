import { Demo } from 'three-platformize-demo/src/index'
import * as THREE from 'three-platformize';

const utils = require('../../utils/utils')

export class PanoramaLoader extends Demo {
  mesh;
  scene;
  material;
  geometry;
  mapA;
  materialA;
  guideposts: any[] = [];

  panoramas = ['https://topfullstackkimeng.oss-cn-hangzhou.aliyuncs.com/night1.jpg', 'https://topfullstackkimeng.oss-cn-hangzhou.aliyuncs.com/night2.jpg'];
  markers = [
    [
      {
        x: 50,
        y: 50
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
    this.mapA = this.deps.textureLoader.load('https://isv.alibabausercontent.com/00000000/imgextra/i4/3981030266/O1CN0116CUdP1Dps2GtQXK8_!!3981030266-2-isvtu-00000000.png')
    this.materialA = new THREE.SpriteMaterial({
      map: this.mapA,
      color: 0xffffff,
      fog: true,
    });

    // 进入场景
    this.changePanoramas(0)
  }

  changePanoramas(index) {
    const textureLoader = this.deps.textureLoader;

    // 画球
    this.disposeMesh()
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
    this.disposeGuidepost()
    this.markers[0].forEach(({ x, y }) => {
      this.addGuidepost(y, x, 50)
    })
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
          const { object } = intersects[0]
          console.log(object)
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
        //   // const material = this.materialA.clone();
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
    const material = this.materialA.clone();
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
      this.mesh.dispose()
    }
  }

  disposeGuidepost() {
    this.guideposts.forEach(item => {
      this.scene.remove(item)
      item.dispose()
    })
    this.guideposts = []
  }

  dispose(): void {
    this.reset();
  }
}

export default PanoramaLoader
