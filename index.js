mdui.setColorScheme('#DD0066');

var uid_list = [];

const e_uidadd = $('.uid-add');
const e_uidimp = $('.uid-import');
const e_uidexp = $('.uid-export');
const e_uidlist = $('.uid-list');

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
                                reflash_uid_list();
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
};