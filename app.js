//Jacob Silveira
//CST-310
//Project4:
//7/17/22

//three main coordinates used, world cord, eye cord, and model cord
//Only lib file needed is gl-matrix.js
//using right hand coordinate space, Z axis pointing towards screen, Y axis pointing upwards
//rotation done about the origin


"use strict";

const GL = WebGLRenderingContext;
const PI = 3.14159265359;

//WebGLRenderingContext is gotten for the canvas
function getWebGLRenderingContext() {
    var canvasElement =
        document.getElementById("canvas"); //get relevant elements
    var gl =
        canvasElement.getContext("webgl"); //webgl context to work within
    if (gl === null) {
        throw "Could not get a WebGL context"; // if WebGL context isnt working for user
    }
    return gl;
}

//to compile a shader
//gl, webGLrenderingcontext gives context that the shader will be compiled with
//type: type of shader, vertex/fragment
//source: code for shader
function compileShader(gl, type, source) {
    var shaderHandle = gl.createShader(type);
    gl.shaderSource(shaderHandle, source);
    gl.compileShader(shaderHandle);
    if (gl.getShaderParameter(shaderHandle, GL.COMPILE_STATUS)) {
        return shaderHandle;
    } else {
        throw gl.getShaderInfoLog(shaderHandle);
    }
}


//prog obj that will link vertex shader handle and fragment handle
//gl: WebGLRenderingContext
//vertexShaderHandle: webglshader
//fragmentShanderHandle: webglshader
//then link shaders with the prog
function linkProgram(gl, vertexShaderHandle, fragmentShaderHandle) {
    var program = gl.createProgram();
    gl.attachShader(program, vertexShaderHandle);
    gl.attachShader(program, fragmentShaderHandle);
    gl.linkProgram(program);
    if (gl.getProgramParameter(program, GL.LINK_STATUS)) {
        return program;
    } else {
        throw gl.getProgramInfoLog(program);
    }
}

//loading texture onto the GPU
//gl: WebGLRenderingContext
//image: a HTMLImageElement
//handle will be a texture attribute for image
//referenced: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
function loadTexture(gl, image) {
    var textureHandle = gl.createTexture();
    gl.bindTexture(
        GL.TEXTURE_2D,
        textureHandle
    );
    gl.texImage2D(
        GL.TEXTURE_2D, //the image type
        0, //detail
        GL.RGBA, //GPU storage format
        GL.RGBA,
        GL.UNSIGNED_BYTE,
        image //actual image
    );
    gl.texParameteri( //parameter scaling for textures
        GL.TEXTURE_2D,
        GL.TEXTURE_MAG_FILTER,
        GL.NEAREST
    );
    gl.texParameteri(
        GL.TEXTURE_2D,
        GL.TEXTURE_MIN_FILTER,
        GL.NEAREST
    );
    gl.bindTexture(GL.TEXTURE_2D, null);
    image.textureHandle = textureHandle;
}

//main
function main() {
    var gl = getWebGLRenderingContext();
    //compiling shaders
    //elementID = "vertex-shader"
    //elementID = "fragment-shader"
    var vertexShaderElement =
        document.getElementById("vertex-shader");
    var fragmentShaderElement =
        document.getElementById("fragment-shader");
    var vertexShaderHandle = compileShader(
        gl,
        GL.VERTEX_SHADER,
        vertexShaderElement.text //text format shader
    );
    var fragmentShaderHandle = compileShader(
        gl,
        GL.FRAGMENT_SHADER,
        fragmentShaderElement.text
    );
    var program = linkProgram( //link
        gl,
        vertexShaderHandle,
        fragmentShaderHandle
    );
    gl.useProgram(program);

    //transforming coordinates from model to world, then world -> eye, and eye -> projection coordinates
    var modelMatrix_u =
        gl.getUniformLocation(program, "modelMatrix_u");
    var viewMatrix_u =
        gl.getUniformLocation(program, "viewMatrix_u");
    var projectionMatrix_u =
        gl.getUniformLocation(program, "projectionMatrix_u");
    var normalMatrix_u =
        gl.getUniformLocation(program, "normalMatrix_u");

    //init matrices
    var modelMatrix = mat4.create();
    var viewMatrix = mat4.create();
    var projectionMatrix = mat4.create();

    //reset matrices
    function resetModelMatrix() {
        modelMatrix = mat4.create();
    }
    resetModelMatrix();
    function resetViewMatrix() {
        viewMatrix = mat4.create();
    }
    resetViewMatrix();
    function resetProjectionMatrix() {
        projectionMatrix = mat4.create();
    }
    resetProjectionMatrix();
    function updateMatrices() {
        gl.uniformMatrix4fv(
            modelMatrix_u,
            false,
            modelMatrix
        );
        gl.uniformMatrix4fv(
            viewMatrix_u,
            false,
            viewMatrix
        );
        gl.uniformMatrix4fv(
            projectionMatrix_u,
            false,
            projectionMatrix
        );
        //norm matrix is dependent on other matrices
        var normalMatrix = mat3.create();
        var modelViewMatrix = mat4.create();
        modelViewMatrix = mat4.multiply(
            modelViewMatrix,
            modelMatrix,
            viewMatrix
        );
        mat3.fromMat4(normalMatrix, modelViewMatrix);
        mat3.invert(normalMatrix, normalMatrix);
        mat3.transpose(normalMatrix, normalMatrix);
        gl.uniformMatrix3fv(
            normalMatrix_u,
            false,
            normalMatrix
        );
    }
    //setting one camera point, add more later on viewTwo()
    //set intial eye perscpetive,
    //change eye height and position
    function viewOne() {
        mat4.lookAt(
            viewMatrix,
            vec3.fromValues(5.0, 2.0, -10.0),
            vec3.fromValues(-3.0, 1.0, 0.0),
            vec3.fromValues(0.0, 1.0, 0.0)
        );
        updateMatrices();
    }

    function viewTwo() {
        mat4.lookAt(
            viewMatrix,
            vec3.fromValues(0.0, 5.0, 10.0),
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(0.0, 1.0, 0.0)
        );
        updateMatrices();
    }

    function viewThree(){
        mat4.lookAt(
            viewMatrix,
            vec3.fromValues(-4.0, 4.0, -12.0),
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(0.0, 1.0, 0.0)
        );
        updateMatrices();
    }

    mat4.perspective(
        projectionMatrix,
        PI/4,
        gl.drawingBufferWidth/gl.drawingBufferHeight,
        0.5,
        100.0
    );

    //view one for now will always be default view
    viewOne();
    //pointers -> to vertex shader attributes
    var vertexPosition_a =
        gl.getAttribLocation(program, "vertexPosition_a");
    if (vertexPosition_a === -1) {
        throw "Unable to get position attribute";
    }
    gl.enableVertexAttribArray(vertexPosition_a);
    var vertexNormal_a =
        gl.getAttribLocation(program, "vertexNormal_a");
    if (vertexNormal_a === -1) {
        throw "Unable to get normal attribute";
    }
    gl.enableVertexAttribArray(vertexNormal_a);
    var textureCoordinates_a =
        gl.getAttribLocation(program, "textureCoordinates_a");
    if (textureCoordinates_a === -1) {
        throw "Unable to get texture attribute";
    }
    gl.enableVertexAttribArray(textureCoordinates_a);


    //for textures, embed select images
    var woodImage = document.getElementById("wood"); // change, dark blue fabric
    loadTexture(gl, woodImage);
    var metalImage = document.getElementById("metal"); //change,brn wood
    loadTexture(gl, metalImage);
    var floorImage = document.getElementById("floor"); //change, drk brn wood
    loadTexture(gl, floorImage);
    var tvImage = document.getElementById("tv"); //change, drk brn wood
    loadTexture(gl, tvImage);


    //create buffer
    var textureCoordinatesBuffer = gl.createBuffer();
    gl.bindBuffer(GL.ARRAY_BUFFER, textureCoordinatesBuffer);
    gl.bufferData(GL.ARRAY_BUFFER, new Float32Array([
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        1.0, 1.0,

        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        1.0, 1.0,

        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        1.0, 1.0,

        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        1.0, 1.0,

        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        1.0, 1.0,

        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        1.0, 1.0,

        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        1.0, 1.0,

        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        1.0, 1.0,

        //draw
    ]), GL.STATIC_DRAW);
    textureCoordinatesBuffer.item_size = 2;
    textureCoordinatesBuffer.number_of_items = 32;
    gl.vertexAttribPointer(
        textureCoordinates_a,
        textureCoordinatesBuffer.item_size,
        GL.FLOAT, false, 0, 0
    );


    // for lighting
    var normalMatrix_u =
        gl.getUniformLocation(program, "normalMatrix_u");
    var lightingDirection_u =
        gl.getUniformLocation(program, "lightingDirection_u");

    //ambient lighting
    var ambientColor_u =
        gl.getUniformLocation(program, "ambientColor_u");

    var directionalColour_u =
        gl.getUniformLocation(program, "directionalColour_u");

    //light colors
    gl.uniform3f(
        ambientColor_u,
        0.7,
        0.3,
        0.4
    );



    gl.uniform3f(
        directionalColour_u, //directional color
        0.8, //red
        0.7, //green
        0.8 //blue
    );

    // lighting direction
    var lightingDirection = vec3.fromValues(1.0, -1.0, 0.0);
    var normalisedLightingDirection = vec3.create();
    vec3.normalize(
        normalisedLightingDirection,
        lightingDirection
    );
    vec3.scale(
        normalisedLightingDirection,
        normalisedLightingDirection,
        -1
    );
    console.log("Normalised lighting direction: " + normalisedLightingDirection[0] + "," + normalisedLightingDirection[1] + "," + normalisedLightingDirection[2]);
    gl.uniform3fv(lightingDirection_u, normalisedLightingDirection);


    // color buffer
/*            var colorBuffer = gl.createBuffer();
            gl.bindBuffer(GL.ARRAY_BUFFER, colorBuffer);
            gl.bufferData(GL.ARRAY_BUFFER, new Float32Array([
                1.0, 0.0, 0.0, 1.0,
                1.0, 0.0, 0.0, 1.0,
                1.0, 0.0, 0.0, 1.0,

                0.0, 1.0, 0.0, 1.0,
                0.0, 1.0, 0.0, 1.0,
                0.0, 1.0, 0.0, 1.0,

                0.0, 0.0, 1.0, 1.0,
                0.0, 0.0, 1.0, 1.0,
                0.0, 0.0, 1.0, 1.0,

                1.0, 1.0, 1.0, 1.0,
                1.0, 1.0, 1.0, 1.0,
                1.0, 1.0, 1.0, 1.0,

                1.0, 1.0, 0.0, 1.0,
                1.0, 1.0, 0.0, 1.0,
                1.0, 1.0, 0.0, 1.0,

                0.0, 1.0, 1.0, 1.0,
                0.0, 1.0, 1.0, 1.0,
                0.0, 1.0, 1.0, 1.0,

                0.0, 0.0, 1.0, 1.0,
                0.0, 0.0, 1.0, 1.0,
                0.0, 0.0, 1.0, 1.0,

                1.0, 1.0, 1.0, 1.0,
                1.0, 1.0, 1.0, 1.0,
                1.0, 1.0, 1.0, 1.0,
            ]), GL.STATIC_DRAW);
            colorBuffer.item_size = 4;
            colorBuffer.number_of_items = 24;
            gl.vertexAttribPointer(
                    vertexColour_a,
                    colorBuffer.item_size,
                    GL.FLOAT, false, 0, 0
            );
*/


    //drawing a specified buffer
    //gl: WebGLRenderContext
    //positionBuffer: WebGLBuffer, with item size, number of attribs, and norm buffer attrib
    //string tells object which texture to use, whichTexture
    function draw(gl, positionBuffer, whichTexture) {
        gl.activeTexture(GL.TEXTURE0);
        if (whichTexture === "wood") {
            gl.bindTexture(GL.TEXTURE_2D, woodImage.textureHandle); //coffee table
        } else if (whichTexture === "metal") {
            gl.bindTexture(GL.TEXTURE_2D, metalImage.textureHandle); //tv/table
        } else if (whichTexture === "floor") {
            gl.bindTexture(GL.TEXTURE_2D, floorImage.textureHandle); //wood floor
        } else if (whichTexture == "tv") {
            gl.bindTexture(GL.TEXTURE_2D, tvImage.textureHandle); //static tv
        }
        var sampler_u = gl.getUniformLocation(program, "sampler_u");
        if (!sampler_u) throw "Unable to get sampler handle";
        gl.uniform1i(sampler_u, 0); // use texture 0

        //update
        updateMatrices();
        if (!normalBuffer) {
                var normalBuffer = gl.createBuffer();
                gl.bindBuffer(GL.ARRAY_BUFFER, normalBuffer);
                gl.bufferData(GL.ARRAY_BUFFER, new Float32Array([
                    0.0, -1.0, 0.0,
                    1.0, -1.0, 0.0,
                    1.0, 0.0, 0.0,

                    0.0, -1.0, 0.0,
                    1.0, 0.0, 0.0,
                    0.0, 0.0, 0.0,

                    0.0, 0.0, 0.0,
                    1.0, 0.0, 0.0,
                    0.0, 1.0, 0.0,

                    1.0, 0.0, 0.0,
                    1.0, 1.0, 0.0,
                    0.0, 1.0, 0.0,

                    0.0, 0.0, 0.0,
                    1.0, 0.0, 0.0,
                    0.0, 0.0, 1.0,

                    1.0, 0.0, 0.0,
                    0.0, 0.0, 1.0,
                    1.0, 0.0, 1.0,

                    0.0, 0.0, 1.0,
                    1.0, 0.0, 1.0,
                    0.0, -1.0, 1.0,

                    1.0, 0.0, 1.0,
                    1.0, -1.0, 1.0,
                    0.0, -1.0, 1.0,
                ]), GL.STATIC_DRAW);
                normalBuffer.item_size = 3;
                normalBuffer.number_of_items = 24;
        }

        gl.vertexAttribPointer(
            vertexNormal_a,
            normalBuffer.item_size,
            GL.FLOAT, false, 0, 0
        );

        gl.bindBuffer(GL.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(
            vertexPosition_a,
            positionBuffer.item_size,
            GL.FLOAT, false, 0, 0
        );

        gl.drawArrays(
            GL.TRIANGLES,
            0,
            positionBuffer.number_of_items
        );

        //clean
        gl.bindBuffer(GL.ARRAY_BUFFER, null);
        gl.bindTexture(GL.TEXTURE_2D, null);
    }


    function drawScene(tvHeight) {
        // set up the canvas for drawing
        gl.enable(GL.DEPTH_TEST);
        gl.clearColor(0.0, 0.0, 0.6, 0.4);  //the background colour, light blue
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

        //a set of two chairs for a futon for now and a table as the living room coffee table, altering for movement
        for (var i = 0; i < 1; i++) {

            //tv position
            var defaultMatrix = mat4.create();
            mat4.translate(defaultMatrix, defaultMatrix,
                vec3.fromValues(0, 0, -i*5)
            );

            for (var j = 0; j < 2; j++) {

                //chair position
                mat4.translate(modelMatrix, modelMatrix,
                    vec3.fromValues(-2.5, 0, 0)
                );
                draw(gl, chair(gl), "wood");
                mat4.copy(modelMatrix, defaultMatrix);

                // table position
                mat4.translate(modelMatrix, modelMatrix,
                    vec3.fromValues(-2.2, 0, 2)
                );
                draw(gl, table(gl), "metal");
                mat4.copy(modelMatrix, defaultMatrix);
            }
        }

        //draw tv
        resetModelMatrix();
        mat4.translate(modelMatrix, modelMatrix,
            vec3.fromValues(-3.5, -1.0, 5.0)
        );
        draw(gl, tv(gl, tvHeight), "tv");
        mat4.translate(modelMatrix, modelMatrix,
            vec3.fromValues(-3.0, 0.0, 2)
        );
        mat4.scale(modelMatrix, modelMatrix,
            vec3.fromValues(2, 0, 3)
        )
        draw(gl, floor(gl), "floor");
    }
    drawScene();

    //---------------------------addition-------------------------------//


    //key press handler
    document.onkeydown = function(keyboardEvent){
        console.log("Pressed: " + keyboardEvent.keyCode);
        var tvHeight = 3;
        if (keyboardEvent.keyCode === 81) {
            console.log("view 1");
            viewOne();
        } else if (keyboardEvent.keyCode === 87) {
            console.log("view 2");
            viewTwo();
        } else if (keyboardEvent.keyCode === 69){
            console.log("view 3");
            viewThree();
        }
        drawScene(tvHeight);
    }


}


//chair function
//fill buffer with chair cords
function chair(gl) { //WebGL context
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(GL.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(GL.ARRAY_BUFFER, new Float32Array([
        //back bottom
        (-1.5), 0.0,  0.0,
        (1.5),  0.0,  0.0,
        (2.0), -1.0,  0.0,

        (-1.5),  0.0,  0.0,
        (2.0),  -1.0,  0.0,
        (-2.0), -1.0,  0.0,

        // back rest
        -2.0,  0.0,  0.0,
        2.5,  0.0,   0.0,
        -2.0,  1.0,  0.0,

        2.5,  0.0,  0.0,
        -2.0, 1.0,  0.0,
        2.5,  1.0,  0.0,

        // seat
        0.0,  0.0,  0.0,
        1.0,  0.0,  0.0,
        0.0,  0.0,  1.0,

        1.0,  1.0,  0.0,
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,

        // front bottom
        (-1.5), 0.0,  1.0,
        (1.5),  0.0,  1.0,
        (2.0), -1.0,  1.0,

        (-1.5),  0.0,  1.0,
        (2.0),  -1.0,  1.0,
        (-2.0), -1.0,  1.0,

    ]), GL.STATIC_DRAW);
    positionBuffer.item_size = 3;
    positionBuffer.number_of_items = 24;


    positionBuffer.normalBuffer = gl.createBuffer();
    gl.bindBuffer(GL.ARRAY_BUFFER, positionBuffer.normalBuffer);
    gl.bufferData(GL.ARRAY_BUFFER, new Float32Array([
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,

        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,

        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,

        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,

        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,

        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,

        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,

        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
    ]), GL.STATIC_DRAW);
    positionBuffer.normalBuffer.item_size = 3;
    positionBuffer.normalBuffer.number_of_items = 24;

    return positionBuffer;
}

function table(gl) {
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(GL.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(GL.ARRAY_BUFFER, new Float32Array([
        // left legs
        0.0,  0.0,  0.0,
        0.0, -1.0,  0.0,
        0.0,  0.0,  1.0,

        0.0,  0.0,  1.0,
        0.0,  0.0,  2.0,
        0.0, -1.0,  2.0,

        // surface
        0.0,  0.0,  0.0,
        0.0,  0.0,  2.0,
        2.0,  0.0,  2.0,

        0.0,  0.0,  0.0,
        2.0,  0.0,  0.0,
        2.0,  0.0,  2.0,

        // right legs
        2.0,  0.0,  0.0,
        2.0, -1.0,  0.0,
        2.0,  0.0,  1.0,

        2.0,  0.0,  1.0,
        2.0,  0.0,  2.0,
        2.0, -1.0,  2.0
    ]), GL.STATIC_DRAW);
    positionBuffer.item_size = 3;
    positionBuffer.number_of_items = 18;

    positionBuffer.normalBuffer = gl.createBuffer();
    gl.bindBuffer(GL.ARRAY_BUFFER, positionBuffer.normalBuffer);
    gl.bufferData(GL.ARRAY_BUFFER, new Float32Array([

        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,

        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,

        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,

        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,

        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,

        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,

    ]), GL.STATIC_DRAW);
    positionBuffer.normalBuffer.item_size = 3;
    positionBuffer.normalBuffer.number_of_items = 24;

    return positionBuffer;
}

function tv(gl, height) {
    height = height || 3;
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(GL.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(GL.ARRAY_BUFFER, new Float32Array([
        0.0, 0.0, 0.0,
        0.0, 1.0, 0.0,
        2.0, 1.0, 0.0,

        4.0, 0.0, 0.0,
        4.0, 1.0, 0.0,
        2.0, 1.0, 0.0,

        0.0, height, 0.0, //height here for possiblity of later being able to contol the size of the tv like a projector
        0.0, 1.0, 0.0,
        4.0, 1.0, 0.0,

        0.0, height, 0.0,
        4.0, 1.0, 0.0,
        4.0, height, 0.0

    ]), GL.STATIC_DRAW);

    positionBuffer.item_size = 3;
    positionBuffer.number_of_items = 12;
    positionBuffer.normalBuffer = gl.createBuffer();
    gl.bindBuffer(GL.ARRAY_BUFFER, positionBuffer.normalBuffer);
    gl.bufferData(GL.ARRAY_BUFFER, new Float32Array([
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,
    ]), GL.STATIC_DRAW);
    positionBuffer.normalBuffer.item_size = 3;
    positionBuffer.normalBuffer.number_of_items = 24;

    return positionBuffer;
}

function floor(gl) {
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(GL.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(GL.ARRAY_BUFFER, new Float32Array([
        0.0, 0.0, 0.0,
        0.0, 0.0, -5.0,
        5.0, 0.0, -5.0,

        0.0, 0.0, 0.0,
        5.0, 0.0, -5.0,
        5.0, 0.0, 0.0,
    ]), GL.STATIC_DRAW);
    positionBuffer.item_size = 3;
    positionBuffer.number_of_items = 6;

    positionBuffer.normalBuffer = gl.createBuffer();
    gl.bindBuffer(GL.ARRAY_BUFFER, positionBuffer.normalBuffer);
    gl.bufferData(GL.ARRAY_BUFFER, new Float32Array([
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
    ]), GL.STATIC_DRAW);
    positionBuffer.normalBuffer.item_size = 3;
    positionBuffer.normalBuffer.number_of_items = 24;

    return positionBuffer;
}