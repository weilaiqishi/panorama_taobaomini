import Validator from 'async-validator'

// --- start 字符串方法

// 文本长度，非ASCII长度为2
export function mylength(str) {
  let realLength = 0;
  const len = str.length;
  for (let i = 0; i < len; i++) {
    const charCode = str.charCodeAt(i);
    if (charCode >= 0 && charCode <= 128) {
      realLength += 1;
    } else {
      realLength += 2;
    }
  }
  return realLength;
}

// 按文本长度截取字符
export function mySubstr(str, len) {
  if (length(str) === len) { return str }
  for (let i = 1; i < str.length; i++) {
    if (length(str.substring(0, i)) > len) {
      return str.substring(0, i - 1);
    }
  }
}

// 去除前后空格
export function trim(str) {
  return str.replace(/(^\s*)|(\s*$)/g, "");
}

// 获取文件类型
export function getFileType(filename) {
  const reg = /\.[^\.]+$/;
  const matches = reg.exec(filename);
  if (matches) {
    return matches[0];
  }
  return '';
}

// 是否是手机号
export function isPhone(str) {
  return /^1[0-9]{10}$/.test(str)
}

// 是否是数字
export function isNumber(str) {
  return /^[0-9]+$/.test(str)
}

// 是否是英文字母
export const isAlpha = (str) => {
  return /^[A-Za-z]+$/.test(str)
}

// 去除emoji
export function removeEmojis(string) {
  const regex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;
  return string.replace(regex, '');
}

// 去除非法字符
// strip off illegal characters
export function removeIllegal(str) {
  return str.replace(/[`~!@#$%^&*()_+<>?:"{},.\/;'[\]]/g, "");
}

// 数据转钱的格式
export function toThousands(num) {
  return (num || 0).toString().replace(/(\d)(?=(?:\d{3})+$)/g, '$1,');
}
// --- end 字符串方法



// --- start 对象方法
// 深拷贝对象(普通版)
export function deepCopy(obj) {
  const cloneObj = Array.isArray(obj) ? [] : {}
  for (const key in obj) {
    if (typeof obj[key] == 'object') {
      cloneObj[key] = deepCopy(obj[key])
    } else {
      cloneObj[key] = obj[key]
    }
  }
  return cloneObj
}

// 过滤对象空字段
export function delObjEmptyKey(obj) {
  for (var i in obj) {
    if (obj[i] === null || obj[i] === undefined || obj[i] === '' || JSON.stringify(obj[i]) == "{}") {
      delete obj[i]
    }
  }
  return obj
}

// 按目标对象上有的字段来浅拷贝对象
export function copyBy(source, target) {
  return Object.keys(target).reduce((obj, key) => {
    source.hasOwnProperty(key) && (obj[key] = source[key])
    return obj
  }, {})
}

// 按字段数组来浅拷贝对象
export function copyWith(source, arr) {
  return arr.reduce((obj, key) => {
    source.hasOwnProperty(key) && (obj[key] = source[key])
    return obj
  }, {})
}

export function trimAndRemoveIllegalObj(formData, noRemoveIllegalFields = []) {
  // 将对象中类型为string的属性去掉前后空格
  Object.keys(formData).forEach(key => {
    if (typeof formData[key] === 'string' && !noRemoveIllegalFields.includes(key)) {
      formData[key] = removeIllegal(trim(formData[key]))
      // 千牛不兼容trimStart trimEnd
      // formData[key] = formData[key].trimStart()
      // formData[key] = formData[key].trimEnd()
    }
  })
}
// --- end 对象方法



// --- start 数据校验

// 表单校验
// https://github.com/yiminghe/async-validator
// formRules例子
// formRules: {
//   phone: [
//     { validator: checkPhone },
//   ],
//   isWhite: [
//     { required: true, message: '请选择是否白名单' },
//   ],
// }
// value是表单数据对象
export function validate(formRules, value) {
  const errorMessage = {}
  Object.keys(formRules).forEach(key => {
    const validator = new Validator({ key: formRules[key] })
    validator.validate({ key: value[key] }, errors => {
      if (errors) {
        errorMessage[key] = errors.map(item => item.message).join(';')
      }
    })
  })
  return {
    errorMessage,
    validated: !Object.keys(errorMessage).length
  }
}

// --- end 数据校验



// --- start async-validator validator
export const checkDigitAndAlpha = (rule, value, callback) => {
  const reg = /^[0-9A-Za-z]+$/
  if (!reg.test(value)) {
    callback(new Error('只能输入数字和英文字母'))
  } else {
    callback()
  }
}
export const checkPhone = (rule, value, callback) => {
  const reg = /^1[0-9]{10}$/
  if (!reg.test(value)) {
    callback(new Error('请填写11位数字手机号'))
  } else {
    callback()
  }
}
// --- end async-validator validator



// 节流 防抖
export function throttle(callback, wait = 1500) {
  let start = 0
  return function (...args) {
    const now = new Date().getTime()
    if (now - start >= wait) {
      callback.call(this, ...args)
      start = now
    }
  }
}

export function debounce(callback, time = 1500) {
  let timeout = null
  return function (...args) {
    if (timeout !== null) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => {
      callback.call(this, ...args)
      timeout = null
    }, time)
  }
}

// 睡眠
export function sleep(time = 1000) {
  return new Promise((resolve) => setTimeout(resolve, time))
}

// 时间格式化
export function dateFormat(format, date = new Date()) {
  // yyyy-MM-dd hh:mm:ss
  if (!(date instanceof Date)) throw new TypeError('date must be a Date')
  const timeObj = {
    yyyy: date.getFullYear(),
    MM: date.getMonth() + 1,
    dd: date.getDate(),
    hh: date.getHours(),
    mm: date.getMinutes(),
    ss: date.getSeconds(),
    SSS: date.getMilliseconds()
  }
  const padOptions = {
    MM: 2,
    dd: 2,
    hh: 2,
    mm: 2,
    ss: 2,
    SSS: 3
  }
  Object.keys(timeObj).forEach(key => {
    const option = padOptions[key]
    if (option) {
      timeObj[key] = String(timeObj[key]).padStart(option, '0')
    }
    format = format.replace(key, timeObj[key])
  })
  return format
}

// 模拟requestAnimationFrame
export function makeAnimationFrame() {
  // 淘宝有my.requestAnimationFrame
  let lastFrameTime = 0;
  const requestAnimationFrame = function (callback) {
    const currTime = new Date().getTime();
    const timeToCall = Math.max(0, 16 - (currTime - lastFrameTime));
    let id = setTimeout(function () { callback(currTime + timeToCall); }, timeToCall);
    lastFrameTime = currTime + timeToCall;
    return id;
  };
  const cancelAnimationFrame = function (id) {
    clearTimeout(id)
  }
  return [requestAnimationFrame, cancelAnimationFrame]
}

// 随机数组项
export function randomArrayItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

// 从事件中获取值
export function eventValue(e) {
  return e.detail.value
}

// 从事件中获取自定义值
export function dataset(e) {
  return e.target.dataset
}

// 数组分割
// https://www.lodashjs.com/docs/lodash.chunk/
// https://blog.csdn.net/gaochengyidlmu/article/details/55805563
export function chunk(array,size) {
  const length = array == null ? 0 : array.length;
  if (!length || size < 1){
    return []
  }
  let index = 0,
    resIndex = 0,
    result = Array(Math.ceil(length / size));
  while(index < length){
    result[resIndex++] = array.slice(index, (index += size));
  }
  return result
}