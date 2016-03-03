// ScaledTriangle_Matrix.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform mat4 u_TM;\n' +
  'uniform mat4 u_TR;\n' +
  'uniform mat4 u_TS;\n' +
  'void main() {\n' +
  '  gl_Position = u_TM * u_TR * u_TS * a_Position;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_color;\n' +
  'void main() {\n' +
  '  gl_FragColor = u_color;\n' +
  '}\n';

function random(a, b){
    return (b - a) * Math.random() + a;
};

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

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

  // Write the positions of vertices to a vertex shader
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the positions of the vertices');
    return;
  }

  // Pass the rotation matrix to the vertex shader
  var u_TM = gl.getUniformLocation(gl.program, 'u_TM');
  if (!u_TM) {
   console.log('Failed to get the storage location of u_TM');
   return;
  }

  var u_TR = gl.getUniformLocation(gl.program, 'u_TR');
  if (!u_TR) {
    console.log('Failed to get the storage location of u_TR');
    return;
  }

  // Pass the rotation matrix to the vertex shader
  var u_TS = gl.getUniformLocation(gl.program, 'u_TS');
  if (!u_TS) {
    console.log('Failed to get the storage location of u_TS');
    return;
  }

  var u_color = gl.getUniformLocation(gl.program, "u_color");
  if (!u_color) {
    console.log('Failed to get the storage location of u_color');
    return;
  }

  // Specify the color for clearing <canvas>
  gl.clearColor(0, 0, 0, 1);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

// ------------------------------------------------------------
  var numSqu = 1000;
  for (var i = 0; i < numSqu; i += 1){

    var Tx = random(-1, 1), Ty = random(-1, 1), Tz = random(-1, 1);
    //console.log('Transladar >>( Tx:', Tx, ';Ty:', Ty, ';Tz:', Tz, ')');
    var Sx = random(0, 0.1), Sy = random(0, 0.1), Sz = 0;
    //console.log('Escalar >>( Sx:', Sx, ';Sy:', Sy, ';Sz:', Sz, ')');
    var ANGLE = random(-180, 180);
    //console.log('Angle:', ANGLE);

  // Note: WebGL is column major order
    var TM = new Float32Array([
        1.0,  0.0,  0.0,  0.0,
        0.0,  1.0,  0.0,  0.0,
        0.0,  0.0,  1.0,  0.0,
        Tx,  Ty,  Tz,  1.0
    ]);

    // Create a rotation matrix
    var radian = Math.PI * ANGLE / 180.0; // Convert to radians
    var cosB = Math.cos(radian), sinB = Math.sin(radian);

    // Note: WebGL is column major order
    var TR = new Float32Array([
       cosB, -sinB, 0.0, 0.0,
       sinB, cosB, 0.0, 0.0,
        0.0,  0.0, 1.0, 0.0,
        0.0,  0.0, 0.0, 1.0
    ]);

    var TS = new Float32Array([
        Sx,   0.0,  0.0,  0.0,
        0.0,  Sy,   0.0,  0.0,
        0.0,  0.0,  Sz,   0.0,
        0.0,  0.0,  0.0,  1.0
    ]);

    gl.uniformMatrix4fv(u_TM, false, TM);
    gl.uniformMatrix4fv(u_TR, false, TR);
    gl.uniformMatrix4fv(u_TS, false, TS);
    gl.uniform4f(u_color, Math.random(), Math.random(), Math.random(), 1);

    // Draw the rectangle
    gl.drawArrays(gl.TRIANGLE_FAN, 0, n);
  };
}

function initVertexBuffers(gl) {
  var vertices = new Float32Array([
    0.5, 0.5,  -0.5, 0.5,  -0.5, -0.5,   0.5, -0.5
  ]);
  var n = 4; // The number of vertices

  // Create a buffer object
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  // Assign the buffer object to a_Position variable
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

  // Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(a_Position);

  return n;
}
