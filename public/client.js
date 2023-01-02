const cio = io();
const myVideo = document.getElementById('my-video');
const remoteVideo = document.getElementById('remote-video');
const roomIdInput = document.getElementById('room-id');
let roomId
let localStream;
let remoteStream;
let rtcPeerConnection;
let isRoomCreated;
const constraint = {
    audio: false,
    video: { height: 300, width: 300 }
}

const iceServers = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        
],
}


//Event
cio.on("room_joined", async (roomId) => {
    await setLocalStream()
    cio.emit("start_call", roomId)
    
})

cio.on("start_call", async (roomId) => {
    if (isRoomCreated) {
        console.log("start call ",roomId);
        rtcPeerConnection = new RTCPeerConnection(iceServers)
        addLocalTrack(rtcPeerConnection)
        rtcPeerConnection.ontrack = setRemoteStream
        rtcPeerConnection.onicecandidate=sendIceCandidate
        await createOffer(rtcPeerConnection)  
    }
  

})

cio.on("webrtc_offer", async (event) => {
    console.log("webrtc_offer",event, isRoomCreated);
    if (!isRoomCreated) {
        rtcPeerConnection = new RTCPeerConnection(iceServers)
        addLocalTrack(rtcPeerConnection)
        rtcPeerConnection.ontrack = setRemoteStream
        rtcPeerConnection.onicecandidate=sendIceCandidate
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event))
        await createAnswer(rtcPeerConnection)
    }


})

cio.on("webrtc_answer", async (event) => {
    console.log("webrtc_answer",event);
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event))
    
})

cio.on("webrtc_ice_candidate",  (event) => {
    console.log("webrtc_ice_candidate",event);
    
    var candidate = new RTCIceCandidate({
        sdpMLineIndex: event.label,
        candidate: event.candidate
    })
    rtcPeerConnection.addIceCandidate(candidate)

})

cio.on("room_created", async()=>{
    await setLocalStream()
    isRoomCreated = true
})
//end Event


function joinRoom() {
    console.log("click");
    if (roomIdInput.value != '') {
        roomId = roomIdInput.value
        cio.emit("join", roomId)

    } else {
        alert("Room ID cannot be empty.");
    }
}

async function setLocalStream() {
    let stream;
    try {
        stream = await navigator.mediaDevices.getUserMedia(constraint)
    } catch (error) {
        console.log(error);
    }

    myVideo.srcObject = stream;
    myVideo.play();
    localStream = stream;

}

function addLocalTrack(rtcPeer) {
    localStream.getTracks().forEach(track => {
        rtcPeer.addTrack(track,localStream  )
    });
}

function setRemoteStream(event) {
    remoteVideo.srcObject = event.streams[0];
    remoteStream = event.stream;
    remoteVideo.play()
}

function sendIceCandidate (event){
    console.log("send ice candiate",event);
    if (event.candidate) {
        cio.emit("webrtc_ice_candidate",{
            roomId: roomId,
            label: event.candidate.sdpMLineIndex,
            candidate: event.candidate.candidate
        })
    }
   
}

async function createOffer(rtcPeerConnection) {
    let sessionDescription;
    try {
        sessionDescription = await rtcPeerConnection.createOffer();
        rtcPeerConnection.setLocalDescription(sessionDescription)

    } catch (error) {
        console.log(error);
    }

    cio.emit('webrtc_offer',{
        type:'webrtc_offer',
        sdp: sessionDescription,
        roomId: roomId
    })
}
async function createAnswer(rtcPeer) {
    let sessionDescription;
    try {
        sessionDescription = await rtcPeerConnection.createAnswer();
        rtcPeer.setLocalDescription(sessionDescription)
    } catch (error) {
        console.log(error);
    }

    cio.emit('webrtc_answer',{
        type:'webrtc_answer',
        sdp: sessionDescription,
        roomId: roomId
    })
}