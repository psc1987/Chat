//plugins에 소켓 서버와 연결된 소켓 객체를 생성
//각 페이지 plugins에 soket.io.js(본 파일) 를 가져다가 사용


import io from 'socket.io-client'
const socket = io('http://localhost:3000/chat')

export default socket