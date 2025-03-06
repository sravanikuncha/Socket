import logo from './logo.svg';
import './App.css';
import {useEffect,useState,useRef} from 'react'
import axios from 'axios'
import io from 'socket.io-client';
// import { ChatArea } from './ChatArea';

const loggedInProfileId=prompt('enter logged in profileId')

// export const loggedInProfileId="67bdb971d84a483a1825bb96"


function App() {

  const [userChats,setUserChats]=useState([]);
  const [individualChat,setIndividualChat]=useState("");
  const [messages,setMessages]=useState([]);
  const textMsg=useRef("");
  const [socket,setSocket]=useState(null);

  useEffect(()=>{

    const socket=io('http://localhost:9000');

    setSocket(socket);
    socket.on('connect', () => {
      console.log('Connected to server'+socket.id);
      socket.emit('saveUser',{"loginProfileId":loggedInProfileId,"socket":socket.id})

    });

    socket.on('getMessage',(message)=>{
      console.log('message received',message);
      console.log(messages);
      setMessages((messages)=>[...messages,message]);
    })

    socket.on('disconnect', () => {
      console.log('Disconnected from server'+socket.id);
    });
  },[]);


  useEffect(()=>{
    async function getUserChats(){
      const apiEndpoint = 'http://localhost:9000/api/chat/getChats';
      const params = new URLSearchParams({
        profileId: loggedInProfileId
      });
      //profileId of user logged in sravani
      await axios.get(`${apiEndpoint}?${params.toString()}`)
      .then(response => {
        const result=response.data?.response;
        const chatIds=result.map((eachResult)=>eachResult);
        setUserChats(chatIds);
      })
      .catch(error => {
        console.error(error);
      });
    }
     getUserChats();
  },[]);




  const createChat=async ()=>{
    //firstId profileId of sravani
    //secondId profileId of others
    const otherProfileId=prompt('other profileId to whome you want to chat')
    const result = await axios.post('http://localhost:9000/api/chat/createChat',{
      "firstId": loggedInProfileId,
      "secondId": otherProfileId,
    });
    if(result?.data?.success && !userChats.includes(result.data.response._id)){
      setUserChats([...userChats,result.data.response]);
    }
    console.log(result.data);
  }

  const createGroup=async()=>{
    let otherProfileIds=prompt('other profileIds to whome you want to create a group');
    console.log(otherProfileIds);
    if(otherProfileIds && otherProfileIds.split(',').length==1){
      alert('minimum 2 groupsids')
      otherProfileIds=prompt('other profileIds to whome you want to create a group');
    }
    if(otherProfileIds){
    const groupName=prompt('Enter GroupName');
    const groupDescription=prompt('Enter Group Description');
    const groupImage=prompt('Enter Group Image');

    const result = await axios.post('http://localhost:9000/api/groups/createGroup',{
      "firstId": loggedInProfileId,
      "secondId": otherProfileIds.split(','),
      "groupName":groupName,
      "groupDescription":groupDescription,
      "groupImage":groupImage
    });
    if(result?.data?.success && !userChats.includes(result.data.response._id)){
      setUserChats([...userChats,result.data.response]);
    }
    console.log(result?.data);
  }

  }

  const openChat=async(eachUserChat)=>{
    
    const apiEndpoint = 'http://localhost:9000/api/messages/getMessages';
    
    const params = new URLSearchParams({
      chatId: eachUserChat._id
    });
    //profileId of user logged in sravani
   await axios.get(`${apiEndpoint}?${params.toString()}`) .then(response => {
    const result=response.data?.response;
    setIndividualChat(eachUserChat);
    const msgs=result.map((eachRes)=>eachRes.message)
    setMessages([...msgs]);
  })
  .catch(error => {
    console.error(error);
  });
    
}

  const sendMessage=async (individualChat)=>{
    try{
        const response=await axios.post('http://localhost:9000/api/messages/createMessage',{
            "chatId":individualChat._id ,
            "senderId": loggedInProfileId,
            "message":textMsg.current.value
        });
        console.log(response);
        if(response.data.success){
            console.log('send Message success');
            const otherProfileId=individualChat.members.filter((eachmember)=>eachmember!=loggedInProfileId);
            socket.emit('sendMessage',{"message":textMsg.current.value,"otherProfileId":otherProfileId})
            setMessages([...messages,textMsg.current.value]);
        }
    }catch(err){
        console.log(err)
        console.log("send message failed")
    }
}
  

  return (
    <div className="App">
      <button onClick={createChat}>Create Chat</button>
      <button onClick={createGroup}>Create Group</button>
      <ul>
       {userChats.map((eachUserChat,index)=><li  key={index}> <button onClick={()=>openChat(eachUserChat)}>{eachUserChat._id}</button></li>)}
      </ul>
      <br/>
      <hr/>
      {individualChat &&   <div>
            <div style={{width:"80%", height:"50vh",border:"2px solid black"}}>
            <ol>
                {messages.map((eachtext ,index)=><li key={index}>{eachtext}</li>)}
            </ol>
            </div>
            <textarea style={{border:"2px solid red"}} ref={textMsg}></textarea>
            <button onClick={()=>sendMessage(individualChat)}>Send</button>
        </div>}
    </div>
  );
}

export default App;
