const videoElement = document.querySelector('video')
const startBtn = document.getElementById('startBtn')
const stopBtn = document.getElementById('stopBtn')
const videoSelectBtn = document.getElementById('videoSelectBtn')

const {
    desktopCapturer,
    remote
} = require('electron')

const {
    dialog,
    Menu
} = remote

//Global state
let mediaRecorder // MediaRecorder instance to capture footage
const recordChunks = []

//Buttons 
startBtn.onclick = e => {
    mediaRecorder.start();
    startBtn.classList.add('is-danger');
    startBtn.innerText = 'Recording';
};

stopBtn.onclick = e => {
    mediaRecorder.stop();
    startBtn.classList.remove('is-danger');
    startBtn.innerText = 'Start';
};

videoSelectBtn.onclick = getVideoSources


//Get the available video sources
async function getVideoSources() {
    const inputSources = await desktopCapturer.getSources({
        types: ['window', 'screen']
    })

    const videoOptionsMenu = Menu.buildFromTemplate(
        inputSources.map(source => {
            return {
                label: source.name,
                click: () => selectSource(source)
            }
        })
    )

    videoOptionsMenu.popup()
}

//change the videoSource window to record
async function selectSource(source) {
    videoSelectBtn.innerText = source.name

    const constraints = {
        // audio: false,
        audio: {
            mandatory: {
                echoCancellation: true, // doesn't do the work
                chromeMediaSource: 'desktop',
            }
        },
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                // chromeMediaSourceId: source.id
            }
        }
    }

    // Create a Stream
    const stream = await navigator.mediaDevices
        .getUserMedia(constraints)

    // Preview the source in a video element
    videoElement.srcObject = stream
    videoElement.play()

    //Create the Media Recorder
    const options = {
        mimeType: 'video/webm; codecs=vp9'
    }
    mediaRecorder = new MediaRecorder(stream, options)

    //Register event handlers
    mediaRecorder.ondataavailable = handleDataAvailable
    mediaRecorder.onstop = handleStop
}


//Capture all recorded chunks
function handleDataAvailable(e) {
    recordChunks.push(e.data)
    console.log('video data available')
}

const {
    writeFile
} = require('fs')

//Saves the video file on stop
async function handleStop(e) {
    const blob = new Blob(recordChunks, {
        type: 'video/webm; codecs=vp9'
    })

    const buffer = Buffer.from(await blob.arrayBuffer())

    const {
        filePath
    } = await dialog.showSaveDialog({
        buttonLabel: 'Save video',
        defaultPath: `vid-${Date.now()}.webm`
    })

    console.log(filePath)

    if (filePath) {
        writeFile(filePath, buffer, () => console.log('video saved successfully'))
    }
}