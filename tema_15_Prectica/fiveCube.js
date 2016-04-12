// Vertex Shader
var VSHADER_SOURCE =
    'attribute vec3 a_VertexPosition;\n' +
    'attribute vec2 a_TextureCoord;\n' +
    'uniform mat4 u_MvpMatrix;\n' +
    'varying highp vec2 v_TextureCoord;\n' +
    'void main() {\n' +
    '   gl_Position = u_MvpMatrix * vec4(a_VertexPosition, 1.0);\n' +
    //'   gl_Position = vec4(a_VertexPosition, 1.0);\n' +
    '   v_TextureCoord = a_TextureCoord;\n' +
    '}\n';

// Fragment Shader
var FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +
    'varying highp vec2 v_TextureCoord;\n' +
    'uniform sampler2D u_sampler;\n' +
    'void main() {\n' +
    '   gl_FragColor = texture2D(u_sampler, vec2(v_TextureCoord.s, v_TextureCoord.t));\n' +
    '}\n';

// init Varia Global
var gl;
var config = new Object;
var cam = {
    posi:   new vector(1.0, 0.0, 0.0),
    dirt:   new vector(0.0, 0.0, 0.0),
    rote:   new vector(0.0, 0.0, 1.0)
}

function vector(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
};

vector.prototype.sum = function(vct) {
     return new vector(this.x + vct.x, this.y + vct.y, this.z + vct.z);
};

vector.prototype.less = function(vct) {
     return new vector(this.x - vct.x, this.y - vct.y, this.z - vct.z);
};

vector.prototype.mod = function() {
     return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2));
};

vector.prototype.norm = function() {
     var len = this.mod();
     return new vector(this.x/len, this.y/len, this.z/len);
};

vector.prototype.see = function() {
    console.log('x,y,z: (',this.x, this.y, this.z, ')');
};

vector.prototype.getGradoXY = function () {
    return 180*(this.x/Math.abs(this.x)-1)/2 + Math.r2a(Math.atan(this.y / this.x));
}

vector.prototype.negative = function () {
    return new vector(-this.x, -this.y, -this.z);
}

function main() {
    var canvas = document.getElementById('webgl');
    config.aspect = canvas.width / canvas.height;
    gl = getWebGLContext(canvas);

    // init WebGL
    if (!gl) {
        makeFailHTML('Failed to get the rendering context for WebGL');
        return;
    }

    // init WebGL.shader
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        makeFailHTML('Failed to intialize shaders.');
        return;
    }

    // Event
    document.onkeydown = function(ev) {keydown(ev)};
    // canvas.onmousemove = function(ev) {mousemove(ev)};


    if (gl) {
        // Config WebGL
        gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
        gl.clearDepth(1.0); // Clear everything
        gl.enable(gl.DEPTH_TEST); // Enable depth testing
        gl.depthFunc(gl.LEQUAL); // Near things obscure far things

        initBuffers();
        initTextures();

        drawScene();
        //requestAnimationFrame(drawScene);
    }
};

Math.a2r = function (angle) {
  return angle * Math.PI / 180;
}

Math.r2a = function (radian) {
  return radian * 180 / Math.PI;
}

var keycode = {
    up: 38,
    down: 40,
    right: 39,
    left: 37,
    z: 90,
    x: 88
};

config.angle = 0; // grado
config.gradoRotate = 2; // grado
// config.stepLen = 1;

function keydown(ev) {
    orient = cam.posi.less(cam.dirt);
    switch(ev.keyCode){
        case keycode.up:
            // console.log('up');
            cam.posi = cam.posi.sum(orient.norm());
            cam.dirt = cam.dirt.sum(orient.norm());
            break;
        case keycode.down:
            // console.log('down');
            cam.posi = cam.posi.less(orient.norm());
            cam.dirt = cam.dirt.less(orient.norm());
            break;
        case keycode.right:
            config.angle = orient.negative().getGradoXY();
            config.angle -= config.gradoRotate;
            var xi = orient.mod() * Math.cos(Math.a2r(config.angle));
            var yi = orient.mod() * Math.sin(Math.a2r(config.angle));
            var zi = 0;
            angleVector = new vector(xi, yi, zi);
            cam.dirt = cam.posi.sum(angleVector);
            break;
        case keycode.left:
            config.angle = orient.negative().getGradoXY();
            config.angle += config.gradoRotate;
            var xi = orient.mod() * Math.cos(Math.a2r(config.angle));
            var yi = orient.mod() * Math.sin(Math.a2r(config.angle));
            var zi = 0;
            angleVector = new vector(xi, yi, zi);
            cam.dirt = cam.posi.sum(angleVector);
            break;
        default: return; // console.log(ev); // Prevent the unnecessary drawing
    }
};

// function mousemove() {}

function toBuffer(arr, buffType, dataStoreType) {
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return false
    }
    gl.bindBuffer(buffType, buffer);
    gl.bufferData(buffType, arr, dataStoreType);
    return buffer
};

function setAttr(attr, num, type, buffName, buffType) {
    var a_attr = gl.getAttribLocation(gl.program, attr);
    if (a_attr < 0) {
        console.log('Failed to get the storage location of ' + attribute);
        return false;
    }
    gl.enableVertexAttribArray(a_attr);

    gl.bindBuffer(buffType, buffName);
    gl.vertexAttribPointer(a_attr, num, type, false, 0, 0);
    return true;
};

function initBuffers() {
    // cube
    // cube Vertices Buffer = cube_v_buff
    cube_v_buff = toBuffer(cube.vertices, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
    // cube Vertices Texture CoordBuffer = cube_t_buff
    cube_t_buff = toBuffer(cube.textureCoord, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
    // cube Vertices Index Buffer = cube_i_buff
    cube_i_buff = toBuffer(cube.indices, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW);

    //ground
    ground_v_buff = toBuffer(ground.vertices, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
    // ground Vertices Texture CoordBuffer = ground_t_buff
    ground_t_buff = toBuffer(ground.textureCoord, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
    // ground Vertices Index Buffer = ground_i_buff
    ground_i_buff = toBuffer(ground.indices, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW);
};

function initTextures() {
  config.cubeTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, config.cubeTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 255, 0, 255]));
  var cubeImage = new Image();
  cubeImage.src = "./resources/marbletexture.png"
  cubeImage.onload = function() { handleTextureLoaded(config.cubeTexture, cubeImage); }

  config.groundTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, config.groundTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 255, 0, 255]));
  var groundImage = new Image();
  groundImage.src = "./resources/groundtexture.png";
  groundImage.onload = function() { handleTextureLoaded(config.groundTexture, groundImage); }
};

function handleTextureLoaded(texture, image) {
  // console.log("handleTextureLoaded, image = " + image);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindTexture(gl.TEXTURE_2D, null);
};

// pv
function pview() {
    var vMatrix = new Matrix4();
    var pMatrix = new Matrix4();

    pMatrix.setPerspective(20, config.aspect, 1, 100);
    vMatrix.lookAt(cam.dirt.x, cam.dirt.y, cam.dirt.z,
                   cam.posi.x, cam.posi.y, cam.posi.z,
                   cam.rote.x, cam.rote.y, cam.rote.z);

    var pvMatrix = new Matrix4();
    return pvMatrix.set(pMatrix).multiply(vMatrix);
};

function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var pvMatrix = pview();

    drawGround(pvMatrix);
    drawCube(pvMatrix);

    requestAnimationFrame(drawScene, gl, config.cubeTexture);
};

function drawCube(pvMatrix) {
    // a_VertexPosition
    setAttr('a_VertexPosition', 3, gl.FLOAT, cube_v_buff, gl.ARRAY_BUFFER);

    // a_TextureCoord
    setAttr('a_TextureCoord', 2, gl.FLOAT, cube_t_buff, gl.ARRAY_BUFFER);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, config.cubeTexture);
    gl.uniform1i(gl.getUniformLocation(gl.program, "u_sampler"), 0);

    // index
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cube_i_buff);

    // mvpMatrix
    var u_mvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    if (!u_mvpMatrix) {
        console.log('Failed to get the storage location of u_MvpMatrix');
        return;
    }

    var mMatrix   = new Matrix4();
    var mvpMatrix = new Matrix4();

    mMatrix.translate(20.0, 0.0, 0.0).rotate(30, 0, 0, 1).rotate(20, 0, 1, 0);

    mvpMatrix.set(pvMatrix).multiply(mMatrix);
    gl.uniformMatrix4fv(u_mvpMatrix, false, mvpMatrix.elements);

    // drew
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
};

function drawGround(pvMatrix) {
    // a_VertexPosition
    setAttr('a_VertexPosition', 3, gl.FLOAT, ground_v_buff, gl.ARRAY_BUFFER);

    // a_TextureCoord
    setAttr('a_TextureCoord', 2, gl.FLOAT, ground_t_buff, gl.ARRAY_BUFFER);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, config.groundTexture);
    gl.uniform1i(gl.getUniformLocation(gl.program, "u_sampler"), 0);

    // index
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ground_i_buff);

    // mvpMatrix
    var u_mvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    if (!u_mvpMatrix) {
        console.log('Failed to get the storage location of u_MvpMatrix');
        return;
    }

    var mMatrix   = new Matrix4();
    var mvpMatrix = new Matrix4();

    mMatrix.translate(15.0, 0.0, -1.0).scale(20.0, 20.0, 1.0);

    mvpMatrix.set(pvMatrix).multiply(mMatrix);
    gl.uniformMatrix4fv(u_mvpMatrix, false, mvpMatrix.elements);

    // drew
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
};

var cube = {
    vertices: new Float32Array([
        -1.0, -1.0,  1.0,   1.0, -1.0,  1.0,   1.0,  1.0,  1.0,  -1.0,  1.0,  1.0, // Front face
        -1.0, -1.0, -1.0,  -1.0,  1.0, -1.0,   1.0,  1.0, -1.0,   1.0, -1.0, -1.0, // Back face
        -1.0,  1.0, -1.0,  -1.0,  1.0,  1.0,   1.0,  1.0,  1.0,   1.0,  1.0, -1.0, // Top face
        -1.0, -1.0, -1.0,   1.0, -1.0, -1.0,   1.0, -1.0,  1.0,  -1.0, -1.0,  1.0, // Bottom face
         1.0, -1.0, -1.0,   1.0,  1.0, -1.0,   1.0,  1.0,  1.0,   1.0, -1.0,  1.0, // Right face
        -1.0, -1.0, -1.0,  -1.0, -1.0,  1.0,  -1.0,  1.0,  1.0,  -1.0,  1.0, -1.0 // Left face
    ]),

    textureCoord: new Float32Array([
        0.0, 0.0,    1.0, 0.0,   1.0, 1.0,   0.0, 1.0, // Front
        0.0, 0.0,    1.0, 0.0,   1.0, 1.0,   0.0, 1.0, // Back
        0.0, 0.0,    1.0, 0.0,   1.0, 1.0,   0.0, 1.0, // Top
        0.0, 0.0,    1.0, 0.0,   1.0, 1.0,   0.0, 1.0, // Bottom
        0.0, 0.0,    1.0, 0.0,   1.0, 1.0,   0.0, 1.0, // Right
        0.0, 0.0,    1.0, 0.0,   1.0, 1.0,   0.0, 1.0 // Left
    ]),

    indices: new Uint16Array([
        0, 1, 2,    0, 2, 3, // front
        4, 5, 6,    4, 6, 7, // back
        8, 9, 10,   8, 10, 11, // top
        12, 13, 14, 12, 14, 15, // bottom
        16, 17, 18, 16, 18, 19, // right
        20, 21, 22, 20, 22, 23 // left
    ])
};

var ground = {
    vertices: new Float32Array([
        -1.0, -1.0, -1.0,   1.0, -1.0, -1.0,   1.0, 1.0, -1.0,  -1.0, 1.0,  -1.0 // Bottom face
    ]),

    textureCoord: new Float32Array([
        0.0, 0.0,    1.0, 0.0,    1.0, 1.0,   0.0, 1.0 // Bottom
    ]),

    indices: new Uint16Array([
        0, 1, 2, 0, 2, 3 // bottom
    ])
};