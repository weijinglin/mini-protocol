# mini-protocol
mini-protocol

自定义应用层协议：
      |0xa| length(6 bytes) | sequence(4 bytes) | data |
      
使用tcp作为底层的协议，使用node.js实现了简单的解析器(MyParse)
