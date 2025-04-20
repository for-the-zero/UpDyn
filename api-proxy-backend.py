# Qwen2.5-Max生成（喂了bilimiao(kotlin)的部分源码和pilipala(dart)的部分源码和bilibili-api-collect部分文档），实际部署时有修改

from flask import Flask, request, jsonify
import hashlib
import urllib.parse
import time
import requests
import uuid

app = Flask(__name__)

# WBI 签名算法
def get_mixin_key(orig):
    MIXIN_KEY_ENC_TAB = [
        46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
        33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40,
        61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11,
        36, 20, 34, 44, 52
    ]
    return ''.join(orig[i] for i in MIXIN_KEY_ENC_TAB)[:32]

def enc_wbi(params, img_key, sub_key):
    mixin_key = get_mixin_key(img_key + sub_key)
    curr_time = int(time.time())
    params['wts'] = curr_time
    params = dict(sorted(params.items()))
    # 过滤特殊字符
    params = {k: ''.join(c for c in str(v) if c not in "!'()*") for k, v in params.items()}
    query = urllib.parse.urlencode(params)
    wbi_sign = hashlib.md5((query + mixin_key).encode()).hexdigest()
    params['w_rid'] = wbi_sign
    return params

def get_wbi_keys():
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
        "Referer": "https://www.bilibili.com/"
    }
    resp = requests.get('https://api.bilibili.com/x/web-interface/nav', headers=headers)
    data = resp.json()
    img_url = data['data']['wbi_img']['img_url']
    sub_url = data['data']['wbi_img']['sub_url']
    img_key = img_url.rsplit('/', 1)[1].split('.')[0]
    sub_key = sub_url.rsplit('/', 1)[1].split('.')[0]
    return img_key, sub_key

def get_bilibili_dynamic(host_mid, offset="", timezone_offset="-480", features="itemOpusStyle"):
    url = "https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space"
    params = {
        "host_mid": host_mid,
        "offset": offset,
        "timezone_offset": timezone_offset,
        "features": features
    }
    headers = {
        "User-Agent": "Mozilla/5.0 BiliDroid/1.45.0 (bbcallen@gmail.com) os/android model/2201123C mobi_app/android_hd build/1450000 channel/bili innerVer/1450000 osVer/12 network/2",
        "Referer": "https://www.bilibili.com/",
        "buvid": generate_buvid(),
        "env": "prod",
        "app-key": "android_hd",
    }
    img_key, sub_key = get_wbi_keys()
    signed_params = enc_wbi(params, img_key, sub_key)
    response = requests.get(url, params=signed_params, headers=headers)
    if response.status_code == 200:
        data = response.json()
        print(data)
        if data["code"] == 0:
            return data["data"]
        else:
            print(f"Error: {data['message']} (Code: {data['code']})")
    else:
        print(f"HTTP Error: {response.status_code}")
    return None

def generate_buvid():
    uuid_str = str(uuid.uuid4()).replace("-", "")
    return "XY" + uuid_str[:35].upper()

@app.route('/dyn', methods=['GET'])
def bilibili_dynamic_api():
    host_mid = request.args.get('host_mid', default=513066052, type=int)
    dynamic_data = get_bilibili_dynamic(host_mid)
    if dynamic_data:
        return jsonify(dynamic_data)
    else:
        print(dynamic_data)
        return jsonify({"error": "Failed to fetch data"}), 500

if __name__ == "__main__":
    app.run(debug=True)