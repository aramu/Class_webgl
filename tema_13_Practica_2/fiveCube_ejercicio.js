// ColoredCube.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

var aspect;
function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');
  aspect = canvas.width / canvas.height;

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Set the vertex information
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Set the clear color and enable the depth test
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // Get the storage location of u_MvpMatrix
  var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  if (!u_MvpMatrix) {
    console.log('Failed to get the storage location of u_MvpMatrix');
    return;
  }


  // // Set the eye point and the viewing volume
  var mvpMatrix = new Matrix4();

  // Event
  document.onkeydown = function(ev){keydown(ev, gl, n, u_MvpMatrix, mvpMatrix)};
  canvas.onmousemove = function(ev){mousemove(ev, gl, n, u_MvpMatrix, mvpMatrix)};

  // function --> 5 cube draw()
  draw(gl, n, u_MvpMatrix, mvpMatrix);
}

function dist(v1, v2){
  if (v1.length != v2.length) throw new Error('vector Error.');
  var sum = 0;
  for (var i=0; i<v1.length; i++){
    sum += Math.pow(v1[i] - v2[i], 2);
  }
  return Math.sqrt(sum)
}

var vt = {front: [10, 5, 0], behind: [-10, 5, 0]};
var lenVt = dist(vt.front, vt.behind);
var angleVt = 10;
var angle = 0;
function keydown(ev, gl, n, u_MvpMatrix, mvpMatrix) {
  switch(ev.keyCode){
    case 38: 
      vt.front[0] += 1; 
      vt.behind[0] += 1;
      break;  // The key passed up.
    case 40: 
      vt.front[0] -= 1;
      vt.behind[0] -= 1;
      break;  // The key passed down.
    case 37: 
      vt.front[1] += 1; 
      vt.behind[1] += 1;
      break;  // The key passed left.
    case 39: 
      vt.front[1] -= 1;
      vt.behind[1] -= 1;
      break;  // The key passed right.
    case 90:
      angle += angleVt;
      var xi = lenVt*Math.cos(a2r(angle)); //10
      var yi = lenVt*Math.sin(a2r(angle)); //10º
      vt.front[0] = vt.behind[0] + xi;
      vt.front[1] = vt.behind[1] + yi;
      break;
    case 88:
      angle -= angleVt;
      var xi = lenVt*Math.cos(a2r(angle)); //10
      var yi = lenVt*Math.sin(a2r(angle)); //10º
      vt.front[0] = vt.behind[0] + xi;
      vt.front[1] = vt.behind[1] + yi;
      break;
    // case 40: g_far -= 0.1;  break;  // The down arrow key was pressed
    default: return; // console.log(ev); // Prevent the unnecessary drawing
    }
    draw(gl, n, u_MvpMatrix, mvpMatrix);
}

var mousePos = {x: undefined, y: undefined};
function mousemove(ev, gl, n, u_MvpMatrix, mvpMatrix){
  if (!ev.ctrlKey) return;
  // console.log(ev); // Prevent the unnecessary drawing
  if (mousePos.x != undefined && mousePos.y != undefined) {
    // mousePos.x - ev.offsetX
    // mousePos.y - ev.offsetY
    angle += -(ev.offsetX - mousePos.x) * 0.5;
    // vt.front[2] += (ev.offsetY - mousePos.y) * 0.5;  
    var xi = lenVt*Math.cos(a2r(angle)); //10
    var yi = lenVt*Math.sin(a2r(angle)); //10º
    vt.front[0] = vt.behind[0] + xi;
    vt.front[1] = vt.behind[1] + yi;
  }
  draw(gl, n, u_MvpMatrix, mvpMatrix);
  mousePos.x = ev.offsetX;
  mousePos.y = ev.offsetY;
}

function a2r(angle){
    return angle * Math.PI / 180;
}

function draw(gl, n, u_MvpMatrix, mvpMatrix) {

    var cubeNum = 5;
    var cubeAngle = 360/cubeNum;
    var cubeDist = 10;
    var loopAngle = 0;

    // Clear color and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mvpMatrix.setPerspective(100, aspect, 1, 1000);
    mvpMatrix.lookAt(vt.behind[0], vt.behind[1], vt.behind[2], vt.front[0], vt.front[1], vt.front[2], 0, 1, 100);

    for (var i=0; i<cubeNum; i++){
        // console.log(loopAngle, cubeDist*Math.sin(a2r(loopAngle)), cubeDist*Math.cos(a2r(loopAngle)));
        mvpMatrix.translate(cubeDist * Math.sin(a2r(loopAngle)), cubeDist * Math.cos(a2r(loopAngle)), 0);
        loopAngle += cubeAngle;

        // Pass the model view projection matrix to u_MvpMatrix
        gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
          // Draw the cube
        gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
    }
}

function initVertexBuffers(gl) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3

  var vertices = new Float32Array([   // Vertex coordinates
     1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,  // v0-v1-v2-v3 front
     1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0,  // v0-v3-v4-v5 right
     1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0,  // v0-v5-v6-v1 up
    -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0,  // v1-v6-v7-v2 left
    -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0,  // v7-v4-v3-v2 down
     1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0   // v4-v7-v6-v5 back
  ]);

  var colors = new Float32Array([     // Colors
    0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  // v0-v1-v2-v3 front(blue)
    0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  // v0-v3-v4-v5 right(green)
    1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  // v0-v5-v6-v1 up(red)
    1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  // v1-v6-v7-v2 left
    1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  // v7-v4-v3-v2 down
    0.4, 1.0, 1.0,  0.4, 1.0, 1.0,  0.4, 1.0, 1.0,  0.4, 1.0, 1.0   // v4-v7-v6-v5 back
  ]);

  var indices = new Uint8Array([       // Indices of the vertices
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
  ]);

  // Create a buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer)
    return -1;

  // Write the vertex coordinates and color to the buffer object
  if (!initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_Position'))
    return -1;

  if (!initArrayBuffer(gl, colors, 3, gl.FLOAT, 'a_Color'))


    return -1;

  // Write the indices to the buffer object
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

function initArrayBuffer(gl, data, num, type, attribute) {
  var buffer = gl.createBuffer();   // Create a buffer object
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  return true;
}
