const utils = {
  filterObjectEmpty(obj) {
    for (var i in obj) {
      if (obj[i] === null || obj[i] === undefined || obj[i] === '' || JSON.stringify(obj[i]) == "{}") {
        delete obj[i]
      }
    }
    return obj
  },
  validate(formRules, value) {
    const Validator = require('async-validator').default
    const errorMessage = {}
    Object.keys(formRules).forEach(key => {
      const validator = new Validator({ key: formRules[key] })
      validator.validate({ key: value[key] }, errors => {
        if (errors) {
          errorMessage[key] = errors.map(item => item.message).join(';')
        }
      })
    })
    console.log(errorMessage, !Object.keys(errorMessage))
    return {
      errorMessage,
      validated: !Object.keys(errorMessage).length
    }
  },
  async hasRecords(cloud, collection, fields, values, isFind) {
    const finalFilter =
      fields.reduce((obj, key) => {
        obj[key] = { '$eq': values[key] || null }
        return obj
      }, {})
    const fn = isFind ? 'find' : 'count'
    return await cloud.db.collection(collection)[fn](finalFilter)
  },
  notNull(value) {
    return !(value === null || value === undefined)
  },
  noMessage(string) {
    return string === 'noMessage' ? '' : string
  }
}

exports.find = async (context) => {
  try {
    const cloud = context.cloud
    const { collection, current, pageSize, search, eq = [], sort, nin = [] } = context.data

    // 设置数据库查询条件
    let finalFilter = {}
    if (search) {
      eq.forEach(eqKey => {
        if (!search[eqKey]) { search[eqKey] = null }
      })
      finalFilter = Object.keys(search).reduce((obj, key) => {
        // 时间选择
        if (key === 'created_at' || key === 'updated_at') {
          obj[key] = { '$gt': search[key][0], '$lt': search[key][1] }
        }
        // 数组选择
        else if (Array.isArray(search[key])) {
          const op = nin.includes(key) ? '$nin' : '$in'
          obj[key] = { [op]: search[key] }
        }
        // 值选择
        else {
          if (eq.includes(key)) {
            obj[key] = { '$eq': search[key] }
          } else {
            search[key] && (obj[key] = { '$regex': search[key] })
          }
        }

        return obj
      }, {})
    }
    let pageOptions = {}
    if (current && pageSize) {
      pageOptions = {
        limit: pageSize,
        skip: (current - 1) * pageSize,
      }
    }
    const total = await cloud.db.collection(collection).count(finalFilter)
    const data = await cloud.db.collection(collection).find(
      finalFilter,
      {
        sort: sort || { created_at: -1 },
        ...pageOptions
      }
    )
    return {
      success: true,
      result: { data, total }
    }
  } catch (e) {
    console.log('fail:', e)
    return {
      success: false,
      result: e.toString()
    }
  }
}

const createOfUpdate = async ({ cloud, collection, fields, form, find, now, updateRecord, asNow = [] }) => {
  const _now = now || new Date().getTime()
  const entity = updateRecord ? {
    _id: updateRecord._id,
    created_at: updateRecord.created_at || _now,
    updated_at: _now
  } : {
      created_at: _now,
      updated_at: _now
    }
  fields.forEach(field => {
    entity[field] = utils.notNull(form[field]) ? form[field] : null
    if (asNow.includes(field)) { entity[field] = _now }
  })

  let _id = null
  if (updateRecord) {
    await cloud.db.collection(collection).updateMany(
      { _id: { $eq: updateRecord._id } },
      { $set: entity }
    )
    _id = updateRecord._id
  } else {
    _id = await cloud.db.collection(collection).insertOne(entity)
  }
  if (find) {
    _id = (await cloud.db.collection(collection).find({
      _id: { '$eq': _id }
    }))[0]
  }
  return _id
}

// collection 表名
// fields 字段数组，根据它来从form取出数据对象
// form 数据
// successMessage 成功信息，有默认值，不想提示请传'noMessage'

// validate 校验配置，const { formRules, validateFields, validateErrorMessage, validateErrorFuntion } = validate
//   formRules             async-validator配置项
//   validateErrorMessage  校验错误提示,不想提示请传'noMessage'，默认是 表单校验失败
//   validateErrorFuntion  优先级更高的重复报错提示，入参errorMessage，return提示信息 new Function

// repect是本表重复检测,const { repectFields, repectErrorMessage, repectErrorFuntion } = repect
//   repectFields          校验字段数组
//   repectErrorMessage    重复报错提示,不想提示请传'noMessage'，默认是 数据重复
//   repectErrorFuntion    优先级更高的重复报错提示，入参原表单数据form，return提示信息 new Function

exports.create = async (context) => {
  try {
    const cloud = context.cloud
    const { collection, fields, form, successMessage = '新增成功', validate, repect, asNow } = context.data
    let _id = null

    if (validate) {
      const { formRules, validateErrorMessage = '表单校验失败', validateErrorFuntion = `return ''` } = validate
      const { errorMessage, validated } = utils.validate(formRules, form)
      if (!validated) {
        throw {
          message: (new Function('errorMessage', validateErrorFuntion))(errorMessage) || utils.noMessage(validateErrorMessage),
          validateFail: {
            errorMessage
          }
        }
      }
    }
    let hasCreated = false
    if (repect) {
      const { repectFields, repectErrorMessage = '数据重复', repectErrorFuntion = `return ''`, cover } = repect
      const [record] = await utils.hasRecords(cloud, collection, repectFields, form, true)
      if (record) {
        if (cover) {
          hasCreated = true
          _id = await createOfUpdate({ cloud, collection, fields, form, updateRecord: record, asNow })
        }
        throw {
          message: (new Function('form', repectErrorFuntion))(form) || utils.noMessage(repectErrorMessage),
          repectFail: {}
        }
      }
    }
    !hasCreated && (_id = await createOfUpdate({ cloud, collection, fields, form, asNow }))

    return {
      success: true,
      message: utils.noMessage(successMessage),
      result: _id
    }
  } catch (e) {
    console.log('fail:', e)
    return {
      success: false,
      message: e.message || e,
      ...e,
    }
  }
}

// foreign是如果外表中有相关数据，则不可编辑或删除本表的这条数据
//   foreignCollection是外表名
//   foreignKey是在外表中关联本表_id的键名
//   foreignErrorMessage不想提示请传'noMessage'，默认是 有关联数据不可操作
//   foreignFields是字段数组，foreignFieldsValues是对象用来找字段的值，精确匹配且是与运算

exports.update = async (context) => {
  try {
    const cloud = context.cloud
    const { collection, fields, form, successMessage = '修改成功', validate, repect, foreign } = context.data
    if (foreign) {
      const { foreignCollection, foreignKey, foreignKeyErrorMessage = '有关联数据不可操作', foreignFields = [], foreignFieldsValues = {} } = foreign
      if (await utils.hasRecords(cloud, foreignCollection, [foreignKey, ...foreignFields], { [foreignKey]: form._id, ...foreignFieldsValues })) {
        throw {
          message: utils.noMessage(foreignKeyErrorMessage),
          foreignFail: {}
        }
      }
    }
    if (validate) {
      const { formRules, validateErrorMessage = '表单校验失败', validateErrorFuntion = `return ''` } = validate
      const { errorMessage, validated } = utils.validate(formRules, form)
      if (!validated) {
        throw {
          message: (new Function('errorMessage', validateErrorFuntion))(errorMessage) || utils.noMessage(validateErrorMessage),
          validateFail: {
            errorMessage
          }
        }
      }
    }
    let hasCreated = false
    if (repect) {
      const { repectFields, repectErrorMessage = '数据重复', repectErrorFuntion = `return ''`, cover } = repect
      const [record] = await utils.hasRecords(cloud, collection, repectFields, form, true)
      if (record && record._id !== form._id) {
        if (cover) {
          hasCreated = true
          await createOfUpdate({ cloud, collection, fields, form, updateRecord: record })
        }
        throw {
          message: (new Function('form', repectErrorFuntion))(form) || utils.noMessage(repectErrorMessage),
          repectFail: {}
        }
      }
    }
    !hasCreated && await createOfUpdate({ cloud, collection, fields, form, updateRecord: form })

    return {
      success: true,
      message: utils.noMessage(successMessage)
    }
  } catch (e) {
    console.log('fail:', e)
    return {
      success: false,
      message: e.message || e,
      ...e,
    }
  }
}

exports.del = async (context) => {
  try {
    const cloud = context.cloud
    const { collection, _ids, successMessage = '删除成功', foreign } = context.data

    if (foreign) {
      const { foreignCollection, foreignKey, foreignKeyErrorMessage = '有关联数据不可操作', foreignFields = [], foreignFieldsValues = {} } = foreign
      for (let _id of _ids) {
        if (await utils.hasRecords(cloud, foreignCollection, [foreignKey, ...foreignFields], { [foreignKey]: _id, ...foreignFieldsValues })) {
          throw {
            message: utils.noMessage(foreignKeyErrorMessage),
            foreignFail: {}
          }
        }
      }
    }

    const data = await cloud.db.collection(collection).deleteMany({ _id: { $in: _ids } })
    return {
      success: true,
      message: utils.noMessage(successMessage)
    }
  } catch (e) {
    console.log('fail:', e)
    return {
      success: false,
      message: e.message || e,
      ...e,
    }
  }
}

exports.createMany = async (context) => {
  try {
    const cloud = context.cloud
    const { collection, fields, form: forms, successMessage = '新增成功', validate, repect } = context.data

    if (validate) {
      const { formRules, validateErrorMessage = '表单校验失败', validateErrorFuntion = `return ''` } = validate
      for (let form of forms) {
        const { errorMessage, validated } = utils.validate(formRules, form)
        if (!validated) {
          throw {
            message: (new Function('errorMessage', validateErrorFuntion))(errorMessage) || utils.noMessage(validateErrorMessage),
            validateFail: {
              errorMessage
            }
          }
        }
      }
    }

    if (repect) {
      // 去重
      const formSet = Object.values(forms.reduce((obj, form) => {
        const key = repectFields.reduce((str, field) => str + (form[field] || 'null'), '')
        obj[key] = form
        return obj
      }, {}))
      const { repectFields, repectErrorMessage = '数据重复', repectErrorFuntion = `return ''`, cover } = repect

      const needUpdateForms = []
      const needCreateForms = []
      for (let form of formSet) {
        const [record] = await utils.hasRecords(cloud, collection, repectFields, form, true)
        if (record) {
          if (cover) {
            needUpdateForms.push(Object.assign(record, form))
            await createOfUpdate({ cloud, collection, fields, form, updateRecord: record })
          } else {
            throw {
              message: (new Function('form', repectErrorFuntion))(form) || utils.noMessage(repectErrorMessage),
              repectFail: {}
            }
          }
        } else {
          needCreateForms.push(form)
        }
      }

      if (record) {
        for (const form of needUpdateForms) {
          await createOfUpdate({ cloud, collection, fields, form })
        }
        forms.splice(0, forms.length, ...needCreateForms)
      }
    }

    const now = new Date().getTime()
    const entitys = forms.map((form, index) => {
      const entity = {
        created_at: now + index,
        updated_at: now + index
      }
      fields.forEach(field => {
        entity[field] = form[field] || null
      })
      return entity
    })
    entitys.length && await cloud.db.collection(collection).insertMany(entitys)

    return {
      success: true,
      message: utils.noMessage(successMessage)
    }
  } catch (e) {
    console.log('fail:', e)
    return {
      success: false,
      message: e.message || e,
      ...e,
    }
  }
}

exports.log = async (context) => {
  return {
    success: true,
    log: context.data
  }
}