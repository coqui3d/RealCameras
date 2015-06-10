
//variables
var container, canvas;
var camera, scene, renderer;
var postprocessing ={};

function init() {

	var canvasWidth = window.innerWidth;
	var canvasHeight = window.innerHeight;
	var canvasRatio = canvasWidth/canvasHeight;

	renderer = new THREE.WebGLRenderer();
	renderer.setSize(canvasWidth, canvasHeight);
	document.body.appendChild(renderer.domElement);

	//create scene and camera
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(45, canvasRatio, 1, 1000);
	camera.position.set(0,20,0);

	//load character and use a loop to place each character a set amount of spaces 
	//for the other ones, then place all models in a object 3D so that you can move them all
	//at the same time without messing up spacing 

	var loader = new THREE.OBJMTLLoader();
	var person;
	var group = new THREE.Object3D();
	
	loader.load('../Resources/TestHuman.obj','../Resources/TestHuman.mtl',function (obj){
		//making each indviual model just change thses vars to change how many to load and spacing
		//between them
		var howmany = 5;
		var xspace = 3;
		var zspace = 2;	
		var xstart = -5;
		var zstart = 0;

		for (var i=0; i<howmany; i++){
			var person = obj.clone();
			person.position.set(xstart +(i*xspace),0,zstart-(i*zspace));
			//don't change the scale (has been scaled so that one unit is one feet)
			person.scale.set(0.4,0.4,0.4);
			group.add(person);
		}
	});
	//adding whole group(can change position of group here)
	scene.add(group);

	//create unit box to test size of humans
	var box = new THREE.BoxGeometry(1,1,1);
	var unitbox = new THREE.Mesh(box, new THREE.MeshPhongMaterial({color: 0xFF0000}));
	unitbox.position.set(-0.5,0.5,-10.5);
	scene.add(unitbox);


	//create wall and ground
	var geometry = new THREE.BoxGeometry(40,0.1,40);

	var texture = new THREE.ImageUtils.loadTexture("../Resources/checker.png");
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(20,20);

	var material = new THREE.MeshLambertMaterial({map: texture});

	//create floor and walls
	var cube = new THREE.Object3D();
	for (var i=0; i<4; i++){
		var plane = new THREE.Mesh(geometry, material);
		switch(i){
			case 0:
				//floor
				break;
			case 1:
				//back wall
				plane.position.set(0,0,-20);
				plane.rotation.x = 90 *Math.PI/180;
				break;
			case 2:
				//left side
				plane.position.set(-20,0,0);
				plane.rotation.z = 90 *Math.PI/180;
				break;
			case 3:
				//right side
				plane.position.set(20,0,0);
				plane.rotation.z = 90 *Math.PI/180;
				break;
		}
		cube.add(plane);
	}
	
	//add to scene
	scene.add(cube);

	//lights
	var hemiLight = new THREE.HemisphereLight( 0xffDDDD, 0x000000, 0.6 );
    hemiLight.position.set( 0, 500, 0 );
    scene.add( hemiLight );

    window.addEventListener( 'resize', onWindowResize, false );

   initPostprocessing();

    //variables used in gui
    var gui, camfolder, lenfolder, userfolder, cam;
 
 	var params = {
 		format: '16mm',
 		focallen: 10,
    	horsize: 10.26,
    	versize: 7.49,
    	circleofconf:0.0127,
    	focusdis:10,
    	aperture: 8
    };

    var Changer = function(){
    	var hyper = ((Math.pow(params.focallen,2))/(params.aperture*params.circleofconf)) + params.focallen;
		hyper = hyper/1000;

		console.log(hyper);
		var near;
		var far;
		if (params.focusdis >= hyper){
		far = 100000.0;
		near = (hyper/2).toFixed(2);
		}
		else {
		near = ((hyper*params.focusdis)/(hyper + (params.focusdis - (params.focallen)/1000))).toFixed(2);
		far = ((hyper*params.focusdis)/(hyper - (params.focusdis - (params.focallen)/1000))).toFixed(2);
		}

		console.log("NEar" + near);
		console.log("far" + far);
    	postprocessing.boken.uniforms["dfar"].value = far;
    	postprocessing.boken.uniforms["dnear"].value = near;

    	
//add here
    }


    //make gui here
	gui=new dat.GUI();

    camfolder= gui.addFolder('Camera');
    $.getJSON("./Json/data.json", function(data) {
 		var listcams =[];
 		var ind= [];
 		$.each(data, function(name, value){
 			$.each(value, function(index, innervalue){
 		 		listcams.push(innervalue.format);
 			 });
 		});
 		cam=camfolder.add(params, 'format', listcams);
 		cam.onChange(function(value){
  			var i = listcams.indexOf(value);
  			params.horsize = data.cameras[i].Dimensions[0];
  			params.versize = data.cameras[i].Dimensions[1];
  			params.circleofconf = data.cameras[i].circleofconf;
  	//		Changer();
  			});
	});
	camfolder.open();

	lenfolder=gui.addFolder('Lens');
	foc = lenfolder.add(params, 'focallen',10,500).step(10).name('focal length');
	foc.onChange(function(value){
		params.focallen = value;
		Changer();
		});
	lenfolder.open();

	userfolder=gui.addFolder('User');
	dis = userfolder.add(params, 'focusdis',10,500).step(20).name("distance");
	dis.onChange(function(value){
		params.focusdis = value;
		Changer();
		});
	apt = userfolder.add(params, 'aperture',1,22).step(1);
	apt.onChange(function(value) {
		params.aperture = value;
		Changer();
	});
	userfolder.open();

	var obj = {Submit:function(){
		var verticalfieldofview = 2*(Math.atan(0.5*params.versize/params.focallen));
		verticalfieldofview = (verticalfieldofview*180/Math.PI).toFixed(2);

		var horzfieldofview = 2*(Math.atan(0.5*params.horsize/params.focallen));
		horzfieldofview = (horzfieldofview*180/Math.PI).toFixed(2);
	
		alert("The Vertical angle of view is " + verticalfieldofview +" degrees \n" 
			+ "The Horizontial angle of view is " + horzfieldofview + " degrees");

		var hyper = ((Math.pow(params.focallen,2))/(params.aperture*params.circleofconf)) + params.focallen;
		hyper = hyper/1000;

		var near;
		var far;
		if (params.focusdis >= hyper){
			far = "infinity";
			near = (hyper/2).toFixed(2);
		}
		else {
			near = ((hyper*params.focusdis)/(hyper + (params.focusdis - (params.focallen)/1000))).toFixed(2);
			far = ((hyper*params.focusdis)/(hyper - (params.focusdis - (params.focallen)/1000))).toFixed(2);
		}
		alert ("The near depth of field is "+ near + " meters \n"
				+ "The far depth of field is "+ far + " meters");
		var total;
		if (far == "infinity"){
			total = "infinity";
		}
		else {
			total = (far - near).toFixed(2);
		}
		alert("The total depth is " + total + " meters");
	}};  
	gui.add(obj, 'Submit');

     //Controls
    var controls = new THREE.OrbitControls(camera, renderer.domElement);



}

//function to increase and descrease the size as window changes
function onWindowResize() {

	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );
	postprocessing.composer.setSize(window.innerWidth, window.innerHeight);

}

function initPostprocessing(){
	var renderPass = new THREE.RenderPass(scene, camera);

	var TestShaderPass = new THREE.BokehPass(scene, camera, {
//ADD HERE
		focallen: 100,
		aperture: 1.8,
		coc: 0.001,
		focusdis: 12,

	});

	TestShaderPass.renderToScreen = true;

	var composer = new THREE.EffectComposer(renderer);

	composer.addPass(renderPass);
	composer.addPass(TestShaderPass);

	postprocessing.composer = composer;
	postprocessing.boken = TestShaderPass;
}

//animate
function animate(){
	window.requestAnimationFrame(animate);
	render();
}

//render
function render(){
	//renderer.render(scene,camera);
	postprocessing.composer.render(0.1);
}

	init();
	animate();