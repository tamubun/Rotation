'use strict';
var camera, scene, renderer, controls;

var radius, height, theta, mom;
var cylinder;

function newSettings() {
  radius = Number($('#radius').val());
  height = Number($('#height').val());
  theta = Number($('#theta').val());
  mom = Number($('#mom').val());
  cylinder.scale.set(radius * 50, height * 50, radius * 50);
  cylinder.rotation.set(0,0,Math.PI/180.0 * theta);
}

function init() {
  var arena = $('#arena');
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    45, arena.innerWidth() / arena.innerHeight(), 1, 2000);
  camera.position.set(447, 400, -665);
  camera.lookAt( scene.position );
  controls = new THREE.TrackballControls(camera, arena[0]);
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

  cylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 1, 20, 1), material );
  cylinder.position.set( 0, 0, 0 );
  newSettings();
  scene.add( cylinder );

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(arena.innerWidth(), arena.innerHeight());
  $('#arena').append(renderer.domElement);
}

function animate() {
  var timer = Date.now() * 0.0002;
  requestAnimationFrame(animate);
  cylinder.rotation.y = timer * mom;
  controls.update();
  renderer.render(scene, camera);
}

$(function() {
  $('#settings input').change(newSettings);
  init();
  animate();
});
