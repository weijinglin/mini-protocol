const BEFIN = 0xa;//表示一次package的头部，根据头部的出现来判断是不是同一个package
const LENGTH = 6;//表示信息的长度的字节数
const SEQ = 4;//表示序列号的字节数
const HEADER = SEQ + LENGTH;

var seq = 0;


//按照递增的次序生成序列号
function getseq() {
    seq++;
    return seq;
}

//进行格式转化的函数,传入数据，返回打包好的数据包
function dopack(data){
    const myData = Buffer.from(data,'utf-8');
    const alllength = 1 + HEADER;
    var buffer = Buffer.allocUnsafe(alllength);
    const length = HEADER + myData.byteLength;
    buffer[0] = 0xa;
    var mySeq = getseq();
    //注意使用大端序写入,先写入总长度
    buffer.writeUIntBE(length,1,LENGTH);
    buffer.writeUIntBE(mySeq,LENGTH+1,SEQ);
    buffer = Buffer.concat([buffer,myData]);
    return buffer;
}


class MyParse{
    constructor(options){
        this.options = options;//接受用户输入的参数
        this.currentstate = 'begin';
        this.endstate = 'end';
        this.buffer = null;//用于缓存被TCP拆分的数据
        this.pos = 0;//指示当前解析的字符所在的位置
        this.long = 0;//指示当前的packet的长度
        this.sequence = 0;//指示当前的packet的序列号
        this.data = null;//指示当前的packet的数据
    }
    parse(data){
        if(this.buffer){
            this.buffer = Buffer.concat([this.buffer,data]);
        }else{
            this.buffer = data;
        }
        while(true){
            switch(this.currentstate){
                case 'begin':
                    if(!this.buffer){
                        return;
                    }
                    if(this.buffer[0] == BEFIN){
                        this.pos+=1;
                        this.currentstate = 'header';
                    }else{
                        //后面可以添加错误处理
                        return;
                    }
                case 'header':
                    if(this.buffer.byteLength < this.pos + HEADER){
                        return;
                    }else{
                        this.long = this.buffer.readUIntBE(this.pos, LENGTH);
                        this.sequence = this.buffer.readUIntBE(this.pos + LENGTH,SEQ);
                        this.pos += LENGTH + SEQ;
                        this.currentstate = 'data';
                    }
                case 'data':
                    const dataLength = this.long - LENGTH - SEQ;
                    if(this.buffer.byteLength < this.pos + dataLength){
                        return;
                    }else{
                        this.data = Buffer.alloc(dataLength);
                        this.buffer.copy(this.data,0,this.pos,this.pos+dataLength);
                        this.pos += dataLength;
                        this.currentstate = 'end';
                    }
                case 'end':
                    this.options.call(this.data.toString('utf8'));
                    this.buffer = this.buffer.slice(this.pos);//重新刷新缓冲区的内容
                    this.pos = 0;
                    this.long = 0;
                    this.sequence = 0;
                    this.data = null;
                    this.currentstate = 'begin';
                    break;
                default:
                    return;
            }
        }

    }
}

module.exports = {
    dopack,
    MyParse,
};