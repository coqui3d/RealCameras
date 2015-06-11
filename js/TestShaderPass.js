THREE.BokehPass = function ( scene, camera, params ) {

	this.scene = scene;
	this.camera = camera;

//ADD HERE
	var focallen = ( params.focallen !== undefined ) ? params.foocalen : 15.0;
	var aperture = ( params.aperture !== undefined ) ? params.aperture : 1.8;
	var coc = ( params.coc !== undefined ) ? params.coc : 0.001;
	var focusdis = (params.focusdis != undefined)? params.focusdis : 20;

	var hyper = ((Math.pow(focallen,2))/(aperture*coc)) + params.focallen;
	hyper = hyper/1000;

	var near;
	var far;
	if (focusdis >= hyper){
		far = -1;
		near = (hyper/2).toFixed(2);
	}
	else {
		near = ((hyper*focusdis)/(hyper + (focusdis - (focallen)/1000))).toFixed(2);
		far = ((hyper*focusdis)/(hyper - (focusdis - (focallen)/1000))).toFixed(2);
	}


	// render targets

	var width = params.width || window.innerWidth || 1;
	var height = params.height || window.innerHeight || 1;

	this.renderTargetColor = new THREE.WebGLRenderTarget( width, height, {
		minFilter: THREE.LinearFilter,
		magFilter: THREE.LinearFilter,
		format: THREE.RGBFormat
	} );

	this.renderTargetDepth = this.renderTargetColor.clone();

	// depth material

	this.materialDepth = new THREE.MeshDepthMaterial();

	// bokeh material

	if ( THREE.TestShader === undefined ) {
		console.error( "THREE.BokehPass relies on THREE.BokehShader" );
	}
	
	var bokehShader = THREE.TestShader;
	var bokehUniforms = THREE.UniformsUtils.clone( bokehShader.uniforms );

//ADD HERE
	bokehUniforms[ "tDepth" ].value = this.renderTargetDepth;

	bokehUniforms["textureWidth"].value = width;
	bokehUniforms["textureHeight"].value = height;

	console.log(hyper);
	bokehUniforms[ "dfar" ].value = far;
	bokehUniforms[ "dnear" ].value = near;

	this.materialBokeh = new THREE.ShaderMaterial({
		uniforms: bokehUniforms,
		vertexShader: bokehShader.vertexShader,
		fragmentShader: bokehShader.fragmentShader
	});

	this.uniforms = bokehUniforms;
	this.enabled = true;
	this.needsSwap = false;
	this.renderToScreen = false;
	this.clear = false;

	this.camera2 = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
	this.scene2  = new THREE.Scene();

	this.quad2 = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), null );
	this.scene2.add( this.quad2 );

};

THREE.BokehPass.prototype = {

	render: function ( renderer, writeBuffer, readBuffer, delta, maskActive ) {

		this.quad2.material = this.materialBokeh;

		// Render depth into texture

		this.scene.overrideMaterial = this.materialDepth;

		renderer.render( this.scene, this.camera, this.renderTargetDepth, true );

		// Render bokeh composite

		this.uniforms[ "tColor" ].value = readBuffer;

		if ( this.renderToScreen ) {

			renderer.render( this.scene2, this.camera2 );

		} else {

			renderer.render( this.scene2, this.camera2, writeBuffer, this.clear );

		}

		this.scene.overrideMaterial = null;

	}

};