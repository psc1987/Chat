const express = require('express')
let app = express()

const { Nuxt, Builder } = require('nuxt');
let config = require('../nuxt.config.js');
const nuxt = new Nuxt(config);

const http = require('http')
let server = http.createServer(app)

let socket = require('socket.io')
let io = socket(server)

app.use(nuxt.render);

const builder = new Builder(nuxt);
builder.build()

server.listen(3000, () => {
    console.log('server on 3000 Port')
})

let getNowDate = (d) => (`${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${d.getHours()}시 ${d.getMinutes()}분 ${d.getSeconds()}초`)

let memberInfoName = {} // {name: id, name: id}
let memberInfoId = {} // {id: name, id: name}
let groups = [] // 그룹 이름
let groupJoinMember = {} // {id: groupName}

let chat = io.of('/chat').on('connection', (socket) => {
    socket.on('enter', (name) => {
        let id = socket.id
        if (memberInfoName.hasOwnProperty(name)) { //유저존재 여부 검사
            socket.emit('enter', false)
        } else {
            memberInfoName[name] = id //유저 정상 추가
            memberInfoId[id] = name
            socket.emit('enter', true)
        }
    })

    socket.on('allSend', (msg) => { //전체 채팅
        let id = socket.id //소켓 아이디를 이용하여 유저 이름을 가져온다
        let message = `[전체채팅] ${memberInfoId[id]} - ${msg} (${getNowDate(new Date())})`
        socket.emit('allSend', message)
        socket.broadcast.emit('allSend', message)
    })

    socket.on('whisperSend', (info) => { //귓속말(1:1)
        let id = socket.id
        let recieveId = memberInfoName[info.whisperUser]
        let message = `[귓속말] ${memberInfoId[id]}가 ${info['whisperUser']}에게 - ${info['message']} (${getNowDate(new Date())})`
        chat.to(recieveId).emit('whisperSend', message) //io대신 엔드포인트 chat 사용, 메세지 전달하는 사람에게도 이벤트 발생
        chat.to(id).emit('whisperSend', message)
    })

    socket.on('disconnect', () => { //소켓 연결이 끊겼을 때 이벤트 발생
        let id = socket.id
        let name = memberInfoId[id]
        delete memberInfoName[name] //접속 종료시 아이디와 이름정보를 지운다
        delete memberInfoId[id]
    })

    socket.on('teamCreate', (teamName) => { //팀 생성
        let id = socket.id
        socket.leave(groupJoinMember[id], () => { //기존에 참가했던 팀은 지워주고 새로운 팀을 넣어준다
            socket.join(teamName, () => {
                groupJoinMember[id] = teamName
                let message = `[팀채팅] **${memberInfoId[id]}가 참가 했습니다.** (${getNowDate(new Date())})`
                chat.to(groupJoinMember[id]).emit('teamSend', message)
            })
        })
    })

    socket.on('teamSend', (msg) => {
        let id = socket.id
        let message = `[팀채팅] ${memberInfoId[id]} - ${msg} (${getNowDate(new Date())})`
        chat.to(groupJoinMember[id]).emit('teamSend', message)
    })
})