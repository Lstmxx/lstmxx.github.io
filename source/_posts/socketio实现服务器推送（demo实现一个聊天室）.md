---
title: socketio实现服务器推送（demo实现一个聊天室）
date: 2020-06-29 11:20:26
tags:
  - Python
  - Flask
  - WebSocket
categories:
  - 项目
---

demo 演示地址：<http://chat.lstmxx.cn>

github 地址：<https://github.com/Lstmxx/chatroom>

## 前言

服务端推送是一种服务器主动给客户端发送的技术，主要用于实时对客户端进行消息推送，如天气预报、聊天功能等。

### HTTP 1.x

在 websocket api 出现之前，由于 http1.x 的缺陷，导致通信只能由客户端发起，用户想要获取到实时数据变化，就要不停的向服务器发送请求，这种方法我们一般称为轮询。这种方法在 web 端可以一用，但是在移动端就不行了，想一想你的 app 不停的消耗你的流量发请求到服务器，这会导致用户流量的大量浪费，体现极其差。

```js
setInterval(() => {
  axios()then((res) => {
    ···
  }).catch(err => {
    ···
  })
}, 3000)
```

### HTTP 2.0

为了解决这一问题，终于在 http2.0 协议里面增加了一个新特性——服务器推送。而 Html5 根据这一特性提供了一种在单个 TCP 连接上进行全双工通讯的协议——[WebSocket](https://www.runoob.com/html/html5-websocket.html)。

### Socketio

#### 描述

如果客户端想要使用 websocket 接受服务器推送的话，Socketio 是一个不错的选择。Socket.io 将 Websocket、轮询机制以及其它的实时通信方式（ajax 等）封装成了通用的接口，并且在服务端也实现了这些实时机制的相应代码。所以，使用 Socket.io 便不需要担心浏览器兼容问题。

#### namespace 和 room

socketio 有两个重要的概念——namespace 和 room。两者关系是 namespace 包含 room。举个例子，你要通知北小区的 4 座的所有用户交管理费，你先找到了北小区（namespace）然后再找到 4 座（room），最后给 4 座里面的业主发送交管理费消息。

## Socketio 的安装与使用

### Vue 中使用 Socketio

在 Vue 中有两种方式使用 Socketio

#### 直接使用官方包

下载

```bash
npm install socket.io
```

引入

```js
import io from 'socket.io-client'
```

使用

```js
// 这里的namespace和后端设置的namespace是一样的
const socket = io.connect(`http://${域名}/${namespace}`)

// on函数是监听函数，接受两个参数，第一个是订阅名，第二个是接受订阅信息的回调
socket.on('chatMessage', res => {
  console.log(res)
})
socket.on('response', res => {
  console.log(res)
})
socket.on('connect', res => {
  console.log(res)
})
···
// emit是发送函数，第一个参数是后端的订阅名，第二个是数据，可以是任意类型
socket.emit('user_input', 'wdnmd')
```

#### 使用 VueSocketio

相较于 socket.io-client，VueSocketio 自带支持在 vuex 中使用，这使得多组件共用消息更加便利。npm 地址：<https://www.npmjs.com/package/vue-socket.io> 。

下载

```bash
npm install vue-socket.io
```

引入

```js
// /fronted/src/main.js
import store from './store'
import VueSocketio from 'vue-socket.io'
···
Vue.use(new VueSocketio({
  debug: true,
  connection: `/${namespace}`,
  /* 推荐使用vuex引入，方便多组件状态共享 */
  vuex: {
    store,
    actionPrefix: 'SOCKET_' // 前缀，为了区分vuex文件中响应函数和普通函数
  }
}))
```

单组件使用

```js
// 在需要监听的vue引入
···
export default {
  sockets: {
    connect: function () {
      console.log('socket connected')
    },
    received: function (res) {
      console.log(res)
    }
  }
}
···
```

vuex 中使用

```js
// /store/module/room.js
···
// responseData 为响应数据
SOCKET_received ({ state, rootState, commit }, responseData) {
  // do something
},
SOCKET_join_one ({}, responseData) {
  // do something
}
```

### flask 中使用 Socketio

flask 中使用 socketio 主要用到 Flask-SocketIO 这个包，官网地址：<https://flask-socketio.readthedocs.io/en/latest/> 。

下载

```python
pip install flask-socketio
```

使用

```python
···
# /backend/blueprint/socketio.py
from flask_cors import CORS # 跨域
from flask_socketio import SocketIO, emit, join_room, leave_room, close_room, rooms, disconnect

# 初始化socketio
socketio = SocketIO(app, cors_allowed_origins="*")
# 第一个参数为事件名，第二个为namespace
# 通过监听namespace下的事件做出响应，这里的namespace和前面前端定义的namespace要相同
# message为请求参数
@socketio.on('test_input', namespace='/chatroom')
def test_input(message):
    # do someting
    socketio.emit('test_received', '收到啦', namespace='/chatroom')
```

在 app.py 中引入

```python
# /backend/app.py
from blueprint.socketio import app, socketio, db
···
if __name__ == "__main__":
    ···
    socketio.run(app, host="0.0.0.0", port=4999, debug=True)
```

### nginx 配置

既然是前后端分离，那当然要使用 nginx 啦~

配置 chatroom.conf

```nginx
upstream chat_frontend {
    server 127.0.0.1:8181; # 前端工程运行的地址
}

upstream chat_backend {
    server 127.0.0.1:4999; # 后端工程运行的地址
}

server {
    listen       80; # 监听端口
    server_name  www.chatroom.com; #域名
        location ^~ /api { # 普通接口路由
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-Server $host;
            proxy_pass http://chat_backend;
        }
        location /socket.io { # socketio的路由
            proxy_http_version 1.1;
            proxy_buffering off;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "Upgrade";
            proxy_pass http://chat_backend;
        }
        location / { # 前端路由
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-Server $host;
            proxy_pass http://chat_frontend;
        }
}
```

配置 host

```conf
···
127.0.0.1 www.chatroom.com
```

### 通信

前面把 flask 和 vue 都配置好了，那么先测试一下。

整个流程非常简单，流程图如下：

![](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2020/6/29/172fe93449800d38~tplv-t2oaga2asx-image.image)

#### vue

获取用户输入后，向目标事件发送数据。这里我自己实现了一个简陋的 rich-text，如果不追求效果直接用 input 标签就完事了。

```js
// /src/components/chat-room/message-box/message-box.vue
···
sendMessage (message) {
  // 第一个参数为事件名，第二个参数为要发送的数据
  this.$socket.emit('test_input', message)
}
```

在 vuex 中监听 received 事件获取服务器返回消息。

```js
// /src/store/module/room.js
export default {
  ···
  actions: {
    ···
    SOCKET_test_received ({ state, rootState, commit }, responseData) {
      console.log(responseData)
    }
  }
}

```

#### flask

后端这边就非常简单了，增加一个消息回调函数就好了。

```python
from flask_socketio import SocketIO, emit
socketio = SocketIO(app, cors_allowed_origins="*")
···
@socketio.on('test_input', namespace='/chatroom')
def test_input(message):
    # do someting
    socketio.emit('test_received', '收到啦', namespace='/chatroom')
    # 或者
    # emit('test_received', '收到啦', namespace='/chatroom')
```

要注意的是，这个 emit 没有指定某一个 room，所以会广播给在这个 namespace 下的所有人。

打开谷歌浏览器，效果如下：

![](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2020/6/29/172fe94c8b5e4c45~tplv-t2oaga2asx-image.image)

## 实现聊天室小 demo

### 构思

一个简单的聊天室肯定会涉及到用户，房间和消息记录。

### 实现登录页面

首先解决一下用户，最核心的是登录。先建一个用户表。

```sql
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `password` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `create_time` datetime(0) DEFAULT NULL,
  `avatar_image` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `room_id_set` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci COMMENT '每个用户所参加的房间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `ix_user_username`(`username`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;
```

封装一下登录接口，使用 vuex 保存登录状态。因为关闭页面后 vuex 会清掉 token 使用 cookie 来保存（axios 的封装就不说了，不是重点）

```js
// /fronted/src/libs/requestApi.js
···
export function baseLogin (config) {
  const request = {
    url: config.url,
    method: 'POST',
    data: config.data
  }
  return service.request(request)
}
```

```js
// /fronted/src/libs/request.js
export function login (config) {
  return new Promise((resolve, reject) => {
    baseLogin(config).then((response) => {
      resolve(response.data.data)
    }).catch((err) => {
      reject(err)
    })
  })
}
```

保存 token

```js
// /fronted/src/libs/utility/token.js
import Cookies from 'js-cookie'
const TOKEN_KEY = 'token'
export const setToken = (token) => {
  Cookies.set(TOKEN_KEY, token, { expires: 1 })
}

export const getToken = () => {
  const token = Cookies.get(TOKEN_KEY)
  if (token !== 'null') return token
  else return false
}
```

编写 vuex 的 user 模块

```js
// /fronted/src/store/module/user.js
import { getToken, setToken } from '../../libs/utility/token'
import { login, getUserInfo, logout } from '@/libs/request'
export default {
  state: {
    token: getToken(),
    userName: null,
    userId: null,
    avatarImage: null
  },
  getters: {
    getToken (state) {
      return state.token
    },
    getUserName (state) {
      return state.userName
    },
    getUserId (state) {
      return state.userId
    },
    getAvatarImage (state) {
      return state.avatarImage
    }
  },
  mutations: {
    setToken (state, token) {
      state.token = token
      setToken(token)
    },
    setUserName (state, name) {
      state.userName = name
    },
    setUserId (state, userId) {
      state.userId = userId
    },
    setAvatarImage (state, avatarImage) {
      state.avatarImage = avatarImage
    }
  },
  actions: {
    handleLogin ({ commit }, config) {
      return new Promise((resolve, reject) => {
        login(config).then((responseData) => {
          commit('setToken', responseData.token)
          resolve(responseData)
        }).catch((err) => {
          reject(err)
          console.log(err)
        })
      })
    },
    loadUserInfo ({ commit }) {
      return new Promise((resolve, reject) => {
        getUserInfo().then((responseData) => {
          commit('setToken', getToken())
          commit('setUserName', responseData.userInfo.name)
          commit('setUserId', responseData.userInfo.userId)
          commit('setAvatarImage', responseData.userInfo.avatar_image)
          resolve(responseData)
        }).catch((err) => {
          commit('setToken', null)
          reject(err)
          console.log(err)
        })
      })
    }
  }
}
```

在 login 页面中使用

```js
// /fronted/src/views/login/login.vue
import { mapActions } from 'vuex'
export default {
  ···
  methods: {
    ...mapActions([
      'handleLogin',
      'loadUserInfo'
    ]),
    checkCapslock (e) {
      const { key } = e
      this.capsTooltip = key && key.length === 1 && (key >= 'A' && key <= 'Z')
    },
    // 登录，成功后跳转
    onLogin () {
      this.$refs.loginForm.validate(valid => {
        if (valid) {
          this.$Loading.show()
          const config = {
            url: '/login',
            data: this.loginForm
          }
          this.handleLogin(config).then(() => {
            this.$Loading.hide()
            this.$router.push({
              name: 'ChatRoom'
            })
          }).catch((err) => {
            this.$Loading.hide()
            console.log(err)
          })
        }
      })
    },
    // 注册，成功后回调登录
    onRegister () {
      this.$refs.loginForm.validate(valid => {
        if (valid) {
          this.$Loading.show()
          const config = {
            url: '/register',
            data: this.loginForm
          }
          this.handleLogin(config).then(() => {
            this.$Loading.hide()
            this.onLogin()
          }).catch((err) => {
            this.$Loading.hide()
            console.log(err)
          })
        }
      })
    }
  }
}
```

后端方面，可以看看/backend/blueprint/user.py。ui 方面就不说了，不是重点。

### 实现房间的创建，展示和加入功能

对于房间来说，肯定要有创建和加入这两个功能的，下面先说说创建。

先建个表吧

```sql
DROP TABLE IF EXISTS `room`;
CREATE TABLE `room`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `owner` int(11) DEFAULT NULL COMMENT '房间创建人',
  `user_set` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `create_time` datetime(0) DEFAULT NULL,
  `update_time` datetime(0) DEFAULT NULL,
  `avatar_image` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `room_hash_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `ix_room_avatar_image`(`avatar_image`) USING BTREE,
  INDEX `ix_room_create_time`(`create_time`) USING BTREE,
  INDEX `ix_room_name`(`name`) USING BTREE,
  INDEX `ix_room_owner`(`owner`) USING BTREE,
  INDEX `ix_room_update_time`(`update_time`) USING BTREE,
  CONSTRAINT `room_ibfk_1` FOREIGN KEY (`owner`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 38 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;
```

#### 创建房间

首先先明确创建房间需要什么数据，我的想法是需要房间头像，房间名和房间描述。

前端主要是获取了房间头像、房间名和房间描述后发送请求到后端。这里的 upLoadFile 是自己模仿 element 来写的组件，有兴趣可以在 /fronted/src/components/base/up-load-file/up-load-file.vue 查看

```vue
// /fronted/src/components/chat-room/room-list/room-list.vue
<template>
···
    <el-dialog title="创建房间" :visible.sync="createRoomDialog">
      <el-form :model="createRoom" :rules="createRules" ref="createRoomForm">
        <el-form-item label="房间名" prop="hashId">
          <el-input v-model="createRoom.name" autocomplete="off" :maxlength='32' :minlength='32'></el-input>
        </el-form-item>
        <el-form-item label="房间描述" prop="description">
          <el-input v-model="createRoom.description" autocomplete="off" :maxlength='32' :minlength='32'></el-input>
        </el-form-item>
        <el-form-item label="房间头像" prop="avatarImage">
          <upLoadFile :maxImageNum="1" @on-change="getFilePath"/>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="createRoomDialog = false">取 消</el-button>
        <el-button type="primary" @click="handleCreateRoom">确 定</el-button>
      </div>
    </el-dialog>
···
</template>
<script>
import { post } from '@/libs/request'
import upLoadFile from '@/components/base/up-load-file'
export default {
  name: 'RoomList',
  props: {
    roomList: {
      default: () => [],
      type: Array
    }
  },
  components: {
    ···
    upLoadFile
  },
  data () {
    return {
      ···
      createRoom: {
        name: '',
        description: '',
        avatarImage: ''
      }
    }
  },
  method: {
    getFilePath (imageList) {
      this.createRoom.avatarImage = imageList[0].base64Path
    },
    handleCreateRoom () {
      this.$refs.createRoomForm.validate(valid => {
        if (valid) {
          this.$Loading.show()
          const config = {
            url: '/room/create',
            data: this.createRoom
          }
          post(config).then((responseData) => {
            this.$Loading.hide()
            this.createRoom.name = ''
            this.createRoomDialog = false
            this.createRoom = {
              name: '',
              description: '',
              avatarImage: ''
            }
            this.$message({
              message: '创建成功',
              type: 'success'
            })
            this.$emit('create-room-success', responseData.room)
          }).catch((err) => {
            this.$Loading.hide()
            this.createRoomDialog = false
            console.log(err)
          })
        }
      })
    }
  }
}
</script>
```

后端这边就简单了，直接插入数据库。插入时候使用 base64 来生成房间码，之后加入房间要用。

```python
# /backend/blueprint/room.py
···
@room_bp.route('/api/room/create', methods=['POST'])
@verify_token
def room_create(tokenData):
    values = request.get_json()
    user = User.query.filter_by(id=tokenData['userId']).first()
    if user:
        room = Room(name=values['name'],
                    description=values['description'],
                    user_set=str(tokenData['userId']),
                    owner=user.id,
                    avatar_image='')
        db.session.add(room)
        db.session.flush()
        room.room_hash_id = hashlib.md5(f'{room.id}{time.time()}'.encode('utf-8')).hexdigest()
        room.user_set = f'{room.user_set},{user.id}' if room.user_set else user.id
        if values['avatarImage']:
            avatartImageList = values['avatarImage'].split(',')
            suffix = avatartImageList[0].split('/')[1].split(';')[0]
            filename = f'room_avatar/{room.room_hash_id}.{suffix}'
            print(filename)
            with open(f'media/{filename}', 'wb') as f:
                f.write(base64.b64decode(avatartImageList[1]))
            room.avatar_image = filename
        user.room_id_set = f'{user.room_id_set},{room.id}' if user.room_id_set else room.id
        db.session.commit()
        return jsonify({
            'data': {
                'room': JSONHelper.model_to_json(room)
            },
            'message': '成功',
            'status': 200
        })
    return jsonify({
        'data': '',
        'message': '失败失败',
        'status': 500
    })
```

#### 展示房间

这个其实就是拉一个房间列表。要注意的是前端获取到房间列表后，要调用 join_all 这个事件监听这些房间的消息。

后端

```python
@room_bp.route('/api/room/list', methods=['GET'])
@verify_token
def room_list(tokenData):
    user = User.query.filter_by(id=tokenData['userId']).first()
    if user:
        roomlist = Room.query.filter(Room.id.in_(user.room_id_set.split(','))).all() if user.room_id_set else []
        return jsonify({
            'data': {
                'roomList': JSONHelper.to_json_list(roomlist)
            },
            'message': '成功',
            'status': 200
        })
    return jsonify({
        'data': '',
        'message': '失败失败',
        'status': 500
    })
```

前端这边先在 room 模块里编写加载房间列表函数。

```js
// /fronted/src/store/module/room.js
···
loadRoomList ({ commit }) {
  return new Promise((resolve, reject) => {
    const config = {
      url: '/room/list'
    }
    get(config).then((responseData) => {
      commit('setRoomList', responseData.roomList)
      resolve(responseData.roomList)
    }).catch((err) => {
      reject(err)
    })
  })
}
```

在 chat-room 页面调用。

```js
// /fronted/src/views/chat-room/chat-room.vue
mounted () {
  this.loadRoomList().then((roomList) => {
    const request = {
      roomList: roomList.map(room => room.id),
      userId: this.userId
    }
    this.$socket.emit('join_all', request)
  }).catch((err) => {
    console.log(err)
  })
}
```

后端响应 join_all 事件，调用 join_room 加入用户所在的所有房间。

```python
# /backend/blueprint/socketio.py
@socketio.on('join_all', namespace='/chatroom')
def join_chats(message):
    """加入多个聊天室
    """
    user = User.query.filter_by(id=message['userId']).first()
    if user and len(message['roomList']) > 0:
        for roomId in message['roomList']:
            join_room(roomId)
            emit('received', { # 发送加入消息
                'user': {
                    'id': user.id,
                    'name': user.username,
                    'avatarImage': user.avatar_image,
                },
                'roomId': roomId,
                'type': 'join'
            }, namespace='/chatroom', room=roomId)
```

#### 加入房间

获取对应的房间码后，输入加入就 OK 了。

```vue
// /fronted/src/components/chat-room/room-list/room-list.vue
<template>
···
    <el-dialog title="加入房间" :visible.sync="joinRoomDialog">
      <el-form :model="joinRoom" :rules="joinRules" ref="joinRoomForm">
        <el-form-item label="房间号" prop="hashId">
          <el-input v-model="joinRoom.hashId" autocomplete="off" :maxlength='32' :minlength='32'></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="joinRoomDialog = false">取 消</el-button>
        <el-button type="primary" @click="handleJoinRoom">确 定</el-button>
      </div>
    </el-dialog>
···
</template>
<script>
import { post } from '@/libs/request'
export default {
  name: 'RoomList',
  props: {
    roomList: {
      default: () => [],
      type: Array
    }
  },
  data () {
    return {
      ···
      joinRoom: {
        hashId: ''
      }
    }
  },
  method: {
    handleJoinRoom () {
      this.$refs.joinRoomForm.validate(valid => {
        if (valid) {
          this.$Loading.show()
          const config = {
            url: '/room/join',
            data: {
              roomIdHash: this.joinRoom.hashId
            }
          }
          post(config).then((responseData) => {
            this.$Loading.hide()
            this.joinRoomDialog = false
            this.$message({
              message: '加入成功',
              type: 'success'
            })
            this.$emit('create-room-success', responseData.room)
          }).catch((err) => {
            this.$Loading.hide()
            console.log(err)
          })
        }
      })
    }
  }
}
</script>
```

加入成功后，和创建一样，调用 join_one_chat 事件来加入房间。

```js
// /fronted/src/views/chat-room/chat-room.vue
handleCreateJoinRoom (room) {
  const roomList = this.roomList
  roomList.push(room)
  this.$store.commit('setRoomList', roomList)
  const request = {
    roomId: room.id,
    userId: this.userId
  }
  this.$socket.emit('join_one_chat', request)
}
```

后端响应回调。

```python
# /backend/blueprint/socketio.py
@socketio.on('join_one_chat', namespace='/chatroom')
def join_one_chat(join):
    """加入聊天室
    """
    room = Room.query.filter_by(id=join['roomId']).first()
    user = User.query.filter_by(id=join['userId']).first()
    print(join)
    if room and user:
        join_room(room.id)
        emit('received', {
            'user': {
                'id': user.id,
                'name': user.username,
                'avatarImage': user.avatar_image,
            },
            'roomId': room.id,
            'type': 'join'
        }, namespace='/chatroom', room=room)
```

### 消息记录的发送与保存

先建个表

```sql
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-----------------------------
-Table structure for room_record
-----------------------------
DROP TABLE IF EXISTS `room_record`;
CREATE TABLE `room_record`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `create_time` datetime(0) DEFAULT NULL,
  `room_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `ix_room_record_create_time`(`create_time`) USING BTREE,
  INDEX `ix_room_record_room_id`(`room_id`) USING BTREE,
  CONSTRAINT `room_record_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `room` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 12 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
```

用户选择了对应房间，在对应房间中发送消息就 OK 了。

```js
// /fronted/src/components/chat-room/message-box/message-box.vue
···
import { mapGetters, mapActions } from 'vuex'
import util from '@/libs/utility/util.js'
import UserMessage from '../user-message/index'
import JoinMessage from '../join-message/index'
import RichText from '@/components/base/rich-text/index'
export default {
  name: 'MessageBox',
  components: {
    UserMessage,
    JoinMessage,
    RichText
  },
  computed: {
    ...mapGetters({
      selectedRoom: 'getSelectedRoom',
      userId: 'getUserId',
      userName: 'getUserName',
      messageList: 'getMessageList',
      isUpdate: 'getUpdate',
      avatarImage: 'getAvatarImage'
    })
  },
  watch: {
    selectedRoom () {
      this.setMessageContentScroll()
    },
    isUpdate () {
      if (this.isUpdate) {
        this.$forceUpdate()
        this.updateComplete()
        this.setMessageContentScroll()
      }
    }
  },
  methods: {
    ...mapActions([
      'updateComplete',
      'userInput'
    ]),
    setMessageContentScroll () {
      this.$nextTick(() => {
        const messageContent = document.getElementById('messageContent')
        if (messageContent) {
          if (messageContent.scrollHeight > messageContent.clientHeight) {
            messageContent.scrollTop = messageContent.scrollHeight
          }
        }
      })
    },
    sendMessage (message) {
      const messageId = Number(new Date())
      const messageContext = {
        user: {
          id: this.userId,
          name: this.userName,
          avatarImage: this.avatarImage
        },
        roomId: this.selectedRoom.id,
        id: messageId,
        message,
        loading: true,
        type: 'input'
      }
      const request = {
        userId: this.userId,
        roomId: this.selectedRoom.id,
        id: messageId,
        message,
        type: 'input'
      }
      this.userInput(messageContext)
      this.$socket.emit('user_send_message', request)
    }
  }
}
```

后端。接收到请求后，完成插入数据库处理并通过 received 事件返回给前端

```python
# /backend/blueprint/socketio.py
@socketio.on('user_send_message', namespace='/chatroom')
def user_input(message):
    """获取用户输入
    """
    userId = message['userId']
    user = User.query.filter_by(id=message['userId']).first()
    if user:
        response = {
            'user': {
                'id': user.id,
                'name': user.username,
                'avatarImage': user.avatar_image,
            },
            'message': message['message'],
            'roomId': message['roomId'],
            'id': message['id'],
            'type': message['type'],
            'time': datetime.utcnow().isoformat(),
        }
        roomRecord = RoomRecord(content=message['message'], user_id=user.id, room_id=message['roomId'])
        db.session.add(roomRecord)
        db.session.commit()
        socketio.emit('received', response,
                        namespace='/chatroom',
                        room=message['roomId'])
```

前端 vuex 的 room 模块接收

```js
// /fronted/src/store/module/room.js
export default {
  action: {
    updateComplete ({ commit }) {
      commit('setUpdate', false)
    },
    SOCKET_received ({ state, rootState, commit }, responseData) {
      const messageList = state.messageList
      const user = rootState.user
      responseData.time = normalizeTimeDetail(responseData.time)
      if (user.userId === responseData.user.id && responseData.type !== 'join') {
        for (let i = messageList[responseData.roomId].length 1; i > 0; i--) {
          if (messageList[responseData.roomId][i].user.id === user.userId && responseData.id === messageList[responseData.roomId][i].id) {
            messageList[responseData.roomId][i].loading = false
            messageList[responseData.roomId][i].time = responseData.time
            break
          }
        }
        if (!state.update) {
          commit('setUpdate', true)
        }
      } else {
        if (!messageList[responseData.roomId]) {
          messageList[responseData.roomId] = []
        }
        messageList[responseData.roomId].push(responseData)
        if (!state.update) {
          commit('setUpdate', state.selectedRoom ? responseData.roomId === state.selectedRoom.id : false)
        }
      }
      commit('setMessageList', messageList)
    }
  }
}
```

## 总结

说到这里其实也说完了重点的地方了，有兴趣可以看看源码。第一次写文章，有不足的地方请大佬们多多指点。

## 参考连接

- [1] <https://www.runoob.com/html/html5-websocket.html>
- [2] <https://www.npmjs.com/package/vue-socket.io>
- [3] <https://flask-socketio.readthedocs.io/en/latest/>
