(() => {
  
  /**
   * WebRTCによるカメラアクセス
   */
  const video = document.getElementById('video')
  const canvas = document.getElementById('canvas')
  const ctx = canvas.getContext('2d')
  
  let isLoadedMetaData = false
//   let constraints = {audio: false, video: {}}
  let constraints = {audio: false, video: true}

  function start(){
    navigator.mediaDevices.getUserMedia( constraints )
      .then( mediaStrmSuccess )
      .catch( mediaStrmFailed )
  }

  function mediaStrmSuccess( stream ){
    video.srcObject = stream

    // ウェブカムのサイズを取得し、canvasにも適用
    if(isLoadedMetaData) return
    isLoadedMetaData = true

    video.addEventListener('loadedmetadata', () => {
      canvas.width = video.videoWidth      
      canvas.height = video.videoHeight
      requestAnimationFrame( draw )
    }, false)
  }

  function mediaStrmFailed( e ){
    console.log( e )
  }

  function stop(){
    let stream = video.srcObject
    let tracks = stream.getTracks()

    tracks.forEach( (track) => {
      track.stop()
    })
    video.srcObject = null
  }

  function draw(){
    scanQR()
    requestAnimationFrame( draw )
  }

  start()


  /**
   * ストリームのコントロール
   */
  const stopBtn = document.getElementById('stop')
  const frontBtn = document.getElementById('front')
  const rearBtn = document.getElementById('rear')
  let isRun = false

  let ua = navigator.userAgent
  if(ua.indexOf('iPhone') < 0 && ua.indexOf('Android') < 0 && ua.indexOf('Mobile') < 0 && ua.indexOf('iPad') < 0){
    frontBtn.disabled = true
    rearBtn.disabled = true
  }

  stopBtn.addEventListener('click', () => {
    if(!isRun){
      stop()
      stopBtn.textContent = 'START'
    }else{
      start()
      stopBtn.textContent = 'STOP'
    }
    isRun = !isRun
  }, false)

  frontBtn.addEventListener('click', () => {
    stop()
    constraints.video.facingMode = { exact: 'user' }
    setTimeout( () => {
      start()
    }, 500)
  }, false)

  rearBtn.addEventListener('click', () => {
    stop()
    constraints.video.facingMode = { exact: 'environment' }
    setTimeout( () => {
      start()
    }, 500)
  }, false)


  /**
   * QRコードスキャン
   */
  const outputTxt = document.querySelector('.output_txt')

  function scanQR(){
    ctx.drawImage( video, 0, 0 )
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height, {})

    if( code ){
      outputTxt.textContent = null
      // console.log('Found QR code', code.data)
      if(code.data.indexOf('http://') >= 0 || code.data.indexOf('https://') >= 0){
        // URLであればリンクタグで出力
        let a = document.createElement('a')
        a.href = code.data
        a.setAttribute('target', '_blank')
        a.textContent = code.data
        outputTxt.appendChild( a )
      }else{
        // それ以外はテキスト出力
        outputTxt.textContent = code.data
      }
    }
  }


})()