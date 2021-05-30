# three-platformize 淘宝小程序 DEMO

<https://github.com/deepkolos/three-platformize-demo-taobao>
[three-platformize](https://github.com/deepkolos/three-platformize)

<div>
  <img src="https://raw.githubusercontent.com/deepkolos/three-platformize-demo-taobao/master/demo.gif" width="250" alt="" style="display:inline-block;"/>
</div>

# 运行

阿里小程序开发工具打开即可运行

## 使用

如果不使用 rollup 做额外打包，新版本小程序开发工具需要在`mini.project.json`增加一下配置

```json
{
  "enableNodeModuleBabelTransform": true,
  "node_modules_es6_whitelist": ["three-platformize"]
}
```

## 模拟器预览

需要把 `canvas` `type` 设置为 `2d`，模拟器才能获取节点

## 模型存储

由于淘宝小程序有十分严格 URL 管控，且难申请域名白名单，推荐使用云存储存放模型，
DEMO 里只有 GLTFLoader 是使用淘宝的域名，所以其他 Loader 的 Demo 真机无法预览

```js
try {
  const [{ url }] = await cloud.file.getTempFileURL({
    fileId: ['cloud://C0893B9B822D3F4671F69A3EE9D519BF//RobotExpressive.glb'],
  });
  console.log(url);
  // my.showToast({ content: 'got gltf url:' + url });
  const gltf = await gltfLoader.loadAsync(url);
  gltf.scene.position.y = 0.5;
  gltf.scene.scale.set(0.1, 0.1, 0.1);
  scene.add(gltf.scene);
  my.alert({ content: 'got gltf ' + Object.keys(gltf).join('-') });
} catch (error) {
  my.alert({ content: 'error:' + error });
}
```

# BUG

~~目前加载 GLB 有问题~~, ~~已适配实现加载 GLB, 还是新版本 IDE 和淘宝有问题~~
