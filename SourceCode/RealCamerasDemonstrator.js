
var Application = Application || {};

Application.RealCamerasDemonstrator = (function () {

	function RealCamerasDemonstrator () {

// TODO:
		// ACM p.13
		var aspect = 2.35; // 1.85; 

		this.canvasWidth = window.innerWidth;
		this.canvasHeight = this.canvasWidth / aspect;
		this.canvasOffset = Math.max(0, 0.5 * (window.innerHeight - this.canvasHeight));

		// this.devicePixelRatio = window.devicePixelRatio || 1,

        this.renderer = null;
        this.camera = null;
        this.scene = null;
        this.light = null;
        this.controls = null;

        this.postprocessing = {};
        this.bokehPassConfiguration = null;
		this.bokehPassDepthMapSource = null;
		this.gui = null;

        this.requestedAnimationFrameId = null;

        privateMethods.init.call(this);
	};
	// inherit interface if needed here ...
	RealCamerasDemonstrator.prototype.destroy = function () {

// TODO:
		if (this.requestedAnimationFrameId) {

            window.cancelAnimationFrame(this.requestedAnimationFrameId);
            this.requestedAnimationFrameId = null;
        }
	};
	RealCamerasDemonstrator.prototype.setUpScene = function (meshes) {

		for (var i = 0; i < meshes.length; ++i) {

			var mesh = meshes[i];
			// [.WebGLRenderingContext-0x7ffddb4584f0]GL ERROR :GL_INVALID_VALUE : LineWidth: width out of range
			// Application.Debuger.addAxes(mesh);
			this.scene.add(mesh);
		}
	};
	RealCamerasDemonstrator.prototype.setUpBokehPass = function (passId) {

		var configuration = Application.ShaderPassConfigurator.configuration(passId);
		if (!configuration)
			return;

		this.bokehPassConfiguration = configuration;

		var shader = this.bokehPassConfiguration.shader;
		var textureId = this.bokehPassConfiguration.textureId;

		// bokeh pass
		var bokehPass = new THREE.ShaderPass(shader, textureId);
		bokehPass.uniforms["tDepth"].value = this.bokehPassDepthMapSource;
		bokehPass.renderToScreen = true;

		if (this.postprocessing.composer.passes.length > 1) {

			this.postprocessing.composer.popPass();
			this.postprocessing.composer.reset();	
		}
		this.postprocessing.composer.addPass(bokehPass);
		this.bokehPassConfiguration.bokehPass = bokehPass;

// mark -

		// set initial values
		privateMethods.settingsUpdater.call(this);

		// set up gui
		privateMethods.setUpGui.call(this);
	};

	var privateMethods = Object.create(RealCamerasDemonstrator.prototype);
	privateMethods.init = function(){

		privateMethods.initRenderer.call(this);
		privateMethods.initScene.call(this);
		privateMethods.initCamera.call(this);

		privateMethods.initPostprocessing.call(this);

		privateMethods.animate.call(this);
	};

	privateMethods.initRenderer = function () {

		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setSize(this.canvasWidth, this.canvasHeight);

		var container = document.createElement("div");
		container.appendChild(this.renderer.domElement);
		document.body.appendChild(container);

		container.style.position = "absolute";
		container.style.width = this.canvasWidth + "px";
		container.style.top = this.canvasOffset + "px";
	};
	privateMethods.initCamera = function () {

		// fov is calculated and set in setLens based on fame size and focal length
		var emptyFov = 0.;
		var near = 0.01;
		var far = 1000;
		this.camera = new THREE.PerspectiveCamera(emptyFov, this.canvasWidth / this.canvasHeight, near, far);

		this.camera.focalLength = 45;
		this.camera.frameSize = 32;
		this.camera.setLens(this.camera.focalLength, this.camera.frameSize);

		this.camera.position.set(0, 0, 0);
		this.camera.rotation.set(0, 0, 0);
		privateMethods.initControls.call(this);	
	};

	privateMethods.initScene = function() {

		this.scene = new THREE.Scene();
		privateMethods.initLight.call(this);
	};
	privateMethods.initLight = function () {

// TODO:
		// var dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
		// dirLight.color.setHSL(0.1, 1, 0.95);
		// dirLight.position.set(0, 1.75, 1);
		// dirLight.position.multiplyScalar(50);

		// // dirLight.castShadow = true;

		// // dirLight.shadowMapWidth = 2048;
		// // dirLight.shadowMapHeight = 2048;

		// // var d = 10;

		// // dirLight.shadowCameraLeft = -d;
		// // dirLight.shadowCameraRight = d;
		// // dirLight.shadowCameraTop = d;
		// // dirLight.shadowCameraBottom = -d;

		// // dirLight.shadowCameraFar = 3500;
		// // dirLight.shadowBias = -0.0001;
		// // dirLight.shadowDarkness = 0.35;
		// // dirLight.shadowCameraVisible = true;
		
		// this.light = dirLight

		this.light = new THREE.HemisphereLight(0xffDDDD, 0x000000, 0.6);
		this.light.position.set(0, 40, 0);

	    this.scene.add(this.light);
	};
	privateMethods.initControls = function () {

		this.controls = new THREE.PointerLockControls(this.camera);
		this.controls.enabled = true;

		this.scene.add(this.controls.getObject());
	};
	privateMethods.initPostprocessing = function() {

		// intermediate renderer targets
		this.bokehPassDepthMapSource = new THREE.WebGLRenderTarget(this.canvasWidth, this.canvasHeight, {

			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter,
			format: THREE.RGBAFormat
		});

		this.postprocessing.composer = new THREE.EffectComposer(this.renderer);

		// render pass
		var renderPass = new THREE.RenderPass(this.scene, this.camera);
		this.postprocessing.composer.addPass(renderPass);		
	};

	privateMethods.setUpGui = function () {

		if (this.gui) {

			this.gui.domElement.parentNode.removeChild(this.gui.domElement);
		} 
		this.gui = new dat.GUI();
	
		
		var settings = this.bokehPassConfiguration.settings;
		for (var param in settings) {
			if (settings.hasOwnProperty(param)) {

				if (settings[param].range !== undefined) {

					var begin = settings[param].range.begin;
					var end = settings[param].range.end;
					var step = settings[param].range.step;

					this.gui.add(settings[param], "value", begin, end, step).name(param)
					.onChange(privateMethods.settingsUpdater.bind(this));
				} else if (settings[param].show !== undefined && settings[param].show === true) {

					this.gui.add(settings[param], "value").name(param)
					.onChange(privateMethods.settingsUpdater.bind(this));
				}
			}
		}
		this.gui.open();
	};
	privateMethods.settingsUpdater = function () {

		this.bokehPassConfiguration.update(this.camera);

		var settings = this.bokehPassConfiguration.settings;	
		for (var param in settings) {
			if (settings.hasOwnProperty(param)) {

				this.bokehPassConfiguration.bokehPass.uniforms[param].value = settings[param].value;
			}
		}
	};

	privateMethods.animate = function () {

		privateMethods.render.call(this);
		this.requestedAnimationFrameId = window.requestAnimationFrame(privateMethods.animate.bind(this));
	};
	privateMethods.render = function () {

		if (this.bokehPassConfiguration) {

			// depth into texture rendering
			this.scene.overrideMaterial = this.bokehPassConfiguration.material;
			this.renderer.render(this.scene, this.camera, this.bokehPassDepthMapSource);
			this.scene.overrideMaterial = null;

			// on screen rendering
			this.postprocessing.composer.render(0.1);
		} else {

			// on screen rendering
			this.scene.overrideMaterial = null;
			this.renderer.render(this.scene, this.camera);
		}
	};

	return RealCamerasDemonstrator;
})(); 

// DoFFolder.add(uniforms.manualdof, 'value').name('Manual DoF');
// DoFFolder.add(uniforms.ndofstart, 'value', 0, 200).name('near start');
// DoFFolder.add(uniforms.ndofdist, 'value', 0, 200).name('near falloff');
// DoFFolder.add(uniforms.fdofstart, 'value', 0, 200).name('far start');
// DoFFolder.add(uniforms.fdofdist, 'value', 0, 200).name('far falloff');

// DoFFolder.add(uniforms.vignetting, 'value').name('Vignetting');
// DoFFolder.add(uniforms.vignout, 'value', 0, 2).name('outer border');
// DoFFolder.add(uniforms.vignin, 'value', 0, 1).step(0.01).name('inner border');
// DoFFolder.add(uniforms.vignfade, 'value', 0, 22).name('fade at');


// DoFFolder.add(uniforms.focus.value, 'x', 0.0, 1.0, 0.01).name('Focus - x');
// DoFFolder.add(uniforms.focus.value, 'y', 0.0, 1.0, 0.01).name('Focus - y');

// DoFFolder.add(uniforms.threshold, 'value', 0, 1).step(0.01).name('threshold');
// DoFFolder.add(uniforms.gain, 'value', 0, 100).name('gain');

// DoFFolder.add(uniforms.bias, 'value', 0, 4).step(0.01).name('bias');
// DoFFolder.add(uniforms.fringe, 'value', 0, 5).step(0.01).name('fringe');

// DoFFolder.add(uniforms.noise, 'value').name('Use Noise');
// DoFFolder.add(uniforms.namount, 'value', 0, 0.001).step(0.0001).name('dither');

// DoFFolder.add(uniforms.depthblur, 'value').name('Blur Depth');
// DoFFolder.add(uniforms.dbsize, 'value', 0, 5).name('blur size');

