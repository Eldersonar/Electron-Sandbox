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



    //with audio set to false I can record and save video with no problem, however, when I include audio I get echo. 
    //Audio won't work on Mac machines due to OS restricitons.
    // const constraints = {
    //     // audio: true,
    //     audio: {
    //         mandatory: {
    //             chromeMediaSource: 'desktop',
    //         }
    //     },
    //     video: {
    //         mandatory: {
    //             chromeMediaSource: 'desktop',
    //             // chromeMediaSourceId: source.id
    //         }
    //     }
    // }

    let constraints = {
        audio: {
            mandatory: {
                chromeMediaSource: 'desktop',
            }

            // deviceId: "default"
            // mandatory: {
            //     chromeMediaSource: '',
            // },
            // mandatory: {
            //     // echoCancellation: true,
            //     // deviceId: "default",
            //     // latency: false
            // }
        },
        // audio: true,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id
            }
        }
        // video: true
    }

    console.log(await desktopCapturer.getSources({
        types: ['window']
    }));

    // Create a Stream
    let stream
    try {
        stream = await navigator.mediaDevices
            .getUserMedia(constraints)
    } catch (e) {
        console.log(e)
        console.log('nothing')
    }


    console.log(navigator.mediaDevices.enumerateDevices());
    console.log(navigator.mediaDevices.getSupportedConstraints())

    // Preview the source in a video element
    videoElement.srcObject = stream
    videoElement.muted = true
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