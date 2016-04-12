
/*  -------------
    - 3D Object -
    -------------
*/

function obj3D(gl, objData) {
    this.data = objData;
    this.gl = gl;

    // -- Debug Detect --
    var method = ['vertices', 'textureCoord', 'indices'];
    var self = this;
    method.forEach(function(x) {
        if (!self.data.hasOwnProperty(x)) {
            throw new Error('<objData> has not method "' + x + '"');
        }
    });

    // num vertices
    this.numElements = this.data.indices.length;

    // init buffer
    this.buffers = {
        vertices: addBuffer(gl, this.data.vertices, gl.ARRAY_BUFFER, gl.STATIC_DRAW),
        textureCoord: addBuffer(gl, this.data.textureCoord, gl.ARRAY_BUFFER, gl.STATIC_DRAW),
        indices: addBuffer(gl, this.data.indices, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW)
    };

    //mvp
    this.mvpShaderName = undefined;
}

// add Buffer
function addBuffer(gl, methodDat, buffType, dataStoreType) {
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return false;
    }
    gl.bindBuffer(buffType, buffer);
    gl.bufferData(buffType, methodDat, dataStoreType);
    return buffer;
};

function setAttribute(attribute, num, type, bufferName, bufferType) {
    var a_attr = gl.getAttribLocation(gl.program, attribute);
    if (a_attr < 0) {
        console.log('Failed to get the storage location of ' + attribute);
        return false;
    }
    gl.enableVertexAttribArray(a_attr);

    gl.bindBuffer(bufferType, bufferName);
    gl.vertexAttribPointer(a_attr, num, type, false, 0, 0);
    // return true;
};


/* shaderNames = {mvpMatrix: , 
                  vertices: , 
                  textureCoord: , 
                  imgs: [shader_u_img_Name01, shader_u_img_Name02, ...]};
   textures    =         img_texture_Name_01, img_texture_Name_02, ... */
obj3D.prototype.loadIntoShader = function (gl, shaderNames, textures) {

    this.mvpShaderName = shaderNames.mvpMatrix;
    setAttribute(shaderNames.vertices, 3, gl.FLOAT, this.buffers.vertices, gl.ARRAY_BUFFER);
    setAttribute(shaderNames.textureCoord, 2, gl.FLOAT, this.buffers.textureCoord, gl.ARRAY_BUFFER);

    shaderNames.imgs.forEach(function(x, i) {
        layer = gl.TEXTURE0 + i;
        gl.activeTexture(layer);
        gl.bindTexture(gl.TEXTURE_2D, textures[i]);
        gl.uniform1i(gl.getUniformLocation(gl.program, x), i);
    });

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.indices);

};

obj3D.prototype.draw = function (vpMatrix, mMatrix) {
    var u_MvpMatrix = gl.getUniformLocation(gl.program, this.mvpShaderName);
    if (!u_MvpMatrix) {
        console.log('Failed to get the storage location of ' + this.mvpShaderName);
        return;
    }

    var mvpMatrix = new Matrix4();
    mvpMatrix.set(vpMatrix).multiply(mMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawElements(gl.TRIANGLES, this.numElements, gl.UNSIGNED_SHORT, 0);
};


/* 
    -----------
    - Texture -
    -----------
*/

var texType = {
    TEXT: 'Texture_Image',
    IMG: 'Texture_Txt'
};


function create_canvas() {
    var canvas = document.getElementById('textureCanvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = "textureCanvas";
        canvas.style = "display: none;";
        canvas.width = 128;
        canvas.height = 128;
        canvas.innerHTML = 'I\'m sorry your browser does not support the HTML5 canvas element.';
        document.body.appendChild(canvas);
    }
    return canvas;
}

function default_ctx_handle(texImage) {
    ctx = texImage.getContext('2d');

    ctx.fillStyle = "#333333";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "12px monospace";

    ctx.fillText('Hello world.', texImage.width / 2, texImage.height / 2);
}


function texture3D(gl, type, stx, defaultColor) {
    this.defaultColor = defaultColor || [0, 255, 0, 255];

    // --- texture ---
    this.texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(this.defaultColor));


    if (type == texType.IMG) {
        var texImage = new Image();
        var self = this;
        texImage.onload = function() { handleTextureLoaded(gl, self.texture, texImage); }
        texImage.src = stx;
    } else if (type == texType.TEXT) {
        var texImage = create_canvas();
        
        stx = stx || default_ctx_handle;
        stx(texImage);

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        handleTextureLoaded(gl, this.texture, texImage);
    } else {
        throw new Error('Type Error !!! (texType.IMG or texType.TEXT).');
    }
}

function handleTextureLoaded(gl, texture, image) {
    // console.log("handleTextureLoaded, image = " + image);
    // console.log('\tgl:',gl, '\n\ttexture:', texture, '\n\timage:',image);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
};

texture3D.prototype.getTexture = function(){
     return this.texture;
};