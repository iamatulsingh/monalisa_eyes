import "./style.css";
import * as blazeface from '@tensorflow-models/blazeface';
import * as tf from '@tensorflow/tfjs';
import * as tfjsWasm from '@tensorflow/tfjs-backend-wasm';

tfjsWasm.setWasmPaths("./assets/tfjs-backend-wasm.wasm");

import { library, icon, dom } from '@fortawesome/fontawesome-svg-core';
import { faCoffee, faUserCircle } from '@fortawesome/free-solid-svg-icons'
import { faTwitterSquare, faGithub } from '@fortawesome/free-brands-svg-icons';

library.add(faTwitterSquare, faGithub, faCoffee, faUserCircle);

dom.watch();

const heightRatio = 0.33603092783;
const headTopRatio = 0.11002474226;

const marginLeftRatio = 0.30577839955;
const isMobile = (/Mobi/.test(navigator.userAgent));

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const camWidthRatio = 0.2;

let model, ctx, videoWidth, videoHeight, video, canvas;

let images = [];
let image_paths = [];

for (let i = 0; i <= 32; i++) {
  image_paths.push(`./assets/frames/frame_${i}.jpg`)
}

function preload(image_list) {
    for (var i = 0; i < image_list.length; i++) {
        images[i] = new Image();
        images[i].src = image_list[i];
    }
}

const state = {
  backend: 'wasm'
};

async function setupCamera() {
  video = document.getElementById('cam');

  const stream = await navigator.mediaDevices.getUserMedia({
    'audio': false,
    'video': { facingMode: 'user' },
  });
  video.srcObject = stream;

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
}


const map = (value, x1, y1, x2, y2) => (value - x1) * (y2 - x2) / (y1 - x1) + x2;

const oldImage = document.querySelector("#deepFakeImage");
let eye;

function moveEyes(leftEye, rightEye) {
    if (leftEye && rightEye) {
      eye = (leftEye + rightEye) / 2;
    } else if (leftEye < 0) {
      eye = rightEye;
    } else if (rightEye > video.width) {
      eye = leftEye
    }
    let headPos = Math.floor(map(eye, 0, video.width, 0, 32));
    headPos = Math.min(Math.max(headPos, 0), 32);
    if (!isNaN(headPos)) {
        const newImage = document.createElement("IMG");
        const ID = document.createElement("id");
        oldImage.src =  './assets/frames/frame_' + headPos + '.jpg';
    }
}


const renderPrediction = async () => {
  resizeItems();
  const returnTensors = false;
  const flipHorizontal = true;
  const annotateBoxes = true;
  const predictions = await model.estimateFaces(video, returnTensors, flipHorizontal, annotateBoxes);

  if (predictions.length > 0) {
    const landmarks = predictions[0].landmarks;
    const midEye = (landmarks[0][0] + landmarks[1][0]) / 2;
    moveEyes(landmarks[0][0], landmarks[1][0]);
  }

  setTimeout(function () {
    requestAnimationFrame(renderPrediction)
  }, 40);
};

const setupPage = async () => {
  resizeItems();
  await tf.setBackend(state.backend);
  await setupCamera();

  videoWidth = video.videoWidth;
  videoHeight = video.videoHeight;
  video.width = videoWidth;
  video.height = videoHeight;
  video.style.cssText = "-moz-transform: scale(-1, 1); \
    -webkit-transform: scale(-1, 1); -o-transform: scale(-1, 1); \
    transform: scale(-1, 1); filter: FlipH;";

  video.setAttribute('autoplay', '');
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.play();

  const cam = document.querySelector("#cam");
  cam.style.width = monaLisaWithFrame.width * camWidthRatio + "px";
  cam.style.height = "400px";

  model = await blazeface.load();

  renderPrediction();
};


const resizeItems = async() => {

  const monaLisaWithFrame = document.querySelector("#monaLisaWithFrame");

  if (isMobile) {
    monaLisaWithFrame.style.height = document.documentElement.clientHeight - 600 + "px";
  } else {
    monaLisaWithFrame.style.height = window.innerHeight + "px";
  }

  const paintingItems = document.querySelector("#paintingItems");
  const deepFakeImage = document.querySelector("#deepFakeImage");
  deepFakeImage.style.height = monaLisaWithFrame.offsetHeight *  heightRatio + "px";
  /* Figure out the positioning of the deep fake */
  deepFakeImage.style.marginTop = monaLisaWithFrame.clientHeight * headTopRatio +   "px";
  // Calculate the margin left with respect to the width of the picture
  deepFakeImage.style.marginLeft = monaLisaWithFrame.width * marginLeftRatio  + "px";
}

window.addEventListener('resize', resizeItems);



// Pre-fetch all of the images for a smoother experience
preload(image_paths);
setupPage();
