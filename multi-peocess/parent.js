const net = require('net');
const { MyParse, dopack } = require('../myprotocol');


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
}

startClient();