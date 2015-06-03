
//variables
var container, canvas;
var camera, scene, renderer;

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
	camera.position.set(0,0,0);

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
		var zstart = -10;

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
	//ground
	var plane = new THREE.Mesh(geometry, material);
	//wall
	var back = new THREE.Mesh(geometry,material);
	var walll = new THREE.Mesh(geometry, material);
	var wallr = new THREE.Mesh(geometry, material);
	back.position.set(0,0,-20);
	back.rotation.x = 90 *Math.PI/180;
	walll.position.set(-20,0,0);
	walll.rotation.z = 90 *Math.PI/180;
	wallr.position.set(20,0,0);
	wallr.rotation.z = 90 *Math.PI/180;
	
	//add to scene
	scene.add(plane);
	scene.add(back);
	scene.add(walll);
	scene.add(wallr);
	//lights
	var hemiLight = new THREE.HemisphereLight( 0xffDDDD, 0x000000, 0.6 );
    hemiLight.position.set( 0, 500, 0 );
    scene.add( hemiLight );

    window.addEventListener( 'resize', onWindowResize, false );

    //TODO: Add gui here

    //Controls
    var controls = new THREE.PointerLockControls(camera);
	controls.enabled = true;
	scene.add(controls.getObject());


}

//function to increase and descrease the size as window changes
function onWindowResize() {

	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}


//animate
function animate(){
	window.requestAnimationFrame(animate);
	render();
}

//render
function render(){
	renderer.render(scene,camera);
}

	init();
	animate();