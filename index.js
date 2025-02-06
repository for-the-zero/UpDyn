mdui.setColorScheme('#FF6699');

var uid_list = [];
var dyn_detail = {};

const e_uidadd = $('.uid-add');
const e_uidimp = $('.uid-import');
const e_uidexp = $('.uid-export');
const e_uidlist = $('.uid-list');
const e_uidbtn = $('.uid-save');

e_uidadd.on('click',()=>{
    mdui.prompt({
        headline: "添加UID",
        confirmText: "添加",
        cancelText: "取消",
        onConfirm: (value) => {
            if(value.length>0 && /^\d+$/.test(value)){
                value = parseInt(value);
                if(uid_list.indexOf(value)<0){
                    uid_list.push(value);
                    mdui.snackbar({message: "添加成功",closeable: true});
                    reflash_uid_list();
                }else{
                    mdui.snackbar({message: "UID已存在",closeable: true});
                }
            }else{
                mdui.snackbar({message: "请输入正确的UID",closeable: true});
            };
        }
    });
});
e_uidimp.on('click',()=>{
    mdui.prompt({
        headline: "导入列表",
        description: "JSON或url导入",
        confirmText: "导入",
        cancelText: "取消",
        onConfirm: (value) => {
            if(value.startsWith("[")){
                try{
                    var data = JSON.parse(value);
                    if(Array.isArray(data)){
                        uid_list = data;
                        mdui.snackbar({message: "导入成功",closeable: true});
                        reflash_uid_list();
                    }else{
                        mdui.snackbar({message: "导入失败",closeable: true});
                    };
                }catch(e){
                    mdui.snackbar({message: "导入失败",closeable: true});
                };
            } else {
                $.ajax({
                    url: value,
                    type: "GET",
                    dataType: "text",
                    success: function(data){
                        try{
                            var data = JSON.parse(data);
                            if(Array.isArray(data)){
                                uid_list = data;
                                mdui.snackbar({message: "导入成功",closeable: true});
                                localStorage.setItem('UpDyn_uid',JSON.stringify(uid_list))
                            }else{
                                mdui.snackbar({message: "导入失败",closeable: true});
                            };
                        }catch(e){
                            mdui.snackbar({message: "导入失败",closeable: true});
                            console.error(e);
                        };
                    },
                    error: function(xhr, status, error) {
                        mdui.snackbar({message: "导入失败",closeable: true});
                        console.error(xhr, status, error);
                    },
                });
            };
        },
    });
});
e_uidexp.on('click',()=>{
    navigator.clipboard.writeText(JSON.stringify(uid_list));
    mdui.snackbar({message: "导出成功",closeable: true});
});
function reflash_uid_list(){
    e_uidlist.empty();
    for(var i=0;i<uid_list.length;i++){
        let item = $(`<mdui-list-item>
            ${uid_list[i]}
            <mdui-button-icon icon="keyboard_arrow_up" slot="end-icon" class="uid-top"></mdui-button-icon>
            <mdui-button-icon icon="clear" slot="end-icon" class="uid-del"></mdui-button-icon>
            </mdui-list-item>`
        );
        item.find('.uid-top').on('click',function(){
            let index = uid_list.indexOf(parseInt(item.text()));
            let temp = uid_list[index];
            uid_list.splice(index,1);
            uid_list.unshift(temp);
            reflash_uid_list();
        });
        item.find('.uid-del').on('click',function(){
            let index = uid_list.indexOf(parseInt(item.text()));
            uid_list.splice(index,1);
            reflash_uid_list();
        });
        e_uidlist.append(item);
    };
    localStorage.setItem('UpDyn_uid',JSON.stringify(uid_list));
};
e_uidbtn.on('click',()=>{
    localStorage.setItem('UpDyn_uid',JSON.stringify(uid_list));
    //TODO:
    get_dyn_detail();
});


if(localStorage.getItem('UpDyn_uid')){
    uid_list = JSON.parse(localStorage.getItem('UpDyn_uid'));
    get_dyn_detail();
    console.log(dyn_detail);
} else {
    uid_list = [];
};

var req_time = 0;
var process = [0,0];
var dyn_obj = []; 
function get_dyn_detail(){
    req_time = 0;
    process = [req_time,uid_list.length];
    dyn_obj = [];
    for(var i=0;i<uid_list.length;i++){
        let uid = uid_list[i];
        setTimeout(()=>{
            $.ajax({
                url: `https://api.bilibili.com/x/space/acc/info?mid=${uid}&jsonp=jsonp`,
                type: "GET",
                async: false,
                success: function(data){
                    if(data.code==0){

                        // json解析1
                        data = data.data.data.items;
                        let this_user = {
                            avatar: '',
                            name: '',
                            dyns: [],
                        }
                        if(data[0].modules?.module_author?.face){
                            this_user.avatar = data[0].modules.module_author.face;
                        } else {this_user.avatar = ''};
                        if(data[0].modules?.module_author?.name){
                        } else {this_user.name = ''};
                        for(var j=0;j<data.length;j++){
                            this_user.dyns.push(parse_orig_json(data[j]));
                        };
                        dyn_obj.push(this_user);
                        process[0]++;
                    } else {
                        mdui.snackbar({message: `获取UID:${uid}动态失败：${status}`,closeable: true});
                        console.error(xhr);
                    };
                },
                error: function(xhr, status, error) {
                    process[0]++;
                    mdui.snackbar({message: `获取UID:${uid}动态失败：${status}`,closeable: true});
                    console.error(xhr, status, error);
                },
            });
            check_finished();
        },req_time * 2750);
        req_time++;
    };
};
/*
更适合ftz体质的object : dyn_obj
[
    {
        avatar: str,
        name: str,
        dyns: [
            {
                time: str,
                link: str,
                text: str,
                type: str, // text纯文本, forw转发, img图片, vid视频
                det: ... // 转发:{...}, 图片:[str,], 视频:{bv:str,title:str,cover:str,desc:str}
            },
        ]
    },
]
*/
function parse_orig_json(data){ // json解析2
    let this_dyn = {};

    if(data.modules?.module_author?.pub_time){
        this_dyn.time = data.modules.module_author.pub_time;
    };
    if(data.id_str){
        this_dyn.link = `https://t.bilibili.com/${data.id_str}`;
    };
    this_dyn.link = `https://t.bilibili.com/${data.id_str}`;
    //this_dyn.text = data.modules.module_dynamic.desc.text; // DYNAMIC_TYPE_WORD的opus不适用

    // DYNAMIC_TYPE_WORD 纯文字 DYNAMIC_TYPE_FORWARD 转发 DYNAMIC_TYPE_DRAW 带图 DYNAMIC_TYPE_AV 视频
    if(data.modules?.type){
        if(data.modules.type === 'DYNAMIC_TYPE_WORD'){
            // 纯文字
            if(data.modules.module_dynamic.major.type === 'MAJOR_TYPE_OPUS' 
                && data.modules.module_dynamic.desc === null 
                && data.modules.module_dynamic.major?.opus){
                // opus
                this_dyn.text = '';
                if(data.modules.module_dynamic.major.opus.title){
                    this_dyn.text += `<b>${data.modules.module_dynamic.major.opus.title}</b>\n`;
                };
                if(data.modules.module_dynamic.major.opus.summary?.text){
                    this_dyn.text += data.modules.module_dynamic.major.opus.summary.text;
                };
            } else {
                // 纯普通
                if(data.modules?.module_dynamic?.desc?.text){
                    this_dyn.text = data.modules.module_dynamic.desc.text;
                } else { this_dyn.text = ''; };
            };
            this_dyn.type = 'text';
            this_dyn.det = null;
        } else if(data.modules.type === 'DYNAMIC_TYPE_FORWARD'){
            // 转发
            if(data.modules?.module_dynamic?.desc?.text){
                this_dyn.text = data.modules.module_dynamic.desc.text;
            } else { this_dyn.text = ''; };
            this_dyn.type = 'text';
            if(data.orig){
                this_dyn.type = 'forw';
                this_dyn.det = parse_orig_json(data.orig);
            };
        } else if(data.modules.type === 'DYNAMIC_TYPE_DRAW'){
            if(data.modules?.module_dynamic?.desc?.text){
                this_dyn.text = data.modules.module_dynamic.desc.text;
            } else { this_dyn.text = ''; };
            // 带图
            if(data.modules?.module_dynamic?.major?.draw?.items && data.modules.module_dynamic.major.draw.items.length>0){
                this_dyn.det = [];
                for(var i=0;i<data.modules.module_dynamic.major.draw.items.length;i++){
                    if(data.modules.module_dynamic.major.draw.items[i].src){
                        this_dyn.det.push(data.modules.module_dynamic.major.draw.items[i].src);
                    };
                };
                this_dyn.type = 'img';
            } else {
                this_dyn.type = 'text';
            };
        } else if(data.modules.type === 'DYNAMIC_TYPE_AV'){
            if(data.modules?.module_dynamic?.desc?.text){
                this_dyn.text = data.modules.module_dynamic.desc.text;
            } else { this_dyn.text = ''; };
            // 视频
            if(data.modules?.module_dynamic?.archive){
                this_dyn.det = {
                    bv: data.modules.module_dynamic.archive.bvid,
                    title: data.modules.module_dynamic.archive.title,
                    cover: data.modules.module_dynamic.archive.cover,
                    desc: data.modules.module_dynamic.archive.desc,
                };
                this_dyn.type = 'vid';
            } else {
                this_dyn.type = 'text';
            };
        } else {
            // 其他
            if(data.modules?.module_dynamic?.desc?.text){
                this_dyn.text = data.modules.module_dynamic.desc.text;
                this_dyn.text += '\n\n';
            } else { this_dyn.text = ''; };
            this_dyn.text += `（已显示文本）不支持的动态类型：${data.modules.type}`
            this_dyn.type = 'text';
        };
    };
    return this_dyn;
};

function check_finished(){
    if(process[0] >= process[1]){
        console.log(dyn_obj);
        //TODO:
    } else {
        //TODO: 进度条
    };
};



// new Viewer(document.querySelector(`.pics`),{
//     url: 'data-original'
// });