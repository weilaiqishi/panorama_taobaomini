exports.main = async (context) => {
    try {
        const cloud = context.cloud;
        console.log(context)
        let result = {}
        // 先查询是否有授权记录
        const data = await cloud.db.collection('authorization').find(
            {
                user_nick: { $eq: context.userNick }
            }
        )
        // 获取shop
        let shop = ''
        if(context.userNick.indexOf(':') != -1){
            shop = context.userNick.split(':')[0];
        }else{
            shop = context.userNick;
        }

        if (data && data.length>0) {
            // 更新
            await cloud.db.collection('authorization').updateMany({
                user_nick: { $eq: context.userNick }
            }, {
                $set: {
                    accessToken: context.accessToken
                }
            })
        } else {
            //保存用户信息  
            const addRes = await cloud.db.collection('authorization').insertOne({
                // context 自带的参数  
                user_nick: context.userNick,
                open_id: context.openId,
                // 端上传过来的参数   
                accessToken: context.accessToken,
                shop
            })
        }
       
        result.user_nick = context.userNick
        result.accessToken = context.accessToken
        result.shop = shop
        return {
            success: true,
            result: result
        };
            
    } catch (e) {
        return {
            success: false,
            message: e.message,
            stack: e.stack
        }
    }
};