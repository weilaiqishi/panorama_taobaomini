import { Demo } from 'three-platformize-demo/src/index'
import * as THREE from 'three-platformize';

export class PanoramaLoader extends Demo {
  mixer: THREE.AnimationMixer;

  async init(): Promise<void> {
    // 场景
    const scene = new THREE.Scene()
    this.mixer = new THREE.AnimationMixer(scene);

    // 把球换成原点显示一个图作为纹理的球
    function addImg(url, scene) {
      const texture = new THREE.TextureLoader().load(url)
      const material = new THREE.MeshBasicMaterial({ map: texture })
      const geometry = new THREE.SphereGeometry(50, 256, 256)
      // 渲染球体的双面
      material.side = THREE.DoubleSide
      const mesh = new THREE.Mesh(geometry, material)
      scene.add(mesh)
      return mesh
    }
    const mesh = addImg('https://topfullstackkimeng.oss-cn-hangzhou.aliyuncs.com/%E7%82%B97.jpg', scene)

    scene.add(mesh)
    this.add(scene)
    // 全景调整摄像机放球体中心
    this.deps.camera.position.set(-0.3, 0, 0)
    this.addControl()
  }

  update(): void {
    this.mixer?.update(this.deps.clock.getDelta());
    this.orbitControl?.update();
  }

  dispose(): void {
    this.mixer.stopAllAction();
    this.mixer = null;
    this.reset();
  }
}

export default PanoramaLoader
