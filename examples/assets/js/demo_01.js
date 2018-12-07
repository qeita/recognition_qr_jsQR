(() => {
  const video = document.getElementById('video')
  const canvas = document.getElementById('canvas')
  const recordBtn = document.getElementById('record')

//   const medias = {audio: false, video: {}}
  const medias = {audio: true, video: {}}
  let localMediaStream = null
  let isRun = false

  const ctx = canvas.getContext('2d')
  const videoSize = {w: 0, h: 0, aspect: 0}
  const split = {
    num: {
      w: 3, h: 2
    },
    size: {
      w: 0, h: 0
    }
  }


  main()

  function main(){
    // getMediaData()
    recordBtn.addEventListener('click', () => {
      setRecordState()
    }, false)
  }

  /**
   * START/STOPボタンの切替、外部オーディオ取得/停止の切り替え
   */
  function setRecordState(){
    isRun = !isRun
    if(isRun){
      recordBtn.textContent = 'STOP'
      getMediaData()
    }else{
      recordBtn.textContent = 'START'
      stop()
    }
  }

  /**
   * オーディオデバイスのアクセス
   */
  function getMediaData(){
    navigator.mediaDevices.getUserMedia(medias)
      .then( mediaStreamSuccess )
      .catch( mediaStreamFailed )
  }

  /**
   * オーディオデバイスアクセス成功時のコールバック
   * @param {object} stream - ストリーム情報 
   */
  function mediaStreamSuccess(stream){
    localMediaStream = stream
    video.srcObject = localMediaStream

    window.addEventListener('resize', () => {
      setSize()
    }, false)

    video.addEventListener('loadedmetadata', () => {
      videoSize.w = video.videoWidth
      videoSize.h = video.videoHeight
      videoSize.aspect = videoSize.w / videoSize.h
      setSize()

      requestAnimationFrame( draw )
    }, false)
  }

  /**
   * オーディオデバイスアクセス失敗時のコールバック
   * @param {object} err - エラー情報
   */
  function mediaStreamFailed(err){
    console.log(err)
  }

  /**
   * オーディオ取得停止
   */
  function stop(){
    const stream = video.srcObject
    const tracks = stream.getTracks()

    tracks.forEach( (track) => {
      track.stop()
    })
    baseVal = 0
    video.srcObject = null
  }

  /**
   * Canvasサイズ設定(ウェブカム映像をそのまま投影する場合に使用)
   */
  function setSize(){
    // const _aspect = window.innerWidth / window.innerHeight

    // if(_aspect >= videoSize.aspect){
    //   canvas.width = window.innerWidth
    //   canvas.height = Math.floor(canvas.width * videoSize.h / videoSize.w) // cW : cH = vW: vH
    // }else{
    //   canvas.height = window.innerHeight
    //   canvas.width = Math.floor(canvas.height * videoSize.w / videoSize.h) // cW : cH = vW: vH
    // }
    canvas.width = videoSize.w
    canvas.height = videoSize.h

    // https://stackoverflow.com/questions/47742208/horizontally-flipping-getusermedias-webcam-image-stream
    // ctx.translate(canvas.width, 0)
    // ctx.scale(-1, 1)
    setSplitSize()
  }

  /**
   * jsQRの測定領域サイズを計算
   */
  function setSplitSize(){
    split.size.w = Math.floor(canvas.width / split.num.w)
    split.size.h = Math.floor(canvas.height / split.num.h)
  }

  function draw(){
    drawCanvas()
    requestAnimationFrame( draw )
  }


  function drawCanvas(){
    ctx.globalAlpha = 1
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    scanQR()
  }

  /**
   * jsQRによるQRコードスキャン
   */
  function scanQR(){
    for(let y = 0; y < split.num.h; y++){
      for(let x = 0; x < split.num.w; x++){
        const imageData = ctx.getImageData(
          split.size.w * x,
          split.size.h * y,
          split.size.w,
          split.size.h
        )
        const code = jsQR(imageData.data, imageData.width, imageData.height, {})
    
        if( code ){
          // console.log('Found QR code', code.data)
          if(code.data.indexOf('http://') >= 0 || code.data.indexOf('https://') >= 0){
            console.log(code.data)
            drawOverlay(split.size.w * x, split.size.h * y, split.size.w, split.size.h)
          }
        }    
      }
    }
  }

  /**
   * 検出した領域を透過塗りつぶし
   * @param {number} x - x座標
   * @param {number} y - y座標
   * @param {number} w - 幅
   * @param {number} h - 高さ 
   */
  function drawOverlay(x, y, w, h){
    ctx.globalAlpha = 0.4
    ctx.fillStyle = '#f00'
    ctx.fillRect(x, y, w, h)    
  }


})()