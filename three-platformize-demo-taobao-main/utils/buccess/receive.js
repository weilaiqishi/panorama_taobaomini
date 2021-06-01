
// 收货地址表单
// isProvince 是否区分省市区
// return
// receiveInfo放到js的page data中，用a:for来循环生成表单
// data: {
//  ...,
//  receiveInfo
// }
// 例
{/* <view
a:for="{{receiveInfo}}"
a:key="{{index}}"
>
<input
  class="input"
  placeholder="{{item.placeholder}}"
  placeholderStyle="font-size: 24rpx;font-weight: 300;color: #697A93;text-align: left;"
  value="{{item.value}}"
  data-index="{{index}}"
  data-name="{{item.props}}"
  onInput="inputForm"
  maxlength="{{item.maxlength || 140}}"
  style="display: block; box-sizing: border-box; padding-left: 20rpx; width: 520rpx; text-align: left;"
/>
<view style="height: 40rpx;"></view>
</view> */}
// inputForm放到js的page methods中
// checkForm用来校验数据,如果校验通过则返回表单数据
export function makeReceiveInfo(isProvince) {
    const receiveInfo = [
        {
            label: '姓名',
            placeholder: '请输入姓名',
            props: 'real_name',
        },
        {
            label: '电话',
            placeholder: '请输入联系电话',
            props: 'phone',
            maxlength: 11
        }
    ]
    let makeFormData
    if (isProvince) {
        receiveInfo.push(
            {
                label: '省市区',
                placeholder: '请输入省市区',
                props: 'bigAddress',
            },
            {
                label: '详细地址',
                placeholder: '请输入详细地址',
                props: 'smallAddress',
            }
        )
        makeFormData = (ri) => ({
            real_name: ri[0].value,
            phone: ri[1].value,
            location: ri[2].value + ri[3].value,
        })
    } else {
        receiveInfo.push(
            {
                label: '地址',
                placeholder: '请输入地址',
                props: 'location',
            }
        )
        makeFormData = (ri) => ({
            real_name: ri[0].value,
            phone: ri[1].value,
            location: ri[2].value
        })
    }
    function checkForm(ri) {
        if (ri.some(item => !item.value)) {
            my.alert({ content: '请注意完善信息' })
            return
        }
        if (!/^1[0-9]{10}$/.test(ri[1].value)) {
            my.alert({ content: '请填写11位数字手机号' })
            return
        }
        return makeFormData(ri)
    }
    function inputForm(e) {
        let { index } = e.currentTarget.dataset;
        this.setData({
            [`receiveInfo[${index}].value`]: e.detail.value
        })
    }
    return [receiveInfo, checkForm, inputForm]
}