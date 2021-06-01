import cloud from '@tbmp/mp-cloud-sdk';

// --- start app.js初始化
// 初始化云函数
export function initCloud({ isTest = true, app }) {
  cloud.init({ env: isTest ? 'test' : 'online' })
  app.cloud = cloud
}


// 初始化高级定制
export function initCustom({ options, app, itemId, skuId }) {
  const { query = {} } = options;
  const { params = '{}' } = query;
  const paramJson = JSON.parse(params);
  app.globalData.tradeToken = paramJson.tradeToken;
  app.globalData.itemId = paramJson.itemId || itemId
  app.globalData.skuId = paramJson.skuId || skuId
  //从下单按钮跳转，这里是'true'
  //从加购按钮跳转，这里是'false'
  app.globalData.buyNow = paramJson.buyNow;
}

// 初始化样式适配和系统信息
export function initStyleAdapt(app) {
  // 获取设备信息
  // https://miniapp.open.taobao.com/docV3.htm?spm=a219a.7386797.0.0.27ac669aGx7xZ7&source=search&docId=894&docType=20
  // model	手机型号 pixelRatio	设备像素比 windowWidth	Number	窗口宽度
  // windowHeight	窗口高度 language	APP设置的语言 version APP版本号 storage 设备磁盘容量 currentBattery	当前电量百分比 system	系统版本 platform	String	
  // 系统名：Android，iOS。 screenWidth 屏幕宽度 screenHeight	屏幕高度 brand	手机品牌 fontSizeSetting 用户设置字体大小
  // app 当前运行的客户端 titleBarHeight	标题栏高度 statusBarHeight	状态栏高度 screenReaderEnabled 设备是否开启无障碍
  app.globalData.systemInfo = my.getSystemInfoSync();
  const { statusBarHeight, platform, windowHeight, windowWidth } = app.globalData.systemInfo;
  app.isIOS = platform === 'iOS' // ide中ios机型为 'ios'
  app.scale = windowHeight / windowWidth
  app.scale1 = this.scale < 1.8 // 短手机
  app.scale2 = (windowHeight > 860 && windowWidth < 430) || (windowHeight > 715 && windowWidth < 370) // 大手机
  // 适配iphone
  if (statusBarHeight > 20 && platform == 'iOS') {
    app.globalData.hasActionBar = true
  }
}

export function isDev() {
  return my.getSystemInfoSync().app === 'taobao'
}
// --- end app.js初始化



// --- start 云相关
// 根据id获取链接
export function getTempFileURL({ cloud, fileId }) {
  return cloud.file.getTempFileURL({
    fileId
  })
}
// --- end 云相关



// --- start 授权
// https://miniapp.open.taobao.com/docV3.htm?docId=988&docType=20&source=search

// 用户信息
// https://miniapp.open.taobao.com/docV3.htm?docId=989&docType=20&source=search
export function authorizeUserInfo() {
  return new Promise((resolve, reject) => {
    // 用户授权
    my.authorize({
      scopes: 'scope.userInfo',
      success: (res) => {
        my.getAuthUserInfo({
          success: (userInfo) => {
            resolve(userInfo);
          }
        });
      },
      fail: (err) => {
        resolve(null)
      }
    });
  })
}

// 手机号
// taobao.miniapp.user.phone.get( 获取当前授权用户手机号码 )
// https://open.taobao.com/api.htm?spm=a219a.7386797.0.0.7b31669agrfpAs&source=search&docId=46425&docType=2
export function authorizeGetPhoneNumber(cloud) {
  return new Promise((resolve, reject) => {
    // 获取用户手机号码授权API
    my.authorize({
      scopes: 'scope.getPhoneNumber',
      success: () => {
        cloud.topApi.invoke({
          api: 'taobao.miniapp.user.phone.get',
          authScope: 'scope.getPhoneNumber'
        }).then((result) => {
          resolve(result.phone)
        }, (err) => {
          my.showToast({
            type: 'fail',
            content: JSON.stringify(err),
            duration: 3000
          });
        })
      },
      fail: (err) => {
        // 用户取消授权时，不提示错误信息
        if (err.error == 11) {
          return
        } else {
          my.showToast({
            type: 'fail',
            content: JSON.stringify(err),
            duration: 3000
          });
        }
      }
    })
  })
}


// --- end 授权



// --- start 插件

// 入会
// https://miniapp.open.taobao.com/docV3.htm?spm=a219a.7386797.0.0.69b2669aZiV0Ck&source=search&docId=119260&docType=1
// 入会操作要使用axml，配置app.json和页面json
// <!-- sellerId不允许动态写入 -->
// <member-shop-center
//   expend="{{expend}}" // 是否打开入会插件
//   sellerId="2208190960913"
//   onClose="onMemberClose"
//   onAuthFail="onMemberAuthFail"
//   onAuthSuccess="onMemberAuthSuccess"
// />
// app.json中声明使用的插件
// {
//   "pages": [  "pages/index/index",  ],
//   "plugins": {
//      "cemMember": {
//         "version":"*",
//         "provider":"3000000026642582"  
//       },  
//    },
//   "window": {
//      "defaultTitle": "My App"  
//    } 
// }
// 页面json文件中声明引用的组件
// {
//   "usingComponents": {
//      "member-shop-center": "plugin://cemMember/member-shop-center"  
//    } 
// }
// sellerId用浏览器访问天猫淘宝官方店按f12找

// 检查是否已经是会员
export function checkMember({ memberPlugin, sellerId }) {
  return new Promise((resolve) => {
    try {
      memberPlugin = memberPlugin || requirePlugin("cemMember")
      memberPlugin.checkMember({
        //sellerId为可选参数，不填则为当前小程序Owner用户ID
        sellerId,
        success(v) {
          const isMember = v.data.isMember === 'true'
          resolve([null, isMember])
        },
        fail(v) {
          resolve([true, null])
        }
      })
    } catch (e) {
      // 报 no match错误时是app.json里面没放插件信息
      resolve([e, null])
    }
  })
}


// 高级定制下单
export function customOrder({ requirePlugin, app, pic, text, omsData = {} }) {
  const plugin = requirePlugin('openTrade')
  plugin.saveAdvancedServiceOrder({
    itemId: app.globalData.itemId,
    skuId: app.globalData.skuId,
    price: 0,
    extProperty: {
      //  pic:[ // 图片相关的定制信息
      //   {id:1,url:'https://gw.alicdn.com/tfs/TB1T6PfBFzqK1RjSZSgXXcpAVXa-96-96.jpg'}
      // ],
      // text:[ // 文本相关的定制信息
      //   {id:1,key:'手镯颜色',content:'黑色纯银开口手镯'},
      //   {id:2,key:'图案颜色',content:'测试'}
      // ]
      // 图片相关定制消息
      pic: pic || [],
      // 文本相关的定制信息
      text: text || [],
      oms: JSON.stringify(omsData)
    },
    success(v) {
      console.log('suc', v)
    },
    fail(v) {
      console.log('fail', v)
    }
  })
}

// 高级定制购物车
export function customCart({ requirePlugin, app, pic, text, omsData = {} }) {
  const plugin = requirePlugin('openTrade')
  plugin.saveAdvancedServiceCart({
    itemId: app.globalData.itemId,
    skuId: app.globalData.skuId,
    price: 0,
    quantity: 1,
    extProperty: {
      'pic': pic || [],
      'text': text || [],
      'oms': JSON.stringify(omsData)
    },
    success(v) {
      my.tb.openCart()
    },
    fail(v) {
      my.alert({
        title: '加购失败',
        content: JSON.stringify(v),
      })
    }
  })
}

// 高级定制购买
export function customBuy({ requirePlugin, app, pic, text, omsData = {} }) {
  if (app.globalData.buyNow === 'true') {
    customOrder({ requirePlugin, app, pic, text, omsData })
  } else {
    customCart({ requirePlugin, app, pic, text, omsData })
  }
}
// --- end 插件



// --- start 商品
// 加购物车
// https://miniapp.open.taobao.com/docV3.htm?docId=1374&docType=20&source=search
export function addToCard({ itemId, skuId, num }) {
  let itemIds = itemId
  skuId && (itemIds += '_' + skuId)
  num && (itemIds += '_' + num) || (itemIds += '_' + 1)
  my.tb.addToCart({
    // itemIds: '574141925233', 不选sku和数量也能加购，需要用户在购物车中选好sku才能下单
    // itemIds: '574141925233_4018047819826_4', // 对应itemId为574141925233 skuId为4018047819826 数量为4
    // exts: 'text:text|123:456',
    itemIds: itemIds,
    success: (res) => {
      setTimeout(function () {
        my.tb.openCart()
      }, 500)

      // my.alert({ content: "success" + JSON.stringify(res) })
    },
    fail: (res) => {
      // my.alert({ content: "fail" + JSON.stringify(res) })
    },
  })
}

// 跳转下单
//C2B交易定制中，当定制完成，调用此API跳转到订单确认页。
export function confirmCustomOrder({ itemId, skuId }) {
  my.tb.confirmCustomOrder({
    data: {
      'itemId': itemId,
      'skuId': skuId,
      'quantity': 1,
      'customization': {
        // "pic": [{ "id": 1, "url": "https://gw.alicdn.com/tfs/TB1T6PfBFzqK1RjSZSgXXcpAVXa-96-96.jpg" }],
        // "text": [{ "id": 1, "content": "" }]
      }
    },
    success: function (e) { },
    fail: function (e) { my.alert({ title: 'fail ', content: JSON.stringify(e) }) }
  });
}

// 打开商品详情页
// https://miniapp.open.taobao.com/docV3.htm?docId=919&docType=20&source=search
// my.tb.openDetail ({
//       itemId: "576308890723",
//       success: (res) => {
//         my.alert({ content: "success" });
//       },
//       fail: (res) => {
//         my.alert({ content: "fail - " + res.error });
//       },
// });
// --- end 商品



// --- start 跳转
// 去淘宝店铺首页
export function goToShop(shopId) {
  my.tb.navigateToTaobaoPage({
    appCode: 'shop',
    appParams: {
      shopId,
      weexShopTab: 'shopindexbar',
      weexShopSubTab: 'shopindex'
    }
  })
}

// 打开客服
export function openMessage(sellerNick) {
  my.tb.openMessage({
    sellerNick,
    success: (res) => {
      console.log(res);
    },
    fail: (res) => {
      console.log(res);
    },
  })
}

// 去webview
export function toWebview({ app, url }) {
  console.log({ url })
  app.webviewUrl = url
  my.navigateTo({
    url: '/pages/webview/webview'
  })
}
// --- end 跳转



// 错误提示
export function toastFail(content, noIcon) {
  my.showToast({
    type: noIcon ? 'none' : 'fail',
    content,
    duration: 3000,
    success: () => { }
  });
}

// alert
export function alert(content) {
  my.alert({ content })
}

// 获取服务器时间
export const getTime = () => {
  return new Promise((resolve, reject) => {
    my.getServerTime({
      success: (res) => {
        resolve(res.time * 1)
      }
    })
  })
}

// 删除确认
export function delConfirm(doDel) {
  my.confirm({
    title: '提示',
    content: '确定要删除吗',
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    success: async (result) => {
      if (!result.confirm) {
        return
      }
      doDel()
    }
  })
}

// 加载字体 字体只能用于调用了加载方法的页面
// https://help.aliyun.com/document_detail/189117.html
export function loadFontFace({ family, url, success = () => { } }) {
  // iOS 仅支持 https 格式文件地址。
  if (!url.includes('https')) { url = url.replace('http', 'https') }
  console.log({ url, family })
  my.loadFontFace({
    family,
    source: `url("${url}")`,
    success,
    fail: (err) => {
      my.alert({
        content: JSON.stringify(err),
      })
    },
  })
}

// 日历提醒
// https://miniapp.open.taobao.com/docV3.htm?docId=1486&docType=20&source=search
// 时间格式 yyyy-MM-dd HH:mm:ss  例2019-12-24 14:00:00
export function addCalendarPlan({ startDate, endDate, description = '测试', title = '日历测试', success = () => { } }) {
  my.tb.checkCalendarPlanIsExist({
    title,
    startDate,
    endDate: endDate || startDate,
    success: (res) => {
      if (res.isExist) {
        typeof success == "function" && success(res)
      } else {
        my.tb.addCalendarPlan({
          title,
          startDate,
          endDate: endDate || startDate,
          description,
          success,
          fail: (res) => {
            // typeof success == "function" && success(res)
          }
        });
      }
    },
    fail: (res) => {
      // typeof success == "function" && success(res)
    }
  })
}

// 页面滑动 页面滚动
// https://miniapp.open.taobao.com/docV3.htm?spm=a219a.7386797.0.0.7778669a3clJCW&source=search&docId=1008&docType=20
// my.pageScrollTo({ scrollTop, duration: 300, selector })

// 向上滑动事件
function countCanvasTouch(callback) {
  let lastPointY = null
  let timeout = null
  let allY = 0
  return function canvasTouch(e) {
    const thisY = e.touches[0].y
    if (lastPointY !== null) {
      allY += lastPointY - thisY
      if ((allY) > 10) {
        callback.call(this)
        clear()
      }
    } else {
      lastPointY = thisY
    }
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      clear()
    }, 1000)
    function clear() {
      lastPointY = null
      allY = 0
    }
  }
}