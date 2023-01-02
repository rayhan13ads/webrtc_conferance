const express = require('express');
const app = express();
const server =require('http').createServer(app);


const io = require("socket.io")(server)

app.use('/',express.static("public"));

io.on("connection",(socket)=>{
    console.log("Client connected" + socket.id );

    socket.on("join",async (roomId)=>{
        console.log("Join roomId",roomId,socket.id);
        const roomClients = io.sockets.adapter.rooms.get(roomId) != undefined ? io.sockets.adapter.rooms.get(roomId).size : 0
        const numberOfClients = roomClients
        console.log(`number of clients is ${numberOfClients}`);

        if (numberOfClients == 0) {
            //room created
            console.log(`creating room ${roomId} and emtting room_create socket event`);
            await socket.join(roomId)
            socket.emit('room_created',roomId)
            console.log(io.sockets.adapter.rooms.get(roomId).size);
        }else if (numberOfClients == 1){
            //room joining
            console.log(`Joining room ${roomId} and emtting room_joined socket event`);
           await socket.join(roomId)
            socket.emit("room_joined",roomId);
        }else{
            console.log(`can't join room ${roomId}, emitting full_room socket event`);
            socket.emit('full_room',roomId);
        }
       
    })

    socket.on("start_call",(roomId)=>{
        socket.broadcast.to(roomId).emit("start_call",roomId) 
    })
    
    socket.on("webrtc_offer",(event)=>{
        socket.broadcast.to(event.roomId).emit("webrtc_offer",event.sdp) 
    })
 
    socket.on("webrtc_answer",(event)=>{
        socket.broadcast.to(event.roomId).emit("webrtc_answer",event.sdp) 
    })
 
    socket.on("webrtc_ice_candidate",(event)=>{
        socket.broadcast.to(event.roomId).emit("webrtc_ice_candidate",event) 
    })
})

server.listen(3000,()=>{
    console.log("Server is running at 3000");
})