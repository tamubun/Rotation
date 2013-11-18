'use strict';
var debug = false;

var camera, scene, renderer, controls;

var radius1, radius2, height, theta, mom;
var timer, timer_old, time_offset;
var I1, I2, I3, E, the_q, scale = 70, shift_x, cylinder_height = 170;
var cylinder, ground, poinsot, invariable, contact, vect_l, vect_omega,
    binet, binet_s, nodes_line;
var body_coord;

function newSettings() {
  radius1 = Number($('#radius1').val());
  radius2 = Number($('#radius2').val());
  height = Number($('#height').val());
  theta = Math.PI/180.0 * Number($('#theta').val());
  mom = Number($('#mom').val());
  the_q =
    (new THREE.Quaternion())
    .setFromAxisAngle(new THREE.Vector3(-1, 0, 0), theta);

  cylinder.scale.set(radius1 * 50, height * 50, radius2 * 50);
  if ( !body_coord ) {
    cylinder.quaternion.copy(the_q);
  }
  var r = radius1 > radius2 ? radius1 : radius2;

  nodes_line.scale.set(r * 50, height * 50, 1);

  I1 = radius2 * radius2 / 4.0 + height * height / 12.0;
  I2 = (radius1 * radius1 + radius2 * radius2) / 4.0;
  I3 = radius1 * radius1 / 4.0 + height * height / 12.0;

  var q_inv = the_q.clone().inverse(),
      l_body = (new THREE.Vector3(0, mom, 0)).applyQuaternion(q_inv),
      om1 = l_body.x / I1, om2 = l_body.y / I2, om3 = l_body.z / I3;

  E = 0.5 * ( I1*om1*om1 + I2*om2*om2 + I3*om3*om3 );
  poinsot.scale.set(
    scale / Math.sqrt(I1),
    scale / Math.sqrt(I2),
    scale / Math.sqrt(I3));
  if ( !body_coord )
    invariable.position.y = scale * Math.sqrt(2 * E) / mom;

  binet.scale.set(
    scale * Math.sqrt(2 * E * I1),
    scale * Math.sqrt(2 * E * I2),
    scale * Math.sqrt(2 * E * I3));
  binet_s.scale.set(mom * scale, mom * scale, mom * scale);
  if ( I1 > I3 && Math.sqrt(2 * E * I1) > mom ) { // TODO:
    binet.renderDepth = binet.children[0].renderDepth = 0;
    binet_s.renderDepth = 1;
  } else {
    binet.renderDepth = binet.children[0].renderDepth = 1;
    binet_s.renderDepth = 0;
  }

  vect_l.scale.set(mom * scale, mom * scale, mom * scale);
}

function newConfigs() {
  nodes_line.visible =
    $('#line-of-nodes').prop('checked');

  poinsot.visible = poinsot.children[0].visible =
  invariable.visible = contact.visible =
    $('#poinsot').prop('checked');
  binet.visible = binet.children[0].visible =
  binet_s.visible =
    $('#binet').prop('checked');

  vect_l.line.visible = vect_l.cone.visible =
  vect_omega.line.visible = vect_omega.cone.visible =
    $('#vectors').prop('checked');

  shift_x =
  vect_l.position.x = invariable.position.x =
    $('#shift').prop('checked') ? 200 : 0;

  if ( body_coord !== $('#body-coord').prop('checked') )
    changeCoordinateSystem();
}

function changeCoordinateSystem() {
  body_coord = !body_coord;
  if ( !body_coord ) {
    ground.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI/2);
    ground.position.set(0, -cylinder_height, 0);
    vect_l.setDirection(new THREE.Vector3(0, 1, 0));
    invariable.position.y = scale * Math.sqrt(2 * E) / mom;
  } else {
    cylinder.quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0);
  }
}

function init() {
  var arena = $('#arena');
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    45, arena.innerWidth() / arena.innerHeight(), 1, 2000);
  camera.position.set(0, 30, -750);
  camera.lookAt(scene.position);
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

  cylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 1, 30, 1),
    new THREE.MeshLambertMaterial(
      { ambient: 0xbbbbbb, color: 0x335577 }));
  var mark = new THREE.Mesh(
    new THREE.CubeGeometry(1.02, 1.005, 0.1),
    new THREE.MeshLambertMaterial(
      { ambient: 0xbbbbbb, color: 0xff2222 }));
  mark.position.x = 0.5;
  cylinder.add(mark);
  cylinder.castShadow = true;
  scene.add(cylinder);

  var ground_material =
    new THREE.MeshLambertMaterial({ ambient: 0xbbbbbb, color: 0xaa7744 });
  ground_material.side = THREE.DoubleSide;
  ground = new THREE.Mesh(
    new THREE.PlaneGeometry(600, 600), ground_material);
  var light = new THREE.DirectionalLight(0xffffff);
  light.position.set(-50, -100, -380);
  light.castShadow = true;
  light.shadowMapWidth = 2048;
  light.shadowMapHeight = 2048;
  light.target = cylinder;
  ground.add(light); // 剛体系で、光源も地面と一緒に回るようにする
  if ( debug ) {
    var light_mark = new THREE.Mesh(
      new THREE.SphereGeometry(3),
      new THREE.MeshLambertMaterial(
	{ ambient: 0xbbbbbb, color: 0xff2222 }));
    light.add(light_mark);
  }
  ground.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI/2);
  ground.position.y = -cylinder_height;
  ground.receiveShadow = true;
  scene.add(ground);

  var geo = new THREE.Geometry();
  geo.vertices.push(new THREE.Vector3(0, 0.5025, 0));
  geo.vertices.push(new THREE.Vector3(1.02, 0.5025, 0));
  geo.vertices.push(new THREE.Vector3(1.02, -0.5025, 0));
  geo.vertices.push(new THREE.Vector3(0, -0.5025, 0));
  nodes_line = new THREE.Line(
    geo,
    new THREE.LineBasicMaterial({ color: 0x000000 }));
  scene.add(nodes_line);

  var wireframe = new THREE.MeshBasicMaterial(
    { color: 0xffffff, wireframe: true, transparent: true, opacity: 0.3 });

  poinsot = new THREE.Mesh(
    new THREE.SphereGeometry(1, 16, 20),
    new THREE.MeshLambertMaterial(
      { ambient: 0xbbbbbb, color: 0xff2222, transparent: true, opacity: 0.2 }));
  poinsot.add(new THREE.Mesh(
    new THREE.SphereGeometry(1, 8, 20),
    wireframe));
  scene.add(poinsot);

  var invariable_material =
    new THREE.MeshLambertMaterial(
      { ambient: 0xbbbbbb, color: 0x777777, transparent: true, opacity: 0.2 });
  invariable_material.side = THREE.DoubleSide;
  invariable = new THREE.Mesh(
    new THREE.PlaneGeometry(600, 600), invariable_material);
  invariable.renderDepth = 0;
  scene.add(invariable);

  contact = new THREE.Mesh(
    new THREE.SphereGeometry(3),
    new THREE.MeshLambertMaterial(
      { ambient: 0xbbbbbb, color: 0xff2222 }));
  scene.add(contact);

  binet = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 40),
    new THREE.MeshLambertMaterial(
      { ambient: 0xbbbbbb, color: 0x2222ff, transparent: true, opacity: 0.2 }));
  binet.add(new THREE.Mesh(
    new THREE.SphereGeometry(1, 8, 40),
    wireframe));
  scene.add(binet);

  binet_s = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 40),
    new THREE.MeshLambertMaterial(
      { ambient: 0xbbbbbb, color: 0x22ffaa, transparent: true, opacity: 0.2 }));
  scene.add(binet_s);

  vect_l = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 0, 0),
    1, 0x22aa55);
  scene.add(vect_l);
  vect_omega = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 0, 0),
    1, 0xaaaa22);
  scene.add(vect_omega);

  /* 角度、位置を共有する */
  poinsot.quaternion = binet.quaternion =
    cylinder.quaternion;
  invariable.quaternion =
    ground.quaternion;
  poinsot.position = binet.position = binet_s.position = vect_omega.position =
    vect_l.position;

  newSettings();
  newConfigs();

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(arena.innerWidth(), arena.innerHeight());
  renderer.shadowMapEnabled = true;
  $('#arena').append(renderer.domElement);

  timer_old = 0;
/*
  time_offset = Date.now();
*/
}

function animate() {
  requestAnimationFrame(animate);

/*
  timer =
   timer_old + (Date.now()-time_offset) * 0.000004 * Number($('#speed').val());
*/
  var now = Date.now(),
      dt = (now - timer_old) * 0.000008 * Number($('#speed').val());
  timer_old = now;

  var q_inv = the_q.clone().inverse(),
      l_body = (new THREE.Vector3(0, mom, 0)).applyQuaternion(q_inv),
      omega_body =
        new THREE.Vector3(l_body.x / I1, l_body.y / I2, l_body.z / I3),
      omega_dot_body = new THREE.Vector3(),
      omega_dot_dot_body = new THREE.Vector3(),
      tmp = new THREE.Vector3(),
      omega = omega_body.clone().applyQuaternion(the_q),
      E_cur = 0.5 *
      (I1*omega_body.x*omega_body.x +
       I2*omega_body.y*omega_body.y +
       I3*omega_body.z*omega_body.z);

  omega_dot_body.crossVectors(l_body, omega_body);
  omega_dot_body.x /= I1;
  omega_dot_body.y /= I2;
  omega_dot_body.z /= I3;
/*
  // 多分omega_dot_dotの計算間違ってる。空間座標での式を剛体座標で使ってるので
  tmp.crossVectors(omega_body, l_body);
  tmp.crossVectors(omega_body, tmp);
  omega_dot_dot_body.crossVectors(l_body, omega_dot_body).add(tmp);
  omega_dot_dot_body.x /= I1;
  omega_dot_dot_body.y /= I2;
  omega_dot_dot_body.z /= I3;
  tmp.crossVectors(omega_body, omega_dot_body);
  omega_dot_dot_body.add(tmp);
*/

  if ( !body_coord ) {
    cylinder.quaternion.copy(the_q);

    /*
    q1.setFromAxisAngle(new THREE.Vector3(-1, 0, 0), theta);
    nodes_line.rotation.set(0, phi, theta);
    nodes_line.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), phi);
    nodes_line.quaternion.multiply(q1);
    */

    vect_omega.setLength(7 * omega.length());
    vect_omega.setDirection(omega.clone().normalize());

    contact.position.set(
      scale * omega.x / Math.sqrt(2 * E_cur) + shift_x,
      scale * omega.y / Math.sqrt(2 * E_cur),
      scale * omega.z / Math.sqrt(2 * E_cur));
  } else {
    ground.quaternion.multiplyQuaternions(
      q_inv,
      (new THREE.Quaternion()).
	setFromAxisAngle(new THREE.Vector3(1,0,0), Math.PI/2.0));
    ground.position.copy(
      (new THREE.Vector3(0, -cylinder_height, 0)).applyQuaternion(q_inv));

//    nodes_line.rotation.set(0, -psi, 0);

    vect_l.setDirection(l_body.clone().normalize());
    vect_omega.setLength(7 * omega_body.length());
    vect_omega.setDirection(omega_body.clone().normalize());
    invariable.position.copy(
      (new THREE.Vector3(0, scale * Math.sqrt(2 * E) / mom, 0))
	.applyQuaternion(q_inv));
    invariable.position.x += shift_x;
    contact.position.set(
      scale * omega_body.x / Math.sqrt(2 * E_cur) + shift_x,
      scale * omega_body.y / Math.sqrt(2 * E_cur),
      scale * omega_body.z / Math.sqrt(2 * E_cur));
  }

  switch ( $('#method').val() ) {
  case '1th':
    break;
  case '2nd':
    omega_body.add(omega_dot_body.multiplyScalar(dt / 2.0));
    break;
  case 'f3rd':
    omega_body
      .add(omega_dot_body.multiplyScalar(dt / 2.0))
      .add(omega_dot_dot_body.multiplyScalar(dt*dt / 6.0));
    break;
  case 'a2nd':
    tmp.crossVectors(omega_dot_body, omega_body);
    omega_body
      .add(omega_dot_body.multiplyScalar(dt / 2.0))
      .add(tmp.multiplyScalar(dt*dt / 12.0));
    break;
  case 't3rd':
    tmp.copy(omega_dot_body)
      .add(omega_dot_dot_body.clone().multiplyScalar(dt / 3.0))
      .cross(omega_body)
      .multiplyScalar(dt * dt / 12.0);
    omega_body
      .add(omega_dot_body.multiplyScalar(dt / 2.0))
      .add(omega_dot_dot_body.multiplyScalar(dt*dt / 6.0))
      .add(tmp);
    break;
  }
  omega = omega_body.applyQuaternion(the_q);
  the_q =
    (new THREE.Quaternion())
    .setFromAxisAngle(omega.clone().normalize(), omega.length() * dt)
    .multiply(the_q);

  controls.update();
  renderer.render(scene, camera);
}

$(function() {
  $('.settings').change(newSettings);
  $('.configs').change(newConfigs);
/*
  $('#speed').change(function() {
    time_offset = Date.now();
    timer_old = timer;
  });
*/
  body_coord = $('#body-coord').prop('checked')
  init();
  animate();
});
