// settings

let config = {
    nFrequencies: 192,
    nRows: 12,
    orbitRange: 20,
    orbitSpeed: 0.1 * Math.PI / 180
};

// globals
let scene,
    renderer,
    camera,
    controls,
    audio,
    geometries = [],
    cameraAngle = 0,
    orbitSpeed = config.orbitSpeed,
    orbitRange = config.orbitRange;

function initScene() {
    scene = new THREE.Scene();
    renderer = new THREE.WebGLRenderer({ alpha: true });

    renderer.setClearColor(0x000);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
}

function initGeometries() {
    let xStart = -10;

    let i = 0, x = xStart, z = 0,
        nCols = config.nFrequencies / config.nRows, rowSize = 0;
    while (i < config.nFrequencies) {
        let geometry = new THREE.SphereBufferGeometry(0.5, 100, 100);
        let material = new THREE.MeshLambertMaterial({ color: 0x777777 });
        geometries[i] = new THREE.Mesh(geometry, material);
        if (rowSize >= nCols) {
            rowSize = 0;
            z += 1.3;
            x = xStart;
        }
    
        geometries[i].position.x = x += 1.3;
        geometries[i].position.z = z;
        scene.add(geometries[i]);
        i++;
        rowSize++;
    
    }
}

function initCamera() {
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.lookAt(geometries[Math.floor(geometries.length / 2)]);

    camera.position.z = 20;
    camera.position.x = 20;
    camera.position.y = 10;

    controls = new THREE.OrbitControls(camera, renderer.domElement);
}

function initLighting() {
    let light = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(light);

    let light1 = new THREE.DirectionalLight(0xffffff, 1); // soft white light
    light1.target = geometries[0];
    scene.add(light1);
    light1.position.z = 10;
    light1.position.y = 10;

    let light2 = new THREE.DirectionalLight(0xffffff, 1); // soft white light
    light2.target = geometries[geometries.length - 1];
    scene.add(light2);
    light2.position.z = 10;
    light2.position.y = 10;
} 

function initMp3Player() {
    audio = new Audio();
    audio.src = 'music/shaolin-dub-war.mp3';
    // audio.src = 'music/chad-crouch-american-wigeon.mp3';
    audio.controls = true;
    audio.loop = true;
    audio.autoplay = true;

    document.getElementById('mp3').appendChild(audio);
    context = new AudioContext(); // AudioContext object instance
    analyser = context.createAnalyser(); // AnalyserNode method
    // Re-route audio playback into the processing graph of the AudioContext
    source = context.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(context.destination);
}

function frameLooper() {
    requestAnimationFrame(frameLooper);
    const fbc_array = new Uint8Array(config.nFrequencies);
    analyser.getByteFrequencyData(fbc_array);

    let max = Math.max(...fbc_array), // TODO: optimize?
        min = Math.min(...fbc_array),
        range = max - min;

    geometries.forEach((geometry, i) => {
        let scale = fbc_array[i] / 30;
        geometry.position.y = scale;
        geometry.material.color = new THREE.Color(
            remap(fbc_array[i], min, max, 0.3, 0.8),
            remap(fbc_array[i], min, max, 0.1, 0.5),
            remap(fbc_array[i], min, max, 0.3, 0.6)
        );
    });

    cameraAngle += orbitSpeed;
    camera.position.x = Math.cos(cameraAngle) * orbitRange;
    camera.position.y = Math.sin(cameraAngle) * orbitRange;
    camera.position.z = Math.sin(cameraAngle) * orbitRange;
    renderer.render(scene, camera);
    controls.update();
}

function remap(value, low1, high1, low2, high2) {
    return low2 + (value - low1) * (high2 - low2) / (high1 - low1);
}

onload = function() {
    initScene();
    initGeometries();
    initCamera();
    initLighting();
    initMp3Player();
    frameLooper();
};

window.onclick = () => {
    if (!audio) {
        return;
    }
    if (audio.paused) {
        return audio.play();
    }
    audio.pause();
};