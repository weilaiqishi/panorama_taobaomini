import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as THREE from 'three'
function createRendererRender ({ renderer, scene, camera }) {
    return () => {
        renderer.render(scene, camera)
    }
}
function r ({ rendererRender }) {
    rendererRender()
    requestAnimationFrame(r.bind(null, { rendererRender }))
}
// 坐标轴辅助线
function addAxisHelper ({ scene }) {
    scene.add(new THREE.AxisHelper(1000))
}
// 轨道控制器
function addOrbitControls ({ camera, renderer, rendererRender, mesh }) {
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.addEventListener("change", rendererRender)
    controls.minDistance = 1
    controls.maxDistance = 200

    // // 全景调整max
    // controls.minDistance = 1
    // controls.maxDistance = 2

    controls.enablePan = false
    controls.update()
    controls.target.copy(mesh.position)
}
function init () {
    const renderer = new THREE.WebGLRenderer()
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)
    // 场景
    const scene = new THREE.Scene()
    // 相机
    const camera = new THREE.PerspectiveCamera(
        90,
        window.innerWidth / window.innerHeight,
        0.1,
        100
    )
    // camera.position.set(10, 0, 0)
    // 全景调整摄像机放球体中心
    camera.position.set(-0.3, 0, 0)

    // // 新增一个红色球
    // const geometry = new THREE.SphereGeometry(1, 10, 10)
    // const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
    // const mesh = new THREE.Mesh(geometry, material)

    // 把球换成原点显示一个图作为纹理的球
    function addImg (url, scene, n = 1) {
        const texture = new THREE.TextureLoader().load(url, () => {
            console.log('onload')
        })
        const material = new THREE.MeshBasicMaterial({ map: texture })
        // const geometry = new THREE.SphereGeometry(1, 10, 10)


        // 全景调整
        // 调整球大小
        const geometry = new THREE.SphereGeometry(50, 256, 256)
        // 渲染球体的双面
        material.side = THREE.DoubleSide


        const mesh = new THREE.Mesh(geometry, material)
        scene.add(mesh)
        return mesh
    }
    // 去酷家乐找了一个图
    const mesh = addImg("https://qhyxpicoss.kujiale.com/r/2019/07/01/L3D137S8ENDIADDWAYUI5L7GLUF3P3WS888_3000x4000.jpg?x-oss-process=image/resize,m_fill,w_1600,h_920/format,webp", scene, 1)
    scene.add(mesh)

    addAxisHelper({ scene })
    const rendererRender = createRendererRender({ renderer, scene, camera })
    addOrbitControls({ camera, renderer, rendererRender, mesh })
    r({ rendererRender })
}
init()