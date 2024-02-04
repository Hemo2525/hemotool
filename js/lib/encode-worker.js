
let fileWritableStream = null;
let frameReader = null;
let muxer = null;
let videoEncoder = null;
let audioEncoder = null;

let recording = false;


async function startRecording(fileHandle, frameStream, trackSettings, importUrl, audioStream, videoBitrate) {

  let frameCounter = 0;
  importScripts(importUrl);

  // ファイルハンドルから書き込みストリームを取得
  fileWritableStream = await fileHandle.createWritable();


  //let audioSampleRate = audioTrack?.getCapabilities().sampleRate.max;


console.log("映像ビットレート：" + videoBitrate);
  
  

	// Create an MP4 muxer with a video track and maybe an audio track
	muxer = new Mp4Muxer.Muxer({
		//target: new Mp4Muxer.ArrayBufferTarget(),
    target: new Mp4Muxer.FileSystemWritableFileStreamTarget(fileWritableStream), 

		video: {
      //codec: 'avc' | 'hevc' | 'vp9' | 'av1',
			//codec: 'vp9',
      codec: 'avc',
			width: trackSettings.width,
			height: trackSettings.height
		},

    audio: {
      
			codec: 'aac',
			sampleRate: 48000,
			numberOfChannels: 2
    
     /*
      codec: "opus",
      sampleRate: 48000,
      numberOfChannels: 2,
      */
		},
  
    /*
		audio: audioTrack ? {
			codec: 'aac',
			sampleRate: 44100,
			numberOfChannels: 1
		} : undefined,
    */

		fastStart: false,

    // メディアストリームトラックのデータを直接挿入しているため、これはタイムスタンプが 0 から始まらないことを考慮しています。
		// Because we're directly pumping a MediaStreamTrack's data into it, which doesn't start at timestamp = 0
		firstTimestampBehavior: 'offset'
	});

	videoEncoder = new VideoEncoder({
		output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
		error: e => console.error(e)
	});
	videoEncoder.configure({
    codec: 'avc1.42001f',
    //codec: 'vp09.00.10.08',
    width: trackSettings.width,
    height: trackSettings.height,
		//bitrate: 1e6,
    //bitrate: 2_000_000, // 2 Mbps
    //bitrate: 5_000_000, // 5 Mbps
    bitrate: Number(videoBitrate.replace(/_/g, '')), // 文字列の"X_0000_000" を X000000 に変換
    //bitrate: 1_000_000, // 1 Mbps
    framerate: 60,
	});


  let audioConfig = {
  
    codec: 'mp4a.40.2',
    numberOfChannels: 2,
    sampleRate: 48000,
    bitrate: 128000
  
   /*
    codec: "mp4a.40.2",
    aac: { format: 'adts' },
    sampleRate: 48000,
    bitrate: 128000,
    numberOfChannels: 1
    */
   /*
    codec: "opus",
    sampleRate: 48000,
    numberOfChannels: 2,
    bitrate: 128_000, // 128 kbps
    */
  };

  let support = await AudioEncoder.isConfigSupported(audioConfig);
  console.assert(support.supported);

  audioEncoder = new AudioEncoder({
    output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
    error: e => console.error(e)
  });
  audioEncoder.configure(audioConfig);



  let consumer = new WritableStream({
    write(audioData) {
      //console.log('Audio Writable-------------');
      if (recording) {
        audioEncoder.encode(audioData);
        audioData.close();
      }
    },

    // --- その他のイベント ---
    start() {
      console.log('Audio Writable start-------------');
    },
    close() {
      console.log('Audio Writable close-------------');
    },
    abort(reason) {
      console.log('-------------Audio Writable abort:', reason);
    },
  });
  //trackProcessor.readable.pipeTo(consumer);
  audioStream.pipeTo(consumer);






	recording = true;



  frameReader = frameStream.getReader();
  frameReader.read().then(
    async function processFrame({ done, value }) {
      let frame = value;

      //console.log("aaa");

      if (done) {
        //console.log("bbb");
        await audioEncoder.flush();
        audioEncoder = null;
        
        await videoEncoder.flush();
        videoEncoder = null;
        //videoEncoder?.close();
        
        await muxer.finalize();
        muxer = null;
        await fileWritableStream.close();
        fileWritableStream = null;
        //console.log("ccc");
        self.postMessage("finish");
        return;
      }

      if (videoEncoder.encodeQueueSize <= 30) {
        if (++frameCounter % 20 == 0) {
          console.log(frameCounter + ' frames processed');
        }

        const insert_keyframe = (frameCounter % 150) == 0;
        videoEncoder.encode(frame, { keyFrame: insert_keyframe });
      } else {
        console.log('dropping frame, encoder falling behind');
      }

      frame.close();
      frameReader.read().then(processFrame);
  });




}


async function stopRecording() {
	recording = false;
	
  //console.log("a");
  await frameReader.cancel();

  frameReader = null;
  //console.log("b");
	//await videoEncoder?.flush(); // Doneで処理するのでここでやらない
	//await audioEncoder?.flush();
	//muxer.finalize();
  //console.log("c");
	//videoEncoder = null;
	//audioEncoder = null;
	//muxer = null;
	
	//firstAudioTimestamp = null;

  //console.log("e");
  
  //self.postMessage("finish");
}

self.addEventListener('message', function (e) {
  switch (e.data.type) {
    case "start":
      startRecording(e.data.fileHandle, e.data.frameStream, e.data.trackSettings, e.data.importUrl, e.data.audioStream, e.data.videoBitrate);
      //startRecording(e.data.fileHandle, e.data.frameStream, e.data.trackSettings, e.data.importUrl);
      break;
    case "stop":
      stopRecording();
      break;
  }
});





