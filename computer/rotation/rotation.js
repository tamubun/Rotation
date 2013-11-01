'use strict';
var camera, scene, renderer, controls;

function init() {
  var arena = $('#arena');
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    45, arena.innerWidth() / arena.innerHeight(), 1, 2000);
  camera.position.set(447, 400, -665);
  camera.lookAt( scene.position );
  controls = new THREE.TrackballControls(camera);
  controls.rotateSpeed = 1.0;
  controls.zoomSpeed = 1.2;
  controls.panSpeed = 0.8;
  controls.noZoom = false;
  controls.noPan = false;
  controls.staticMoving = true;
  controls.dynamicDampingFactor = 0.3;
  controls.enabled = true;

  var light = new THREE.DirectionalLight(0xffffff);
  light.position.set(0, 1, -1);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0x404040));

  var material = new THREE.MeshLambertMaterial(
    { ambient: 0xbbbbbb, color: 0x335577 });

  var object = new THREE.Mesh(
    new THREE.SphereGeometry(75, 20, 10), material );
  object.position.set( -400, 0, 200 );
  scene.add( object );

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(arena.innerWidth(), arena.innerHeight());
  $('#arena').append(renderer.domElement);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

$(function() {
  init();
  animate();
});
