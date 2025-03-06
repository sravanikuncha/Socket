const express=require('express');
const mongoose=require('mongoose');
const cors=require('cors');
const http = require('http');
const socketIo = require('socket.io');

const app=express();
const chatRouter=require('./chat.controller');
const messageRouter=require('./message.controller')
const groupRouter=require('./group.controller')
const onlineUserModel=require('./onlineuser.model');

app.use(express.json());
app.use(cors())
app.use('/api/chat',chatRouter);
app.use('/api/messages',messageRouter);
app.use('/api/groups',groupRouter);

const connectToMongoDB=()=>{
  mongoose
.connect("mongodb+srv://kunchasravani:mgDhI1VO1OXej4ZE@cluster0.6a2fs.mongodb.net/Doppular")
.then(() => console.log("Connected to mongodb..."))
.catch((err) => console.error("Could not connect to mongodb ..." + err));
}

const server = http.createServer(app);
const io = socketIo(server,{
  cors: {
     origin: '*'
  }
});

io.on('connection',(socket)=>{
  console.log('cient connected '+socket.id);

  socket.on('saveUser',async (loginData)=>{
      loginData.loginProfileId && await onlineUserModel.findOneAndUpdate({loginProfileId:{$eq:loginData.loginProfileId}},loginData,{upsert: true});
  });

  socket.on('sendMessage',async(messageData)=>{
    //get targetuserId socketId from onlineUsers if user is present.
    const otherUserid=messageData.otherProfileId;
    console.log(otherUserid);
    const socketData=await onlineUserModel.find({loginProfileId:{ $in:otherUserid}});
    if(socketData==null){
      console.log("other userid offline");
    }else{
      const socketIds=socketData.map((eachSocketData)=>eachSocketData.socket)
      console.log(socketIds)
      io.to(socketIds).emit('getMessage', messageData.message);
    }
  })


  socket.on('disconnect',async ()=>{
    console.log('client disconnected '+socket.id);
    const deleteRepsonse=await onlineUserModel.findOneAndDelete({socket:socket.id});
    console.log('user went offline')
  });

 
})



server.listen(9000,()=>{
    console.log('Listening to socket programming test  server');
    connectToMongoDB();
})