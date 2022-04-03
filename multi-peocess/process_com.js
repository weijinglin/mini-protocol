const childProcess = require('child_process');
const path = require('path');
const net = require('net');
const { createTmpFileWithContent } = require('../helper');
const { MyParse, dopack } = require('../myprotocol');

const codeExecutedInChildProcess = `
const { MyParse, dopack } = require('../myprotocol');
const net = require('net');
// 启动服务器
const server = net.createServer((socket) => {
  const myPro = new MyParse({
    call: function() {
      console.log('child receive: ', ...arguments);
      socket.write(dopack('from child'));
    }
  }) 
  socket.on('data',(data) => {
    console.log(data.toString())
    myPro.parse(data)
  });
});
//向父进程发送信息，保证startClient执行的时候socket已经成功连接
server.listen(8080,()=>{
  process.send('ok');
});
`;
const filepath = `${__dirname}/childprocess.js`;
createTmpFileWithContent(filepath, codeExecutedInChildProcess);

// 创建进程
const worker = childProcess.fork(filepath);

async function startClient() {
  const socket = net.connect(8080);
  socket.on('connect', () => {
    console.log('connect');
  });
  const myPro = new MyParse({
      call:function(){
          console.log('i receive :', ...arguments);
      }
  })
  socket.on('data', myPro.parse.bind(myPro));
  socket.write(dopack('hello'));
  let i = 0;
  const timer = setInterval(() => {
    socket.write(dopack(String(i+1)));
    i++ > 5 && (socket.end(), clearInterval(timer));
  },1000)
}

worker.on('message', () => {
  startClient();
});