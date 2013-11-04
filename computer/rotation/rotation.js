'use strict';
var camera, scene, renderer, controls;

var radius, height, theta, mom, omega_phi, omega_psi;
var I1, I2, I3, E, scale = 70, shift_x;
var cylinder, poinsot, plane, contact, vect_l, vect_omega, binet, binet_s,
    nodes_line;

function newSettings() {
  radius = Number($('#radius').val());
  height = Number($('#height').val());
  theta = Math.PI/180.0 * Number($('#theta').val());
  mom = Number($('#mom').val());
  cylinder.scale.set(radius * 50, height * 50, radius * 50);
  cylinder.quaternion.setFromAxisAngle(new THREE.Vector3(-1, 0, 0), theta);

  nodes_line.scale.set(radius * 50, height * 50, radius * 50);

  I1 = I2 = radius * radius / 4.0 + height * height / 12.0;
  I3 = radius * radius / 2.0;
  omega_phi = mom / I1;
  omega_psi = -(I3 - I1)/I3 * Math.cos(theta) * omega_phi;
  var omega_3 = omega_phi * Math.cos(theta) + omega_psi,
      A = omega_phi * Math.sin(theta);
  E = 0.5 * ( I1 * A * A + I3 * omega_3 * omega_3 );
  poinsot.scale.set(
    scale / Math.sqrt(I1),
    scale / Math.sqrt(I3),
    scale / Math.sqrt(I1));
  plane.position.y = poinsot.position.y + scale * Math.sqrt(2 * E) / mom;

  binet.scale.set(
    scale * Math.sqrt(2 * E * I1),
    scale * Math.sqrt(2 * E * I3),
    scale * Math.sqrt(2 * E * I1));
  binet_s.scale.set(mom * scale, mom * scale, mom * scale);

  vect_l.scale.set(mom * scale, mom * scale, mom * scale);
}

function newConfigs() {
  nodes_line.visible =
    $('#line-of-nodes').prop('checked');

  poinsot.visible = plane.visible = contact.visible =
    $('#poinsot').prop('checked');
  binet.visible = binet_s.visible =
    $('#binet').prop('checked');

  vect_l.line.visible = vect_l.cone.visible =
  vect_omega.line.visible = vect_omega.cone.visible =
    $('#vectors').prop('checked');

  shift_x =
  poinsot.position.x = plane.position.x =
  binet.position.x = binet_s.position.x = 
  vect_l.position.x = vect_omega.position.x =
    $('#shift').prop('checked') ? 200 : 0;
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
    new THREE.CubeGeometry(0.07, 1.005, 0.1),
    new THREE.MeshLambertMaterial(
      { ambient: 0xbbbbbb, color: 0xff2222 }));
  mark.position.x = 0.98;
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
  ground.position.y = cylinder.position.y - 180;
  ground.receiveShadow = true;
  scene.add(ground);

  var geo = new THREE.Geometry();
  geo.vertices.push(new THREE.Vector3(1.02, 0.52, 0));
  geo.vertices.push(new THREE.Vector3(1.02, -0.52, 0));
  nodes_line = new THREE.Line(
    geo,
    new THREE.LineBasicMaterial({ color: 0x000000 }));
  nodes_line.position.y = cylinder.position.y;
  nodes_line.useQuaternion = true;
  scene.add(nodes_line);

  poinsot = new THREE.Mesh(
    new THREE.SphereGeometry(1, 16, 20, Math.PI, Math.PI*1.994),
    new THREE.MeshLambertMaterial(
      { ambient: 0xbbbbbb, color: 0xff2222, transparent: true, opacity: 0.2 }));
  poinsot.position.y = cylinder.position.y;
  poinsot.quaternion = cylinder.quaternion;
  scene.add(poinsot);

  var plane_material =
    new THREE.MeshLambertMaterial(
      { ambient: 0xbbbbbb, color: 0x777777, transparent: true, opacity: 0.2 });
  plane_material.side = THREE.DoubleSide;
  plane = new THREE.Mesh(
    new THREE.PlaneGeometry(600, 600), plane_material);
  plane.rotation.x = -Math.PI / 2;
  scene.add(plane);

  contact = new THREE.Mesh(
    new THREE.SphereGeometry(3),
    new THREE.MeshLambertMaterial(
      { ambient: 0xbbbbbb, color: 0xff2222 }));
  scene.add(contact);

  binet = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 40),
    new THREE.MeshLambertMaterial(
      { ambient: 0xbbbbbb, color: 0x2222ff, transparent: true, opacity: 0.2 }));
  binet.position.y = cylinder.position.y;
  binet.quaternion = cylinder.quaternion;
  scene.add(binet);

  binet_s = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 40),
    new THREE.MeshLambertMaterial(
      { ambient: 0xbbbbbb, color: 0x22ffaa, transparent: true, opacity: 0.2 }));
  binet_s.position.y = cylinder.position.y;
  scene.add(binet_s);

  vect_l = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, cylinder.position.y, 0),
    1, 0x22aa55);
  scene.add(vect_l);
  vect_omega = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, cylinder.position.y, 0),
    1, 0xaaaa22);
  scene.add(vect_omega);

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

  q2.setFromAxisAngle(new THREE.Vector3(-1, 0, 0), theta);
  nodes_line.rotation.set(0, phi, theta);
  nodes_line.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), phi);
  nodes_line.quaternion.multiply(q2);

  var q = cylinder.quaternion.clone(),
      omega = new THREE.Vector3(0, mom, 0);
  q.inverse();
  omega.applyQuaternion(q);
  omega.x /= I1;
  omega.y /= I3;
  omega.z /= I1;
  omega.applyQuaternion(cylinder.quaternion);
  contact.position.set(
    scale * omega.x / Math.sqrt(2 * E) + shift_x,
    scale * omega.y / Math.sqrt(2 * E) + poinsot.position.y,
    scale * omega.z / Math.sqrt(2 * E));
  vect_omega.setLength(7 * omega.length());
  vect_omega.setDirection(omega.normalize()); // omega changes

  controls.update();
  renderer.render(scene, camera);
}

$(function() {
  $('#settings input').change(newSettings);
  $('#configs input').change(newConfigs);
  init();
  animate();
});
