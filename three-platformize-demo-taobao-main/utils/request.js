import cloud from '@tbmp/mp-cloud-sdk';
import * as tbFont from '/utils/tbFont'
export async function request(data) {
  const { className, functionName, options = {}, config = {} } = data
  const time = await tbFont.getTime()
  options.time = time
  options.shop = getApp().globalData.shop
  return new Promise((resolve, reject) => {
    cloud.function.invoke(className, options, functionName).then(res => {
      if (res.success) {
        resolve(res.result)
      } else {
        reject(res)
        console.log('api error -> ', res)
        const failMessage = typeof res.message === 'object' ? ('' + JSON.stringify(res.message)) : res.message
        if(res.message !== null) { tbFont.toastFail(failMessage) }
      }
    }).catch((err) => {
      reject(err)
      my.showToast({
        type: 'fail',
        content: JSON.stringify(err),
        duration: 1500
      })
    })
  })
}