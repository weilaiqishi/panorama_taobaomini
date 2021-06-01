// 我们以ES6类的形式写出来
class EventEmitter {
    constructor () {
        // 事件对象，存储订阅的type类型
        this._events = Object.create(null)
    }

    on (type, listener, flag) {
        // 确保存储器存在
        if (!this._events) { this._events = Object.create(null) }

        if (this._events[type]) {
            if (flag) {
                this._events[type].unshift(listener)
            } else {
                this._events[type].push(listener)
            }
        } else {
            this._events[type] = [listener]
        }
    }

    emit (type, ...args) {
        if (this._events[type]) {
            this._events[type].forEach((fn) => fn.apply(this, args))
        }
    }

    once (type, listener) {
        const fn = (...args) => {
            listener(...args)
            this.off(type, fn)
        }
        fn.listener = listener
        this.on(type, fn)
    }

    off (type, listener) {
        if (this._events[type]) {
            // 过滤掉退订的方法，从数组中移除
            this._events[type] = this._events[type].filter((fn) => fn !== listener && fn.origin !== listener)
        }
    }
}

export default EventEmitter

export const eventBus = new EventEmitter()
