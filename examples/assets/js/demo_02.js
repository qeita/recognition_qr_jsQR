(() => {
  const video = document.getElementById('video')
  const canvas = document.getElementById('canvas')
  const startBtn = document.getElementById('start')

  const countElm = document.querySelector('.count')
  const scoreElm = document.querySelector('.score')

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

  const cellNum = split.num.w * split.num.h
  let scoreNum = 0
  let countNum = 30
  let timer = null
  let hitAreaIndex = Math.floor(Math.random() * cellNum)


  main()

  function main(){
    setScore(scoreNum)
    setCount(countNum)
    getMediaData()
    startBtn.addEventListener('click', () => {
      setRecordState()
    }, false)
  }

  /**
   * START/STOPボタンの切替、外部オーディオ取得/停止の切り替え
   */
  function setRecordState(){
    isRun = !isRun
    if(isRun){
      // startBtn.textContent = 'STOP'
      // getMediaData()
      startBtn.classList.add('is-none')
      scoreNum = 0
      countNum = 30
      setScore(scoreNum)
      setCount(countNum)  
      startCount()
    }else{
      // startBtn.textContent = 'START'
      // stop()
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
    drawLines()
    if(isRun){
      drawHitArea( hitAreaIndex )
      scanQR()
    }
  }

  function drawLines(){
    const lineArray = [
      {x1: split.size.w    , y1: 0           , x2: split.size.w    , y2: canvas.height},
      {x1: split.size.w * 2, y1: 0           , x2: split.size.w * 2, y2: canvas.height},
      {x1: 0               , y1: split.size.h, x2: canvas.width    , y2: split.size.h }
    ]

    function line(x1, y1, x2, y2){
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.closePath()
      ctx.stroke()
    }

    ctx.strokeStyle = '#555'
    ctx.lineWidth = 2

    for(let i = 0, cnt = lineArray.length; i < cnt; i++){
      line(
        lineArray[i].x1,
        lineArray[i].y1,
        lineArray[i].x2,
        lineArray[i].y2,
      )
    }
  }

  function setScore(n){
    scoreElm.textContent = n
  }

  function setCount(n){
    countElm.textContent = n
  }

  function startCount(){
    timer = setInterval( () => {
      countNum--
      setCount(countNum)
      if(countNum === 0){
        clearInterval(timer)
        isRun = false
        startBtn.classList.remove('is-none')
      }
    }, 1000)
  }

  function drawHitArea(n){
    const cIndex = n % split.num.w
    const rIndex = Math.floor(n / split.num.w)

    drawOverlay(
      split.size.w * cIndex,
      split.size.h * rIndex,
      split.size.w,
      split.size.h,
      '#0f0',
      0.4
    )
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
            drawOverlay(
              split.size.w * x,
              split.size.h * y,
              split.size.w,
              split.size.h,
              '#f00',
              0.4
            )
            console.log(split.num.w * y + x)
            if(hitAreaIndex === split.num.w * y + x){
              hitAreaIndex = Math.floor(Math.random() * cellNum)
              scoreNum += 10
              setScore(scoreNum)
            }
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
  function drawOverlay(x, y, w, h, color, alpha){
    ctx.globalAlpha = alpha
    ctx.fillStyle = color
    ctx.fillRect(x, y, w, h)    
  }


})()