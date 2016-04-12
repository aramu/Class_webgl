// Vertex Shader
var VSHADER_SOURCE =
    'attribute vec3 a_VertexPosition;\n' +
    'attribute vec2 a_TextureCoord;\n' +
    'uniform mat4 u_MvpMatrix;\n' +
    'varying highp vec2 v_TextureCoord;\n' +
    'void main() {\n' +
    '   gl_Position = u_MvpMatrix * vec4(a_VertexPosition, 1.0);\n' +
    '   v_TextureCoord = a_TextureCoord;\n' +
    '}\n';

// Fragment Shader
var FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +
    'varying highp vec2 v_TextureCoord;\n' +
    'uniform sampler2D u_image0;\n' +
    'uniform sampler2D u_image1;\n' +
    'void main() {\n' +
    '   vec4 color0 = texture2D(u_image0, vec2(v_TextureCoord.s, v_TextureCoord.t));\n' +
    '   vec4 color1 = texture2D(u_image1, vec2(v_TextureCoord.s, v_TextureCoord.t));\n' +
    '   gl_FragColor = color0 * color1;\n' +
    '}\n';

var shaderNames = {
    mvpMatrix: 'u_MvpMatrix',
    vertices: 'a_VertexPosition',
    textureCoord: 'a_TextureCoord',
    imgs: ['u_image0', 'u_image1']
}
// init Varia Global
var gl;
var config = new Object;

var cam = {
    posi:   new vector(-30.0, 0.0, 0.0),
    dirt:   new vector(-31.0, 0.0, 0.0),
    rote:   new vector(0.0, 0.0, 1.0)
}

var perspective = {
    curvature: 50,
    range: 1,
    depth: 1000
}

// pv
function camera() {
    var vMatrix = new Matrix4();
    var pMatrix = new Matrix4();

    pMatrix.setPerspective(perspective.curvature, 
                           config.aspect,
                           perspective.range,
                           perspective.depth);

    vMatrix.lookAt(cam.dirt.x, cam.dirt.y, cam.dirt.z,
                   cam.posi.x, cam.posi.y, cam.posi.z,
                   cam.rote.x, cam.rote.y, cam.rote.z);

    var vpMatrix = new Matrix4();
    return vpMatrix.set(pMatrix).multiply(vMatrix);
};

// - class vector -
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

// ---- Main (Man) ----

function main() {
    var canvas = document.getElementById('webgl');
    config.aspect = canvas.width / canvas.height;
    gl = getWebGLContext(canvas);

    // init WebGL
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // init WebGL.shader
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
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

        init();
        
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

function init() {

  config.oCube = new obj3D(gl, cube);
  config.oGround = new obj3D(gl, ground);

  var cubeImgSrc = "./resources/woodtexture.png"
  config.obj_wood_texture = new texture3D(gl, texType.IMG, cubeImgSrc);

  var cubeImgSrc = "./resources/carbontexture.png"
  config.obj_carbon_texture = new texture3D(gl, texType.IMG, cubeImgSrc);  

  var cubeImgSrc = "./resources/firetexture.png"
  config.obj_fire_texture = new texture3D(gl, texType.IMG, cubeImgSrc);    

  var groundImgeSrc = "./resources/crackingtexture.png";
  config.obj_cracking_texture = new texture3D(gl, texType.IMG, groundImgeSrc);
};


config.cubeRotation = 0;

function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    drawCube();
    drawGround();

    // cubeRotation
    var currentTime = (new Date).getTime();
    if (config.rot_lastUpdateTime && config.counter_lastUpdateTime) {
        var delta = currentTime - config.rot_lastUpdateTime;
        config.cubeRotation += (30 * delta) / 1000.0;

        var delta = currentTime - config.counter_lastUpdateTime;
        if (delta > 1000) {
            config.timeCounter +=1;
            config.counter_lastUpdateTime = currentTime;
        }
    } else {
        config.counter_lastUpdateTime = currentTime;
    }
    config.rot_lastUpdateTime = currentTime;

    requestAnimationFrame(drawScene, gl, config.cubeTexture);
};

var cuboBuilderConfig = {
    len: 15,
    cubeNum: 5,
    initAngle: 0
}

var cubePos = (function cubePosBuilder(b) {
    var cubePos = new Array;
    var ang = b.initAngle;
    var rotateAngle = 2*Math.PI/b.cubeNum;
    for (var i=0; i<b.cubeNum; i++) {
        var pos = new vector(b.len * Math.cos(ang), b.len * Math.sin(ang), 0);
        cubePos.push(pos);
        ang += rotateAngle;
    }
    return cubePos;
})(cuboBuilderConfig);


config.timeCounter = 0;

function ctxhandle(canvas) {
    var ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#333333";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "12px monospace";

    ctx.fillText(config.timeCounter + ' seg', canvas.width / 2, canvas.height / 2);
}

function drawCube() {

    // -----------------  cubo 0 ---------------------- //
    config.timeTexture = new texture3D(gl, texType.TEXT, ctxhandle);
    var textures = [config.timeTexture.getTexture(), config.timeTexture.getTexture()];
    config.oCube.loadIntoShader(gl, shaderNames, textures);

    var mMatrix = new Matrix4();
    var pos = cubePos[0];
    mMatrix.translate(pos.x, pos.y, pos.z).rotate(config.cubeRotation, 0, 0, 1).rotate(config.cubeRotation, 0, 1, 0);
    config.oCube.draw(camera(), mMatrix);

    // -----------------  cubo 1 ---------------------- //
    var textures = [config.obj_wood_texture.getTexture(), config.obj_fire_texture.getTexture()];
    config.oCube.loadIntoShader(gl, shaderNames, textures);

    var mMatrix = new Matrix4();
    var pos = cubePos[1];
    mMatrix.translate(pos.x, pos.y, pos.z).rotate(config.cubeRotation, 0, 0, 1).rotate(config.cubeRotation, 0, 1, 0);
    config.oCube.draw(camera(), mMatrix);

    // -----------------  cubo 2 ---------------------- //
    var textures = [config.obj_carbon_texture.getTexture(), config.obj_carbon_texture.getTexture()];
    config.oCube.loadIntoShader(gl, shaderNames, textures);

    var mMatrix = new Matrix4();
    var pos = cubePos[2];
    mMatrix.translate(pos.x, pos.y, pos.z).rotate(config.cubeRotation, 0, 0, 1).rotate(config.cubeRotation, 0, 1, 0);
    config.oCube.draw(camera(), mMatrix);

    // -----------------  cubo 3 ---------------------- //
    var textures = [config.obj_wood_texture.getTexture(), config.obj_wood_texture.getTexture()];
    config.oCube.loadIntoShader(gl, shaderNames, textures);

    var mMatrix = new Matrix4();
    var pos = cubePos[3];
    mMatrix.translate(pos.x, pos.y, pos.z).rotate(config.cubeRotation, 0, 0, 1).rotate(config.cubeRotation, 0, 1, 0);
    config.oCube.draw(camera(), mMatrix);

    // -----------------  cubo 4 ---------------------- //
    var textures = [config.obj_carbon_texture.getTexture(), config.obj_cracking_texture.getTexture()];
    config.oCube.loadIntoShader(gl, shaderNames, textures);

    var mMatrix = new Matrix4();
    var pos = cubePos[4];
    mMatrix.translate(pos.x, pos.y, pos.z).rotate(config.cubeRotation, 0, 0, 1).rotate(config.cubeRotation, 0, 1, 0);
    config.oCube.draw(camera(), mMatrix);
};

function drawGround() {

    var textures = [config.obj_cracking_texture.getTexture(), config.obj_cracking_texture.getTexture()];

    config.oGround.loadIntoShader(gl, shaderNames, textures);

    var mMatrix = new Matrix4();

    mMatrix.translate(15.0, 0.0, -1.0).scale(50.0, 50.0, 1.0);

    config.oGround.draw(camera(), mMatrix);
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