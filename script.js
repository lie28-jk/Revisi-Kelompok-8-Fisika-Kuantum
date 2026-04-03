const h = 6.626e-34
const scaleFactor = 200

const massSlider = document.getElementById("massSlider")
const velocitySlider = document.getElementById("velocitySlider")
const massInput = document.getElementById("massInput")

const massValue = document.getElementById("massValue")
const velocityValue = document.getElementById("velocityValue")

const momentumValue = document.getElementById("momentumValue")
const lambdaValue = document.getElementById("lambdaValue")

const particleSelect = document.getElementById("particleSelect")

const playBtn = document.getElementById("playBtn")
const pauseBtn = document.getElementById("pauseBtn")
const resetBtn = document.getElementById("resetBtn")
const compareBtn = document.getElementById("compareBtn")

const canvas = document.getElementById("waveCanvas")
const ctx = canvas.getContext("2d")

// DATA PARTIKEL (REAL)
const particles = {
  electron: 9.11e-31,
  proton: 1.67e-27,
  neutron: 1.67e-27
}

function resizeCanvas(){
  canvas.width = canvas.offsetWidth
  canvas.height = canvas.offsetHeight
}

window.addEventListener("resize",resizeCanvas)
resizeCanvas()

let animationRunning = true
let phase = 0
let particleX = 0
let compareMode = false

const audioCtx = new (window.AudioContext || window.webkitAudioContext)()

function playClick(){
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()

  osc.connect(gain)
  gain.connect(audioCtx.destination)

  osc.frequency.value = 600
  gain.gain.value = 0.05

  osc.start()
  osc.stop(audioCtx.currentTime + 0.05)
}

// ================= CHART =================
const chartCtx = document.getElementById("lambdaChart").getContext("2d")

const lambdaChart = new Chart(chartCtx,{
  type:"line",
  data:{
    labels:[],
    datasets:[
      {
        label:"Kurva λ = h/p",
        data:[],
        borderWidth:2,
        pointRadius:0,
        tension:0.35
      },
      {
        label:"Momentum saat ini",
        data:[],
        pointRadius:6,
        showLine:false
      }
    ]
  },
  options:{
    animation:false,
    responsive:true,
    plugins:{
      legend:{position:"top"}
    },
    scales:{
      x:{title:{display:true,text:"Momentum (p)"}},
      y:{title:{display:true,text:"Panjang Gelombang"}}
    }
  }
})

// ================= HITUNG =================
function calculate(){

  let m = parseFloat(massInput.value)
  let v = parseFloat(velocitySlider.value)

  if(isNaN(m) || m <= 0) m = 0.1

  let p = m * v
  if(p === 0) p = 0.0001

  let lambda = h / p
  let lambdaVisual = scaleFactor / p

  massValue.textContent = m.toFixed(2)
  velocityValue.textContent = v
  momentumValue.textContent = p.toExponential(3)
  lambdaValue.textContent = lambda.toExponential(3)

  updateChart(p,lambdaVisual)

  return lambdaVisual
}

// ================= CHART UPDATE =================
function updateChart(currentP,currentLambda){

  let labels=[]
  let curveData=[]

  for(let p=0.1;p<=100;p+=1){
    labels.push(p.toFixed(1))
    curveData.push(scaleFactor/p)
  }

  lambdaChart.data.labels = labels
  lambdaChart.data.datasets[0].data = curveData

  lambdaChart.data.datasets[1].data = [{
    x:currentP,
    y:currentLambda
  }]

  lambdaChart.update()
}

// ================= GRID =================
function drawGrid(){
  let gridSize = 40

  ctx.strokeStyle = "#e2e8f0"
  ctx.lineWidth = 1

  for(let x=0;x<canvas.width;x+=gridSize){
    ctx.beginPath()
    ctx.moveTo(x,0)
    ctx.lineTo(x,canvas.height)
    ctx.stroke()
  }

  for(let y=0;y<canvas.height;y+=gridSize){
    ctx.beginPath()
    ctx.moveTo(0,y)
    ctx.lineTo(canvas.width,y)
    ctx.stroke()
  }
}

// ================= WAVE =================
function drawWave(lambdaVisual){

  ctx.clearRect(0,0,canvas.width,canvas.height)
  drawGrid()

  let amplitude = 50

  ctx.beginPath()
  ctx.strokeStyle = "#000"

  for(let x=0;x<canvas.width;x++){
    let y = canvas.height/2 + Math.sin((x*0.02/lambdaVisual)+phase)*amplitude
    ctx.lineTo(x,y)
  }

  ctx.stroke()

  particleX += 2

  let particleY = canvas.height/2 + Math.sin((particleX*0.02/lambdaVisual)+phase)*amplitude

  ctx.beginPath()
  ctx.fillStyle = "black"
  ctx.arc(particleX,particleY,8,0,Math.PI*2)
  ctx.fill()

  if(compareMode){
    drawCompareWaves()
  }
}

// ================= COMPARE =================
function drawCompareWaves(){

  let v = parseFloat(velocitySlider.value)

  let electronMass = particles.electron
  let protonMass = particles.proton

  let pE = electronMass * v
  let pP = protonMass * v

  let lambdaE = 200 / pE
  let lambdaP = 200 / pP

  let ampE = 40
  let ampP = 20

  ctx.strokeStyle = "#3b82f6"
  ctx.beginPath()
  for(let x=0;x<canvas.width;x++){
    let y = canvas.height*0.3 + Math.sin((x*0.002/lambdaE)+phase)*ampE
    ctx.lineTo(x,y)
  }
  ctx.stroke()

  ctx.strokeStyle = "#ef4444"
  ctx.beginPath()
  for(let x=0;x<canvas.width;x++){
    let y = canvas.height*0.7 + Math.sin((x*0.02/lambdaP)+phase)*ampP
    ctx.lineTo(x,y)
  }
  ctx.stroke()

  ctx.fillStyle = "#3b82f6"
  ctx.fillText("Elektron (λ besar)",10,20)

  ctx.fillStyle = "#ef4444"
  ctx.fillText("Proton (λ kecil)",10,canvas.height-10)
}

// ================= ANIMATE =================
function animate(){

  if(animationRunning){
    let lambdaVisual = calculate()
    drawWave(lambdaVisual)
    phase += 0.05
  }

  requestAnimationFrame(animate)
}

// ================= EVENT =================

// SLIDER → INPUT
massSlider.addEventListener("input", () => {
  massInput.value = massSlider.value
  calculate()
})

// INPUT → SLIDER
massInput.addEventListener("input", () => {
  massSlider.value = massInput.value
  calculate()
})

// VELOCITY
velocitySlider.addEventListener("input", calculate)

// PARTIKEL
particleSelect.addEventListener("change", function(){

  if(this.value !== "custom"){
    massInput.value = particles[this.value]
    massSlider.value = 1 // biar aman visual
  }

  calculate()
})

// BUTTON
playBtn.addEventListener("click",()=>{
  playClick()
  animationRunning = true
})

pauseBtn.addEventListener("click",()=>{
  playClick()
  animationRunning = false
})

resetBtn.addEventListener("click",()=>{

  playClick()

  massSlider.value = 1
  velocitySlider.value = 10
  massInput.value = 1

  particleSelect.value = "custom"

  phase = 0
  particleX = 0

  calculate()
})

compareBtn.addEventListener("click",()=>{
  playClick()
  compareMode = !compareMode
})

// START
calculate()
animate()
