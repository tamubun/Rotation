'use strict';
var camera, scene, renderer, controls;

var radius, height, theta, mom, omega_phi, omega_psi;
var I1, I2, I3;
var cylinder, ellipse, plane;

function newSettings() {
  radius = Number($('#radius').val());
  height = Number($('#height').val());
  theta = Math.PI/180.0 * Number($('#theta').val());
  mom = Number($('#mom').val());
  cylinder.scale.set(radius * 50, height * 50, radius * 50);
  cylinder.quaternion.setFromAxisAngle(new THREE.Vector3(-1, 0, 0), theta);
  I1 = I2 = radius * radius / 4.0 + height * height / 12.0;
  I3 = radius * radius / 2.0;
  omega_phi = mom / I1;
  omega_psi = -(I3 - I1)/I3 * Math.cos(theta) * omega_phi;
  var omega_3 = omega_phi * Math.cos(theta) + omega_psi,
      A = omega_phi * Math.sin(theta),
      E = 0.5 * ( I1 * A * A + I3 * omega_3 * omega_3 ),
      scale = 70;
  ellipse.scale.set(scale / Math.sqrt(I1), scale / Math.sqrt(I3), scale / Math.sqrt(I1));
  plane.position.y = ellipse.position.y + scale * Math.sqrt(2 * E) / mom;
}

function newConfigs() {
  if ( $('#ellipse').prop('checked') ) {
    ellipse.visible = plane.visible = true;
  } else {
    ellipse.visible = plane.visible = false;
  }
}

function init() {
  var arena = $('#arena');
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    45, arena.innerWidth() / arena.innerHeight(), 1, 2000);
  camera.position.set(0, 200, -800);
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
    new THREE.MeshLambertMaterial(
      { ambient: 0xbbbbbb, color: 0x335577 }));
  var mark = new THREE.Mesh(
    new THREE.CubeGeometry(1.005, 1.005, 0.1),
    new THREE.MeshLambertMaterial({ ambient: 0xbbbbbb, color: 0xff2222 }));
  mark.position.x = 0.5;
  cylinder.add(mark);
  cylinder.useQuaternion = true;
  cylinder.castShadow = true;
  cylinder.position.y = 100;
  scene.add( cylinder );

  var ground_material =
    new THREE.MeshLambertMaterial({ ambient: 0xbbbbbb, color: 0xaa7744 });
  ground_material.side = THREE.DoubleSide;
  var ground = new THREE.Mesh(
    new THREE.PlaneGeometry(600, 600), ground_material);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -80;
  ground.receiveShadow = true;
  scene.add(ground);

  ellipse = new THREE.Mesh(
    new THREE.SphereGeometry(1, 16, 20),
    new THREE.MeshLambertMaterial(
      { ambient: 0xbbbbbb, color: 0xff2222, transparent: true, opacity: 0.2 }));
  ellipse.position.y = cylinder.position.y;
  ellipse.quaternion = cylinder.quaternion;
  scene.add(ellipse);

  var plane_material =
    new THREE.MeshLambertMaterial(
      { ambient: 0xbbbbbb, color: 0x777777, transparent: true, opacity: 0.2 });
  plane_material.side = THREE.DoubleSide;
  plane = new THREE.Mesh(
    new THREE.PlaneGeometry(600, 600), plane_material);
  plane.rotation.x = -Math.PI / 2;
  scene.add(plane);

  newSettings();
  newConfigs();

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(arena.innerWidth(), arena.innerHeight());
  renderer.shadowMapEnabled = true;
  $('#arena').append(renderer.domElement);
}

function animate() {
  requestAnimationFrame(animate);
  var timer = Date.now() * 0.0004;
  var phi = timer * omega_phi,
      psi = timer * omega_psi;
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
  $('#configs input').change(newConfigs);
  init();
  animate();
});
