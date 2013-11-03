'use strict';
var camera, scene, renderer, controls;

var radius, height, theta, mom;
var I1, I2, I3;
var cylinder;

function newSettings() {
  radius = Number($('#radius').val());
  height = Number($('#height').val());
  theta = Math.PI/180.0 * Number($('#theta').val());
  mom = Number($('#mom').val());
  cylinder.scale.set(radius * 50, height * 50, radius * 50);
  cylinder.quaternion.setFromAxisAngle(new THREE.Vector3(-1, 0, 0), theta);
  I1 = I2 = radius * radius / 4.0 + height * height / 12.0;
  I3 = radius * radius / 2.0;
}

function init() {
  var arena = $('#arena');
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    45, arena.innerWidth() / arena.innerHeight(), 1, 2000);
  camera.position.set(0, 100, -665);
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

  scene.add(new THREE.AmbientLight(0x404040));
  var light = new THREE.DirectionalLight(0xffffff);
  light.position.set(-50, 200, -100);
  light.castShadow = true;
  light.shadowMapWidth = 2048;
  light.shadowMapHeight = 2048;  scene.add(light);

  cylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 1, 30, 1),
    new THREE.MeshLambertMaterial({ ambient: 0xbbbbbb, color: 0x335577 }));
  var mark = new THREE.Mesh(
    new THREE.CubeGeometry(1.005, 1.005, 0.1),
    new THREE.MeshLambertMaterial({ ambient: 0xbbbbbb, color: 0xff2222 }));
  mark.position.x = 0.5;
  cylinder.add(mark);
  cylinder.useQuaternion = true;
  cylinder.castShadow = true;
  newSettings();
  scene.add( cylinder );

  var ground_material =
    new THREE.MeshLambertMaterial({ ambient: 0xbbbbbb, color: 0xaa7744 });
  ground_material.side = THREE.DoubleSide;
  var ground = new THREE.Mesh(
    new THREE.PlaneGeometry(700, 700), ground_material);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -200;
  ground.receiveShadow = true;
  scene.add(ground);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(arena.innerWidth(), arena.innerHeight());
  renderer.shadowMapEnabled = true;
  $('#arena').append(renderer.domElement);
}

function animate() {
  requestAnimationFrame(animate);
  var timer = Date.now() * 0.0004;
  var omega_phi = mom / I1,
      phi = timer * omega_phi,
      psi = -timer * (I3-I1)/I3 * Math.cos(theta) * omega_phi;
  var q1, q2;
  q1 = new THREE.Quaternion();
  q1.setFromAxisAngle(new THREE.Vector3(0, 1, 0), psi);
  q2 = new THREE.Quaternion();
  q2.setFromAxisAngle(new THREE.Vector3(-1, 0, 0), theta);
  q2.multiply(q1);
  cylinder.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), phi);
  cylinder.quaternion.multiply(q2);

  controls.update();
  renderer.render(scene, camera);
}

$(function() {
  $('#settings input').change(newSettings);
  init();
  animate();
});
