import * as utils from '/utils/utils'

// 淘宝canvas文档地址
// https://miniapp.open.taobao.com/docV3.htm?docId=1455&docType=20&source=search

// 初始化两倍清晰度canvas
/*
  // axml里需要放canvas标签
  // canvas标签需要一个id，并且设置宽高，宽高为750设计稿中的两倍
    <canvas
      width="{{1500}}"
      height="{{1000}}"
      id='canvasId1'
>*/
// https://miniapp.open.taobao.com/docV3.htm?docId=1006&docType=20&source=search
export function canvasInit({ canvasId, dataName, page }) {
  // 缩放
  const ctx = my.createCanvasContext(canvasId);
  ctx.scale(2, 2)
  page.setData({
    [dataName]: ctx
  })
  return ctx
}



// --- start 图片相关

// CanvasContext.drawImage
// ctx.drawImage(envelope, 25, 160, 690, 661)
// 绘制图像，图像保持原始尺寸
// https://miniapp.open.taobao.com/docV3.htm?spm=a219a.7386797.0.0.19ab669aHvfEnY&source=search&docId=1605&docType=20

// canvas转图片
// https://miniapp.open.taobao.com/docV3.htm?spm=a219a.7386797.0.0.4bb0669ap0JHg6&source=search&docId=1597&docType=20
// x,y是左上角的位置
// width, height是2倍canvas的宽高
// destWidth, destHeight是目标图片的大小（通常为1倍，否则图片太大上传慢）
export function toTempFilePath({ ctx, x = 0, y = 0, width, height, destWidth, destHeight, fileType = 'png', quality = '0.9' }) {
  return new Promise((resolve, reject) => {
    ctx.toTempFilePath({
      x,
      y,
      width,
      height,
      destWidth,
      destHeight,
      fileType,
      quality,
      success: res => resolve(res.filePath),
      fail: e => reject(e)
    })
  })
}

// 保存图片到云数据库
// https://miniapp.open.taobao.com/docV3.htm?docId=118520&docType=1&source=search
export function uploadCanvasImage({ app, filePath, folderName = 'canvasImage', pictureName = '' }) {
  return app.cloud.file.uploadFile({
    filePath,
    fileType: 'image',
    fileName: `/${folderName}/${utils.dateFormat('yyyyMMddhhmmss', new Date())}${pictureName}`
  })
  // await后返回一个对象 对象里有url { url }
}

// --- end 图片相关



// --- start 文本相关

// 设置字体
export function setFont({ ctx, fontWeight = 500, fontSize = 24, fontFamily = 'Arial' }) {
  const info = `normal ${fontWeight} ${fontSize}px ${fontFamily}`
  ctx.setFont(info)
  ctx.font = info
}

// 居中绘制字体
export function fillTextCenter({ ctx, text, boxLeft = 0, boxTop = 0, boxWidth, boxHeight, baseline = 'middle' }) {
  ctx.setTextAlign('center')
  // baseline https://developers.weixin.qq.com/miniprogram/dev/api/canvas/CanvasContext.setTextBaseline.html
  ctx.setTextBaseline(baseline)
  ctx.fillText(text, boxWidth / 2 + boxLeft, boxHeight / 2 + boxTop);
}

// 文本转段落
export function countParagraph({ context, text, width, addSpace, fillStyle = 'black', fontSize = 20, font = 'normal 300 20px SourceHanSerifCN', isIOS = false, iosLineNum = 25 }) {
  // 自动换行
  // context.textBaseline = 'middle'
  context.setFillStyle(fillStyle)
  context.setFontSize(fontSize)
  context.setFont(font)
  const row = []
  if (isIOS) {
    return chunk(text.split(''), iosLineNum).map(arr => arr.join(''))
  }
  text.split('\n').forEach(text => {
    const chr = addSpace
      ? text
        .split('')
        .join(' ')
        .split('')
      : text.split('')
    let temp = ''
    for (const a in chr) {
      if (context.measureText(temp).width < width) {
      } else {
        row.push(temp)
        temp = ''
      }
      temp += chr[a]
    }
    row.push(temp)
  })
  return row
}

// 段落绘制
export function drawParagraph({ context, x, y, lineHeight, countOptions }) {
  const row = countParagraph(countOptions)
  for (const b in row) {
    context.fillText(row[b], x, y + Number(b) * lineHeight)
  }
}

// --- end 文本相关