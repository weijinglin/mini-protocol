const net = require('net');
const { MyParse, dopack } = require('../myprotocol');

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

server.listen(8080);