import * as THREE from 'three';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min';

import { Line2 } from 'three/examples/jsm/lines/Line2';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';

import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// =========================================================== GLOBAL VARIABLES AND CONSTANTS ===========================================================

var gameData;
var dataProcessed = false;

let renderer, rendererTop, rendererSide, scene;
var renderers = [];

let windowWidth = document.getElementById( 'container' ).offsetWidth - 2;
let windowHeight = document.getElementById( 'container' ).offsetHeight - 2;

const canvas = document.getElementById( 'canvas' );
const canvasTop = document.getElementById( 'canvasTop' );
const canvasSide = document.getElementById( 'canvasSide' );

let playerLines = [
	[], //p1
	[], //p2
	[], //p3
	[], //p4
	[], //p5
	[], //p6
	[], //p7
	[], //p8
	[], //p9
	[] //p10
];

let playerLinesSmooth = [
	[], //p1
	[], //p2
	[], //p3
	[], //p4
	[], //p5
	[], //p6
	[], //p7
	[], //p8
	[], //p9
	[] //p10
];

let playerDeathVisualizationObjects = [
	[], //p1
	[], //p2
	[], //p3
	[], //p4
	[], //p5
	[], //p6
	[], //p7
	[], //p8
	[], //p9
	[] //p10
];

let subgraph = [];

let graphHelpers = [];

let map;

let structureVisualizationObjects = [];

const views = [
	{ //left
		left: 0,
		bottom: 0,
		width: 0.5,
		height: 1.0,
		background: new THREE.Color( 1, 1, 1 ),
		up: [ 0, 1, 0 ],
		fov: 90,
	},
	{ //bot right
		left: 0.5,
		bottom: 0,
		width: 0.5,
		height: 0.5,
		background: new THREE.Color( 1, 1, 1 ),
		up: [ 0, 0, -1 ],
		fov: 50,
	},
	{ //top right
		left: 0.5,
		bottom: 0.5,
		width: 0.5,
		height: 0.5,
		background: new THREE.Color( 1, 1, 1 ),
		up: [ 0, 1, 0 ],
		fov: 50,
	}
];

const colors = [
	0x5e4fa2,
	0x3288bd,
	0x66c2a5,
	0xabdda4,
	0x4d9221,
	0x9e0142,
	0xd53e4f,
	0xf46d43,
	0xfdae61,
	0xfee08b
];

//HUD & UI
let gui;
let cameraOrtho, sceneOrtho;
let rendererHUD;
const canvasHUD = document.getElementById( 'canvasHUD' );

let midSeparator, rightSeparator;
let mainViewHeader, topViewHeader, botViewHeader;

const legendw = 310, legendh = 410;
let legendGroup = new THREE.Group();


let linesVisible = [true, true, true, true, true, true, true, true, true, true];
let filteredLinesTransparency = 1;

let mapTransparency = 0.5;

let deathVisible = true;

let topSideSyncMode = false;

let lastInteractedViewIdx = -1;

const red = 0xaf1607
const blue = 0x002eac

const colorsUI = [
	"#5e4fa2",
	"#3288bd",
	"#66c2a5",
	"#abdda4",
	"#4d9221",
	"#9e0142",
	"#d53e4f",
	"#f46d43",
	"#fdae61",
	"#fee08b"
];

// =========================================================== GLOBAL VARIABLES AND CONSTANTS ===========================================================

init();
render();

function init() {
	renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, canvas: canvas});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(windowWidth / 2, windowHeight);
	renderer.setClearColor( 0xffffff, 0);
	renderers.push(renderer);

	rendererSide = new THREE.WebGLRenderer({antialias: true, alpha: true, canvas: canvasSide});
	rendererSide.setPixelRatio(window.devicePixelRatio);
	rendererSide.setSize(windowWidth / 2, windowHeight / 2);
	rendererSide.setClearColor( 0xffffff, 0);
	renderers.push(rendererSide);
	
	rendererTop = new THREE.WebGLRenderer({antialias: true, alpha: true, canvas: canvasTop});
	rendererTop.setPixelRatio(window.devicePixelRatio);
	rendererTop.setSize(windowWidth / 2, windowHeight / 2);
	rendererTop.setClearColor( 0xffffff, 0);
	renderers.push(rendererTop);

	rendererHUD = new THREE.WebGLRenderer({antialias: true, alpha: true, canvas: canvasHUD});
	rendererHUD.setPixelRatio(window.devicePixelRatio);
	rendererHUD.setSize(windowWidth, windowHeight);
	rendererHUD.setClearColor( 0xffffff, 0);

	scene = new THREE.Scene();

	cameraOrtho = new THREE.OrthographicCamera( - windowWidth / 2, windowWidth / 2, windowHeight / 2, - windowHeight / 2, 1, 10 );
	cameraOrtho.position.z = 10;
	sceneOrtho = new THREE.Scene();
}

function render() {
    requestAnimationFrame(render);
	
	updateSize();

	if (gameData && !dataProcessed) {
		hideInitialText();
		initViews();
		initControls();
		createViewFramesAndHeaders();
		createHUDLegend();
		initGUI();
		drawAxisHelpers();
		generateSpaceTimeLines();
		drawLevelLines(140);
		drawDeathObjects();
		drawStructureObjects();
		drawObjectiveObjects(80);
		drawMap();
		drawTimelineHelpers();
		drawPlaneHelpers();
		dataProcessed = true;
	}

	if (!gameData) {
		return
	}

	for ( let ii = 0; ii < views.length; ++ ii ) {

		const view = views[ ii ];
		const camera = view.camera;

		if (ii == 0) { //Perspective view
			solveTransparencyIssuesDeathObjects(camera);
			solveTransparencyIssuesStructureObjects(camera);
		}

		const width = Math.floor( windowWidth * view.width );
		const height = Math.floor( windowHeight * view.height );

		camera.aspect = width / height;
		camera.updateProjectionMatrix();

		renderers[ii].render( scene, camera );

		if (ii == 0) {
			resetDeathObjectsVisibility();
			resetStructureObjectsVisibility();
		}
	}

	rendererHUD.render( sceneOrtho, cameraOrtho );
}

// VIEWS AND CONTROLS

function initViews() {
	//Eye position setup
	views[0].eye = [ 300, 350, 250 ];
	views[1].eye = [gameData.MapSize.X / 2, 420, 0];
	views[2].eye = [690, gameData.MapSize.Y / 2, 0];


	for ( let i = 0; i < views.length; i++ ) {

		const view = views[ i ];
		const camera = new THREE.PerspectiveCamera( view.fov, windowWidth / windowHeight, 1, 10000 );
		camera.position.fromArray( view.eye );
		camera.up.fromArray( view.up );
		view.camera = camera;
	}

	views[0].camera.lookAt(gameData.MapSize.X / 2, gameData.MapSize.Y / 2, 0);
}

function initControls() {
	for ( let i = 0; i < views.length; i++ ) {

		const view = views[ i ];
		const camera = view.camera;
		const controls = new OrbitControls( camera, renderers[i].domElement );
		view.controls = controls;
	}

	views[0].controls.target.x = gameData.MapSize.X / 2;
	views[0].controls.target.y = gameData.MapSize.Y / 2;
	views[0].controls.screenSpacePanning = false;
	views[0].controls.maxPolarAngle = Math.PI / 2;
	views[0].controls.update();

	views[1].controls.enableRotate = false;
	views[1].controls.target.x = views[1].eye[0];
	views[1].controls.update();

	views[1].controls.addEventListener('change', function() {
		lastInteractedViewIdx = 1;

		views[1].controls.target.x = views[1].eye[0];
		views[1].camera.position.x = views[1].eye[0];

		views[1].camera.position.z = Math.max( Math.min( views[1].camera.position.z,  0), -gameData.GameLengthSeconds);
		views[1].controls.target.z = Math.max( Math.min( views[1].controls.target.z,  0), -gameData.GameLengthSeconds);

		if (topSideSyncMode)
		{
			views[2].camera.position.z = views[1].camera.position.z;
			views[2].controls.target.z = views[1].controls.target.z;
		}
	});

	views[2].controls.enableRotate = false;
	views[2].controls.target.y = views[2].eye[1];
	views[2].controls.update();

	views[2].controls.addEventListener('change', function() {
		lastInteractedViewIdx = 2;

		views[2].controls.target.y = views[2].eye[1];
		views[2].camera.position.y = views[2].eye[1];

		views[2].camera.position.z = Math.max( Math.min( views[2].camera.position.z,  0), -gameData.GameLengthSeconds);
		views[2].controls.target.z = Math.max( Math.min( views[2].controls.target.z,  0), -gameData.GameLengthSeconds);

		if (topSideSyncMode)
		{
			views[1].camera.position.z = views[2].camera.position.z;
			views[1].controls.target.z = views[2].controls.target.z;
		}
	});
}

function updateSize() {
	var w = document.getElementById( 'container' ).offsetWidth - 2;
	var h = document.getElementById( 'container' ).offsetHeight - 2;
	if ( windowWidth != w || windowHeight != h ) {
		windowWidth = w;
		windowHeight = h;

		cameraOrtho.left = - windowWidth / 2;
		cameraOrtho.right = windowWidth / 2;
		cameraOrtho.top = windowHeight / 2;
		cameraOrtho.bottom = - windowHeight / 2;
		cameraOrtho.updateProjectionMatrix();

		updateHUD();
		legendGroup.position.set((-windowWidth / 2) + 2, (-windowHeight / 2) + legendh + 1, 1);

		renderer.setSize( windowWidth / 2, windowHeight );
		rendererTop.setSize( windowWidth / 2, windowHeight / 2);
		rendererSide.setSize( windowWidth / 2, windowHeight / 2);
		rendererHUD.setSize(windowWidth, windowHeight);
	}
}

// ======

// LINES 

function getRawLinePoints() { // x , y , z per each point
	var playerLinePoints = [
		[[]], //p1
		[[]], //p2
		[[]], //p3
		[[]], //p4
		[[]], //p5
		[[]], //p6
		[[]], //p7
		[[]], //p8
		[[]], //p9
		[[]] //p10
	];

	for(var i = 0; i < gameData.GameLengthSeconds; i++) {
		for(var j = 0; j < gameData.TimestepPlayerPositions[i].length; j++) {
			if(gameData.TimestepPlayerPositions[i][j].IsDead) {
				if(playerLinePoints[j][playerLinePoints[j].length - 1].length != 0) {
					playerLinePoints[j].push([]);
				}
				continue;
			}
			
			playerLinePoints[j][playerLinePoints[j].length - 1].push(
				gameData.TimestepPlayerPositions[i][j].Position.X,
				gameData.TimestepPlayerPositions[i][j].Position.Y,
				-i
			);		
		}
	}

	return playerLinePoints;
}

function generateSpaceTimeLines() {
	var playerLinePoints = getRawLinePoints();

	for(var i = 0; i < playerLinePoints.length; i++) {
		for(var j = 0; j < playerLinePoints[i].length; j++) {
			if(playerLinePoints[i][j].length != 0) {
				const geometry = new LineGeometry();
				const geometrySmooth = new LineGeometry();
				
				geometry.setPositions(playerLinePoints[i][j]);
				geometrySmooth.setPositions(getSmoothCurvePoints(playerLinePoints[i][j], 10)); //edit line smoothness here

				const material = new LineMaterial( { 

					color: colors[i],
					worldUnits: false,
					linewidth: 0.002, // in world units with size attenuation, pixels otherwise
					vertexColors: false,
					
					dashed: false,
					alphaToCoverage: false,
					transparent: true
				} );

				const line = new Line2( geometry, material );
				const lineSmooth = new Line2( geometrySmooth, material );

				line.visible = false;
				playerLines[i].push(line);

				playerLinesSmooth[i].push(lineSmooth);

				scene.add( line );
				scene.add( lineSmooth );
			}
		}
	}
}


function getSmoothCurvePoints(points, depth) { //average noise filtering
	var pointsVect3Array = [];

	for(var i = 0; i < points.length; i += 3) {
		pointsVect3Array.push(new THREE.Vector3(points[i], points[i + 1], points[i + 2]));
	}

	var start = pointsVect3Array.length > depth ? depth : pointsVect3Array.length;

	// first depth points, increasing window size
	for(var i = 0; i < start; i++) {
		var sumVector = new THREE.Vector3(0, 0, 0);
		for(var j = 0; j <= i; j++) {
			sumVector.add(pointsVect3Array[j]);
		}

		pointsVect3Array[i] = sumVector.divideScalar(i+1);
	}
	
	for(var i = depth; i < pointsVect3Array.length - depth; i++) {
		var sumVector = new THREE.Vector3(0, 0, 0);
		for(var j = 0; j < depth; j++) {
			sumVector.add(pointsVect3Array[i + j]);
		}

		pointsVect3Array[i] = sumVector.divideScalar(depth);
	}

	// last depth points, decresing window size
	for(var i = pointsVect3Array.length - depth; i < pointsVect3Array.length; i++) {
		var sumVector = new THREE.Vector3(0, 0, 0);
		for(var j = pointsVect3Array.length - 1; j >= i && j > 0; j--) {
			sumVector.add(pointsVect3Array[j]);
		}

		pointsVect3Array[i] = sumVector.divideScalar(pointsVect3Array.length - i);
	}

	var pointsRaw = []
	for(var i = 0; i < pointsVect3Array.length; i++) {
		pointsRaw.push(pointsVect3Array[i].x, pointsVect3Array[i].y, pointsVect3Array[i].z);
	}

	return pointsRaw;
}

// ======

// HELPERS 

function drawAxisHelpers() {
	const origin = new THREE.Vector3( 0, 0, 0 );
	const up = new THREE.Vector3(0, 1, 0);
	const right = new THREE.Vector3(1, 0, 0);
	const forward = new THREE.Vector3(0, 0, -1);
	
	const black = 0x000000;

	const arrowHelperY = new THREE.ArrowHelper( up, origin, gameData.MapSize.Y, black, 0, 0);
	scene.add( arrowHelperY );

	const arrowHelperX = new THREE.ArrowHelper( right, origin, gameData.MapSize.X, black, 0, 0);
	scene.add( arrowHelperX );

	const arrowHelperZ = new THREE.ArrowHelper( forward, origin, gameData.GameLengthSeconds, black, 6, 3);
	scene.add( arrowHelperZ );
}

function drawTimelineHelpers() {
	const minutesMaterial = new LineMaterial( { 

		color: 0x000000,
		worldUnits: false,
		linewidth: 0.0010, // in world units with size attenuation, pixels otherwise
		vertexColors: false,
		
		dashed: true,
		dashSize: 10,
		gapSize: 20,

		alphaToCoverage: false,
	
	} );

	const fiveMinutesMaterial = new LineMaterial( { 

		color: 0x000000,
		worldUnits: false,
		linewidth: 0.003, // in world units with size attenuation, pixels otherwise
		vertexColors: false,
		
		dashed: true,
		dashSize: 15,
		gapSize: 15,

		alphaToCoverage: false,
	
	} );

	for(var i = 0; i < gameData.GameLengthSeconds; i += 60) {
		if (i == 0 || i % 300 == 0) { //skip start and 5 mins
			continue;
		}
		const bgeometry = new LineGeometry();
		bgeometry.setPositions(
			[0, 0, -i,
			gameData.MapSize.X, 0, -i]
		);

		const bline = new Line2( bgeometry, minutesMaterial );
		bline.computeLineDistances();
		graphHelpers.push(bline);
		scene.add(bline);

		const lgeometry = new LineGeometry();
		lgeometry.setPositions(
			[0, 0, -i,
			0, gameData.MapSize.Y, -i]
		);

		const lline = new Line2( lgeometry, minutesMaterial );
		lline.computeLineDistances();
		graphHelpers.push(lline);
		scene.add(lline);
	}

	for(var i = 0; i < gameData.GameLengthSeconds; i += 300) {
		if (i == 0) { //skip start
			continue;
		}
		const bgeometry = new LineGeometry();
		bgeometry.setPositions(
			[0, 0, -i,
			gameData.MapSize.X, 0, -i]
		);

		const bline = new Line2( bgeometry, fiveMinutesMaterial );
		bline.computeLineDistances();
		graphHelpers.push(bline);
		scene.add(bline);

		const lgeometry = new LineGeometry();
		lgeometry.setPositions(
			[0, 0, -i,
			0, gameData.MapSize.Y, -i]
		);

		const lline = new Line2( lgeometry, fiveMinutesMaterial );
		lline.computeLineDistances();
		graphHelpers.push(lline);
		scene.add(lline);
	}

	//labels
	const loader = new FontLoader();
	loader.load('./fonts/Roboto_Regular.json',
		function(font) {
			const color = 0x000000;
			const matLite = new THREE.MeshBasicMaterial( {
				color: color,
				transparent: true,
				opacity: 1.0,
				side: THREE.DoubleSide
			} );

			for(var i = 0; i < gameData.GameLengthSeconds; i += 300) {
				const message = (i / 60) + ' m';

				const shapes = font.generateShapes( message, 100 );

				const geometry = new THREE.ShapeGeometry( shapes );

				const text = new THREE.Mesh( geometry, matLite );
				text.position.set(gameData.MapSize.X + 10, 0, -i);
				text.rotation.x = -Math.PI /2;
				text.scale.set(0.15, 0.15, 0.15);

				graphHelpers.push(text);
				scene.add( text );
			}

		});
}

function drawPlaneHelpers() {
	const bgeometry = new THREE.PlaneGeometry( gameData.MapSize.X / 2, gameData.GameLengthSeconds );
	const bmaterial = new THREE.MeshBasicMaterial( {color: 0x0000ff, side: THREE.DoubleSide, transparent: true, opacity: 0.1, alphaTest: 0.10} );
	const bplane = new THREE.Mesh( bgeometry, bmaterial );
	bplane.rotation.x = -Math.PI /2;
	bplane.position.set(gameData.MapSize.X / 4, -0.1, -gameData.GameLengthSeconds / 2);
	scene.add( bplane );

	const rgeometry = new THREE.PlaneGeometry( gameData.MapSize.X / 2, gameData.GameLengthSeconds );
	const rmaterial = new THREE.MeshBasicMaterial( {color: 0xff0000, side: THREE.DoubleSide, transparent: true, opacity: 0.1, alphaTest: 0.10} );
	const rplane = new THREE.Mesh( rgeometry, rmaterial );
	rplane.rotation.x = -Math.PI /2;
	rplane.position.set(3 * (gameData.MapSize.X / 4), -0.1, -gameData.GameLengthSeconds / 2);
	scene.add( rplane );

	const leftPlaneHelper = new THREE.ArrowHelper( new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, gameData.MapSize.Y / 2, 0), gameData.GameLengthSeconds, 0x000000, 0, 0);
	scene.add( leftPlaneHelper );
}

// =====

// MAINGRAPH ELEMENTS

function drawDeathObjects() {
	var playerIndex = 0
	const textureLoader = new THREE.TextureLoader();
	const map = textureLoader.load( './img/graph_icons/death.png' );

	for (const [team, players] of Object.entries(gameData.TeamPlayerDeaths)) {
		for (const [player, deaths] of Object.entries(players)) {
			for(var i = 0; i < deaths.length; i++) {
				const material = new THREE.SpriteMaterial( { map: map, color: colors[playerIndex], transparent: true, alphaTest: 0.1 } );
				material.depthTest = false;
				const sprite = new THREE.Sprite( material );
				
				sprite.renderOrder = 2;
				
				sprite.position.set(deaths[i].Position.X, deaths[i].Position.Y, -deaths[i].TimeStepSeconds);
				sprite.scale.set(25, 25, 0);
				playerDeathVisualizationObjects[playerIndex].push(sprite);
				scene.add( sprite );

				//help lines and circles
				const lineMaterial = new THREE.LineDashedMaterial( {
					color: colors[playerIndex],
					linewidth: 1,
					scale: 1,
					dashSize: 5,
					gapSize: 5,
					transparent: true
				} );

				const lpoints = [];
				lpoints.push( new THREE.Vector3( 0, deaths[i].Position.Y, -deaths[i].TimeStepSeconds ) );
				lpoints.push( new THREE.Vector3( deaths[i].Position.X, deaths[i].Position.Y, -deaths[i].TimeStepSeconds ) );
				const lgeometry = new THREE.BufferGeometry().setFromPoints( lpoints );
				var lline = new THREE.Line( lgeometry, lineMaterial );
				lline.computeLineDistances();
				playerDeathVisualizationObjects[playerIndex].push(lline);
				scene.add( lline );

				const lcircleGeometry = new THREE.CircleGeometry( 3, 32 );
				const lcircleMaterial = new THREE.MeshBasicMaterial( { color: colors[playerIndex], transparent: true } );
				const lcircle = new THREE.Mesh( lcircleGeometry, lcircleMaterial );
				lcircle.position.set( 0, deaths[i].Position.Y, -deaths[i].TimeStepSeconds );
				lcircle.rotation.y = Math.PI / 2;
				playerDeathVisualizationObjects[playerIndex].push(lcircle);
				scene.add( lcircle );

				const bpoints = [];
				bpoints.push( new THREE.Vector3( deaths[i].Position.X, 0, -deaths[i].TimeStepSeconds ) );
				bpoints.push( new THREE.Vector3( deaths[i].Position.X, deaths[i].Position.Y, -deaths[i].TimeStepSeconds ) );
				const bgeometry = new THREE.BufferGeometry().setFromPoints( bpoints );
				var bline = new THREE.Line( bgeometry, lineMaterial );
				bline.computeLineDistances();
				playerDeathVisualizationObjects[playerIndex].push(bline);
				scene.add( bline );

				const bcircleGeometry = new THREE.CircleGeometry( 3, 32 );
				const bcircleMaterial = new THREE.MeshBasicMaterial( { color: colors[playerIndex], transparent: true } );
				const bcircle = new THREE.Mesh( bcircleGeometry, bcircleMaterial );
				bcircle.position.set( deaths[i].Position.X, 0, -deaths[i].TimeStepSeconds );
				bcircle.rotation.x = -Math.PI / 2;
				playerDeathVisualizationObjects[playerIndex].push(bcircle);
				scene.add( bcircle );
			}
			playerIndex++;
		}
	}
}

function drawStructureObjects() {
	const textureLoader = new THREE.TextureLoader();
	const fort = textureLoader.load( './img/graph_icons/fort.png' );
	const tower = textureLoader.load('./img/graph_icons/tower.png')

	for(var i = 0; i < gameData.TeamStructureDestruction["Team0"].length; i++) {
		const x = gameData.TeamStructureDestruction["Team0"][i].TimestepPosition.Position.X;
		const y = gameData.TeamStructureDestruction["Team0"][i].TimestepPosition.Position.Y;
		const z = -gameData.TeamStructureDestruction["Team0"][i].TimestepPosition.TimeStepSeconds;
		const type = gameData.TeamStructureDestruction["Team0"][i].StructureType;

		let material;
		if (type == "Fort") {
			material = new THREE.SpriteMaterial( { map: fort, color: red, transparent: true, alphaTest: 0.1 } );
		}

		if (type == "Tower") {
			material = new THREE.SpriteMaterial( { map: tower, color: red, transparent: true, alphaTest: 0.1 } );
		}

		material.depthTest = false;

		const sprite = new THREE.Sprite( material );
		sprite.position.set(x, y, z);
		sprite.scale.set(25, 25, 0);
		if (type == "Tower") {
			sprite.scale.set(15, 15, 0);
		}

		sprite.renderOrder = 2;

		structureVisualizationObjects.push(sprite);
		scene.add( sprite );

		//help lines and circles
		const lineMaterial = new THREE.LineDashedMaterial( {
			color: red,
			linewidth: 1,
			scale: 1,
			dashSize: 5,
			gapSize: 5,
		} );

		const lpoints = [];
		lpoints.push( new THREE.Vector3( 0, y, z ) );
		lpoints.push( new THREE.Vector3( x, y, z ) );
		const lgeometry = new THREE.BufferGeometry().setFromPoints( lpoints );
		var lline = new THREE.Line( lgeometry, lineMaterial );
		lline.computeLineDistances();
		structureVisualizationObjects.push(lline);
		scene.add( lline );

		const lplaneGeometry = new THREE.PlaneGeometry( 6, 6 );
		const lplaneMaterial = new THREE.MeshBasicMaterial( { color: red } );
		const lplane = new THREE.Mesh( lplaneGeometry, lplaneMaterial );
		lplane.position.set( 0, y, z );
		lplane.rotation.y = Math.PI / 2;
		structureVisualizationObjects.push(lplane);
		scene.add( lplane );

		const bpoints = [];
		bpoints.push( new THREE.Vector3( x, 0, z ) );
		bpoints.push( new THREE.Vector3( x, y, z ) );
		const bgeometry = new THREE.BufferGeometry().setFromPoints( bpoints );
		var bline = new THREE.Line( bgeometry, lineMaterial );
		bline.computeLineDistances();
		structureVisualizationObjects.push(bline);
		scene.add( bline );

		const bplaneGeometry = new THREE.PlaneGeometry( 6, 6 );
		const bplaneMaterial = new THREE.MeshBasicMaterial( { color: red } );
		const bplane = new THREE.Mesh( bplaneGeometry, bplaneMaterial );
		bplane.position.set( x, 0, z );
		bplane.rotation.x = -Math.PI / 2;
		structureVisualizationObjects.push(bplane);
		scene.add( bplane );
	}

	for(var i = 0; i < gameData.TeamStructureDestruction["Team1"].length; i++) {
		const x = gameData.TeamStructureDestruction["Team1"][i].TimestepPosition.Position.X;
		const y = gameData.TeamStructureDestruction["Team1"][i].TimestepPosition.Position.Y;
		const z = -gameData.TeamStructureDestruction["Team1"][i].TimestepPosition.TimeStepSeconds;
		const type = gameData.TeamStructureDestruction["Team1"][i].StructureType;

		let material;
		if (type == "Fort") {
			material = new THREE.SpriteMaterial( { map: fort, color: blue, transparent: true, alphaTest: 0.1 } );
		}

		if (type == "Tower") {
			material = new THREE.SpriteMaterial( { map: tower, color: blue, transparent: true, alphaTest: 0.1 } );
		}

		material.depthTest = false;

		const sprite = new THREE.Sprite( material );
		sprite.position.set(x, y, z);
		sprite.scale.set(30, 30, 0);
		if (type == "Tower") {
			sprite.scale.set(20, 20, 0);
		}

		sprite.renderOrder = 2;

		structureVisualizationObjects.push(sprite);
		scene.add( sprite );

		//help lines and circles
		const lineMaterial = new THREE.LineDashedMaterial( {
			color: blue,
			linewidth: 1,
			scale: 1,
			dashSize: 5,
			gapSize: 5,
		} );

		const lpoints = [];
		lpoints.push( new THREE.Vector3( 0, y, z ) );
		lpoints.push( new THREE.Vector3( x, y, z ) );
		const lgeometry = new THREE.BufferGeometry().setFromPoints( lpoints );
		var lline = new THREE.Line( lgeometry, lineMaterial );
		lline.computeLineDistances();
		structureVisualizationObjects.push(lline);
		scene.add( lline );

		const lplaneGeometry = new THREE.PlaneGeometry( 6, 6 );
		const lplaneMaterial = new THREE.MeshBasicMaterial( { color: blue } );
		const lplane = new THREE.Mesh( lplaneGeometry, lplaneMaterial );
		lplane.position.set( 0, y, z );
		lplane.rotation.y = Math.PI / 2;
		structureVisualizationObjects.push(lplane);
		scene.add( lplane );

		const bpoints = [];
		bpoints.push( new THREE.Vector3( x, 0, z ) );
		bpoints.push( new THREE.Vector3( x, y, z ) );
		const bgeometry = new THREE.BufferGeometry().setFromPoints( bpoints );
		var bline = new THREE.Line( bgeometry, lineMaterial );
		bline.computeLineDistances();
		structureVisualizationObjects.push(bline);
		scene.add( bline );

		const bplaneGeometry = new THREE.PlaneGeometry( 6, 6 );
		const bplaneMaterial = new THREE.MeshBasicMaterial( { color: blue } );
		const bplane = new THREE.Mesh( bplaneGeometry, bplaneMaterial );
		bplane.position.set( x, 0, z );
		bplane.rotation.x = -Math.PI / 2;
		structureVisualizationObjects.push(bplane);
		scene.add( bplane );
	}
}

function drawMap() {
	const texture = new THREE.TextureLoader().load( './img/maps/' + gameData.Map + '.png' );
	
	let mapw, maph;
	let mapx, mapy;
	switch(gameData.Map) {
		case "Alterac Pass":
			mapw = gameData.MapSize.X + 20;
			maph = gameData.MapSize.Y + 45;

			mapx = (gameData.MapSize.X / 2) - 4;
			mapy = (gameData.MapSize.Y / 2) - 5;
			break;
		case "Battlefield of Eternity":
			mapw = gameData.MapSize.X - 40;
			maph = gameData.MapSize.Y - 60;

			mapx = gameData.MapSize.X / 2;
			mapy = (gameData.MapSize.Y / 2);
			break;
		case "Blackheart's Bay":
			mapw = gameData.MapSize.X - 20;
			maph = gameData.MapSize.Y;

			mapx = (gameData.MapSize.X / 2) - 5;
			mapy = (gameData.MapSize.Y / 2);
			break;
		case "Braxis Holdout":
			mapw = gameData.MapSize.X;
			maph = gameData.MapSize.Y - 65;

			mapx = gameData.MapSize.X / 2;
			mapy = (gameData.MapSize.Y / 2);
			break;
		case "Cursed Hollow":
			mapw = gameData.MapSize.X - 10;
			maph = gameData.MapSize.Y - 40;

			mapx = (gameData.MapSize.X / 2) - 5;
			mapy = (gameData.MapSize.Y / 2);
			break;
		case "Dragon Shire":
			mapw = gameData.MapSize.X - 10;
			maph = gameData.MapSize.Y;

			mapx = (gameData.MapSize.X / 2) - 5;
			mapy = (gameData.MapSize.Y / 2) - 10;
			break;
		case "Garden of Terror":
			mapw = gameData.MapSize.X - 10;
			maph = gameData.MapSize.Y - 60;

			mapx = (gameData.MapSize.X / 2) - 5;
			mapy = (gameData.MapSize.Y / 2) + 5;
			break;
		case "Hanamura Temple":
			mapw = gameData.MapSize.X - 10;
			maph = gameData.MapSize.Y - 60;

			mapx = gameData.MapSize.X / 2;
			mapy = (gameData.MapSize.Y / 2);
			break;
		case "Infernal Shrines":
			mapw = gameData.MapSize.X - 10;
			maph = gameData.MapSize.Y - 40;

			mapx = gameData.MapSize.X / 2;
			mapy = (gameData.MapSize.Y / 2) - 5;
			break;
		case "Sky Temple":
			mapw = gameData.MapSize.X - 15;
			maph = gameData.MapSize.Y - 40;

			mapx = gameData.MapSize.X / 2;
			mapy = (gameData.MapSize.Y / 2);
			break;
		case "Tomb of the Spider Queen":
			mapw = gameData.MapSize.X;
			maph = gameData.MapSize.Y - 45;

			mapx = gameData.MapSize.X / 2;
			mapy = (gameData.MapSize.Y / 2) - 10;
			break;
		case "Towers of Doom":
			mapw = gameData.MapSize.X - 30;
			maph = gameData.MapSize.Y - 60;

			mapx = (gameData.MapSize.X / 2) - 5;
			mapy = (gameData.MapSize.Y / 2) - 15;
			break;
		case "Volskaya Foundry":
			mapw = gameData.MapSize.X;
			maph = gameData.MapSize.Y - 20;

			mapx = gameData.MapSize.X / 2;
			mapy = (gameData.MapSize.Y / 2) - 15;
			break;
		case "Warhead Junction":
			mapw = gameData.MapSize.X - 10;
			maph = gameData.MapSize.Y - 25;

			mapx = gameData.MapSize.X / 2;
			mapy = (gameData.MapSize.Y / 2) - 5;
			break;
		case "Lost Cavern": // ARAM
			mapw = gameData.MapSize.X - 25;
			maph = gameData.MapSize.Y - 135;

			mapx = gameData.MapSize.X / 2;
			mapy = gameData.MapSize.Y / 2;
			break;
	}

	const geometry = new THREE.PlaneGeometry( mapw, maph );
	const material = new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: texture, transparent: true, alphaTest: 0.1 } );
	material.opacity = 0.5;

	const mesh = new THREE.Mesh( geometry, material );

	mesh.position.x = mapx;
	mesh.position.y = mapy;

	map = mesh;
	map.renderOrder = 1;
	scene.add( map );
}

// =====

// SUBGRAPH ELEMENTS

function drawLevelLines(offset) {
	const right = new THREE.Vector3(1, 0, 0);
	
	const blue = 0x0000ff;
	const red = 0xff0000;
	const lineLength = 40;

	const interestingLevels = [4, 7, 10, 13, 16, 20];
	
	const loader = new FontLoader();

	for(var i = 1; i < gameData.TeamLevels["Team0"].length; i++) {
		const levelLine = new THREE.ArrowHelper( right, new THREE.Vector3(gameData.MapSize.X + offset - lineLength, 0, -gameData.TeamLevels["Team0"][i]), lineLength, blue, 0, 0);
		subgraph.push(levelLine);
		scene.add( levelLine );
	}

	loader.load('./fonts/Roboto_Regular.json',
		function(font) {
			const color = 0x0000ff;
			const matLite = new THREE.MeshBasicMaterial( {
				color: color,
				transparent: true,
				opacity: 0.5,
				side: THREE.DoubleSide
			} );
			
			for(var i = 1; i < gameData.TeamLevels["Team0"].length; i++) {
				if(!interestingLevels.includes(i+1)) {
					continue;
				}
				const message = 'lvl ' + (i+1);

				const shapes = font.generateShapes( message, 100 );

				const geometry = new THREE.ShapeGeometry( shapes );

				const text = new THREE.Mesh( geometry, matLite );
				text.position.set(gameData.MapSize.X + offset - lineLength, 0, -gameData.TeamLevels["Team0"][i]);
				text.rotation.x = -Math.PI /2;
				text.scale.set(0.10, 0.10, 0.10);

				subgraph.push(text);
				scene.add( text );
			}
		});

	for(var i = 1; i < gameData.TeamLevels["Team1"].length; i++) {
		const levelLine = new THREE.ArrowHelper( right, new THREE.Vector3(gameData.MapSize.X + offset, 0, -gameData.TeamLevels["Team1"][i]), lineLength, red, 0, 0);
		subgraph.push(levelLine);
		scene.add( levelLine );
	}

	loader.load('./fonts/Roboto_Regular.json',
		function(font) {
			const color = 0xff0000;
			const matLite = new THREE.MeshBasicMaterial( {
				color: color,
				transparent: true,
				opacity: 0.5,
				side: THREE.DoubleSide
			} );
			
			for(var i = 1; i < gameData.TeamLevels["Team1"].length; i++) {
				if(!interestingLevels.includes(i+1)) {
					continue;
				}
				const message = 'lvl ' + (i+1);

				const shapes = font.generateShapes( message, 100 );

				const geometry = new THREE.ShapeGeometry( shapes );

				const text = new THREE.Mesh( geometry, matLite );
				text.position.set(gameData.MapSize.X + offset + 10, 0, -gameData.TeamLevels["Team1"][i]);
				text.rotation.x = -Math.PI /2;
				text.scale.set(0.10, 0.10, 0.10);

				subgraph.push(text);
				scene.add( text );
			}
		});
	
	const timeHelper = new THREE.ArrowHelper( new THREE.Vector3(0, 0, -1), new THREE.Vector3(gameData.MapSize.X + offset, 0, 0), gameData.GameLengthSeconds, 0x000000, 6, 3);
	subgraph.push(timeHelper);
	scene.add( timeHelper );

	//TIMELINE HELPERS
	const minutesMaterial = new LineMaterial( { 

		color: 0x000000,
		worldUnits: false,
		linewidth: 0.0010, // in world units with size attenuation, pixels otherwise
		vertexColors: false,
		
		dashed: false,
		alphaToCoverage: false,
	
	} );

	const fiveMinutesMaterial = new LineMaterial( { 

		color: 0x000000,
		worldUnits: false,
		linewidth: 0.003, // in world units with size attenuation, pixels otherwise
		vertexColors: false,
		
		dashed: false,
		alphaToCoverage: false,
	
	} );

	for(var i = 0; i < gameData.GameLengthSeconds; i += 60) {
		if (i == 0 || i % 300 == 0) { //skip start and 5 mins
			continue;
		}
		const blgeometry = new LineGeometry();
		blgeometry.setPositions(
			[gameData.MapSize.X + offset - 6, 0, -i,
			gameData.MapSize.X + offset + 6, 0, -i]
		);

		const blline = new Line2( blgeometry, minutesMaterial );
		scene.add(blline);
	}

	for(var i = 0; i < gameData.GameLengthSeconds; i += 300) {
		if (i == 0) { //skip start
			continue;
		}
		//bot
		const blgeometry = new LineGeometry();
		blgeometry.setPositions(
			[gameData.MapSize.X + offset - 8, 0, -i,
			gameData.MapSize.X + offset + 8, 0, -i]
		);

		const blline = new Line2( blgeometry, fiveMinutesMaterial );
		scene.add(blline);
	}
}

function drawObjectiveObjects(offset) {
	const textureLoader = new THREE.TextureLoader();
	const obective = textureLoader.load( './img/graph_icons/objective.png' );
	const boss = textureLoader.load( './img/graph_icons/boss.png' )

	for(var i = 0; i < gameData.TeamObjectives["Team0"].length; i++) {
		var obj = gameData.TeamObjectives["Team0"][i];
		let geometry, material;

		if(obj.ObjectiveType == "BossCapture") {
			geometry = new THREE.PlaneGeometry( 90, 45 );
			material = new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: boss, color: 0x0000ff, transparent: true, alphaTest: 0.1 } );
			material.opacity = 0.5;
		}

		if(obj.ObjectiveType == "MapObjective") {
			geometry = new THREE.PlaneGeometry( 20, 20 );
			material = new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: obective, color: 0x0000ff, transparent: true, alphaTest: 0.1 } );
			material.opacity = 0.5;
		}

		const mesh = new THREE.Mesh( geometry, material );
		mesh.position.set(gameData.MapSize.X + offset, 0, -obj.TimeStepSeconds);
		mesh.rotation.x = -Math.PI /2;
		subgraph.push(mesh);
		scene.add(mesh);

		const lineMaterial = new THREE.LineDashedMaterial( {
			color: 0x0000ff,
			linewidth: 1,
			scale: 1,
			dashSize: 5,
			gapSize: 5,
		} );

		const lpoints = [];
		lpoints.push( new THREE.Vector3( gameData.MapSize.X + offset + 60, 0, -obj.TimeStepSeconds ) ); //+60 to reach the subgraph timeline
		lpoints.push( new THREE.Vector3( gameData.MapSize.X + offset, 0, -obj.TimeStepSeconds ) );
		const lgeometry = new THREE.BufferGeometry().setFromPoints( lpoints );
		var lline = new THREE.Line( lgeometry, lineMaterial );
		lline.computeLineDistances();
		scene.add( lline );
	}

	for(var i = 0; i < gameData.TeamObjectives["Team1"].length; i++) {
		var obj = gameData.TeamObjectives["Team1"][i];
		let geometry, material;
		
		if(obj.ObjectiveType == "BossCapture") {
			geometry = new THREE.PlaneGeometry( 90, 45 );
			material = new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: boss, color: 0xff0000, transparent: true, alphaTest: 0.1 } );
			material.opacity = 0.5;
		}

		if(obj.ObjectiveType == "MapObjective") {
			geometry = new THREE.PlaneGeometry( 20, 20 );
			material = new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: obective, color: 0xff0000, transparent: true, alphaTest: 0.1 } );
			material.opacity = 0.5;
		}

		const mesh = new THREE.Mesh( geometry, material );
		mesh.position.set(gameData.MapSize.X + offset + 120, 0, -obj.TimeStepSeconds);
		mesh.rotation.x = -Math.PI /2;
		subgraph.push(mesh);
		scene.add(mesh);

		const lineMaterial = new THREE.LineDashedMaterial( {
			color: 0xff0000,
			linewidth: 1,
			scale: 1,
			dashSize: 5,
			gapSize: 5,
		} );

		const lpoints = [];
		lpoints.push( new THREE.Vector3( gameData.MapSize.X + offset + 60, 0, -obj.TimeStepSeconds ) );
		lpoints.push( new THREE.Vector3( gameData.MapSize.X + offset + 120, 0, -obj.TimeStepSeconds ) );
		const lgeometry = new THREE.BufferGeometry().setFromPoints( lpoints );
		var lline = new THREE.Line( lgeometry, lineMaterial );
		lline.computeLineDistances();
		scene.add( lline );
	}
}

// MICS

function solveTransparencyIssuesDeathObjects(camera) {
	for(var i = 0; i < playerDeathVisualizationObjects.length; i++) {
		for(var j = 0; j < playerDeathVisualizationObjects[i].length; j+=5) {
			var origin = new THREE.Vector3();
			var destination = new THREE.Vector3();
			var raycaster = new THREE.Raycaster();

			playerDeathVisualizationObjects[i][j].getWorldPosition(destination);
			camera.getWorldPosition(origin);
			
			raycaster.set(origin, destination.sub(origin).normalize());
			raycaster.far = camera.position.distanceTo(playerDeathVisualizationObjects[i][j].position);
			let intersects = raycaster.intersectObject( map );
			if ( intersects.length > 0 && linesVisible[i]) {
				playerDeathVisualizationObjects[i][j].material.opacity = mapTransparency;
			}
		}
	}
}

function resetDeathObjectsVisibility() {
	for(var i = 0; i < playerDeathVisualizationObjects.length; i++) {
		for(var j = 0; j < playerDeathVisualizationObjects[i].length; j+=5) {
			if (linesVisible[i]) {
				playerDeathVisualizationObjects[i][j].material.opacity = 1;
			}
			else {
				playerDeathVisualizationObjects[i][j].material.opacity = 1 - filteredLinesTransparency;
			}
		}
	}
}


function solveTransparencyIssuesStructureObjects(camera) {
	for(var i = 0; i < structureVisualizationObjects.length; i+=5) {
		var origin = new THREE.Vector3();
		var destination = new THREE.Vector3();
		var raycaster = new THREE.Raycaster();

		structureVisualizationObjects[i].getWorldPosition(destination);
		camera.getWorldPosition(origin);

		raycaster.set(origin, destination.sub(origin).normalize());
		raycaster.far = camera.position.distanceTo(structureVisualizationObjects[i].position);
		let intersects = raycaster.intersectObject( map );
		if ( intersects.length > 0 ) {
			structureVisualizationObjects[i].material.opacity = mapTransparency;
		}
	}
}

function resetStructureObjectsVisibility() {
	for(var i = 0; i < structureVisualizationObjects.length; i+=5) {
		structureVisualizationObjects[i].material.opacity = 1;
	}
}

function clearThree(obj)
{
	while(obj.children.length > 0){ 
	  	clearThree(obj.children[0]);
	  	obj.remove(obj.children[0]);
	}
	if(obj.geometry) obj.geometry.dispose();
  
	if(obj.material){ 
	  	//in case of map, bumpMap, normalMap, envMap ...
	 	Object.keys(obj.material).forEach(prop => {
			if(!obj.material[prop])
		  		return;
			if(obj.material[prop] !== null && typeof obj.material[prop].dispose === 'function')                                  
		 		obj.material[prop].dispose();                                                      
	  	});
	  	obj.material.dispose();
	}
}

function resetContainers() {
	playerLines = [
		[], //p1
		[], //p2
		[], //p3
		[], //p4
		[], //p5
		[], //p6
		[], //p7
		[], //p8
		[], //p9
		[] //p10
	];
	
	playerLinesSmooth = [
		[], //p1
		[], //p2
		[], //p3
		[], //p4
		[], //p5
		[], //p6
		[], //p7
		[], //p8
		[], //p9
		[] //p10
	];
	
	playerDeathVisualizationObjects = [
		[], //p1
		[], //p2
		[], //p3
		[], //p4
		[], //p5
		[], //p6
		[], //p7
		[], //p8
		[], //p9
		[] //p10
	];
	
	linesVisible = [true, true, true, true, true, true, true, true, true, true];
	
	structureVisualizationObjects = [];
	
	subgraph = [];
	
	graphHelpers = [];

	legendGroup.visible = true;
	topSideSyncMode = false;
}

function resetEverything() {
	clearThree(scene);
	clearThree(sceneOrtho);
	resetContainers();
	if (gui) gui.destroy();
	dataProcessed = false;
}

// =====

// UI - LEGEND AND FRAMES

function createHUDLegend()
{
	const geometry = new THREE.PlaneGeometry( legendw, legendh );
	geometry.translate(legendw/2, -legendh/2, 0);

	const material = new THREE.MeshBasicMaterial( {color: 0x1f1f1f, side: THREE.DoubleSide} );
	const legendPlane = new THREE.Mesh(geometry, material);
	legendGroup.add(legendPlane);

	createHUDLegendText(legendGroup, "Map: " + gameData.Map, 10, -10, 0.12);
	createHUDLegendText(legendGroup, "Duration: " + gameData.GameLength, 10, -35, 0.12);

	createHUDLegendText(legendGroup, gameData.Players[0].IsWinner ? "Blue Team (Winner):" : "Blue Team:", 10, -55, 0.12); //35 width

	createHUDLegendImage(legendGroup, './img/hero_icons/' + gameData.Players[0].Character.toLowerCase() + '.png', 35, -105, 40, 40, true, 0);
	createHUDLegendImage(legendGroup, './img/hero_icons/' + gameData.Players[1].Character.toLowerCase() + '.png', 95, -105, 40, 40, true, 1);
	createHUDLegendImage(legendGroup, './img/hero_icons/' + gameData.Players[2].Character.toLowerCase() + '.png', 155, -105, 40, 40, true, 2);
	createHUDLegendImage(legendGroup, './img/hero_icons/' + gameData.Players[3].Character.toLowerCase() + '.png', 215, -105, 40, 40, true, 3);
	createHUDLegendImage(legendGroup, './img/hero_icons/' + gameData.Players[4].Character.toLowerCase() + '.png', 275, -105, 40, 40, true, 4);

	createHUDLegendText(legendGroup, gameData.Players[5].IsWinner ? "Red Team (Winner):" : "Red Team:", 10, -135, 0.12); //35 width

	createHUDLegendImage(legendGroup, './img/hero_icons/' + gameData.Players[5].Character.toLowerCase() + '.png', 35, -185, 40, 40, true, 5);
	createHUDLegendImage(legendGroup, './img/hero_icons/' + gameData.Players[6].Character.toLowerCase() + '.png', 95, -185, 40, 40, true, 6);
	createHUDLegendImage(legendGroup, './img/hero_icons/' + gameData.Players[7].Character.toLowerCase() + '.png', 155, -185, 40, 40, true, 7);
	createHUDLegendImage(legendGroup, './img/hero_icons/' + gameData.Players[8].Character.toLowerCase() + '.png', 215, -185, 40, 40, true, 8);
	createHUDLegendImage(legendGroup, './img/hero_icons/' + gameData.Players[9].Character.toLowerCase() + '.png', 275, -185, 40, 40, true, 9);

	createHUDLegendText(legendGroup, "Icons:", 10, -220, 0.12);
	
	createHUDLegendImage(legendGroup, './img/graph_icons/death.png', 35, -265, 50, 50, false, -1);
	createHUDLegendText(legendGroup, "Hero Death", 70, -260, 0.12);

	createHUDLegendImage(legendGroup, './img/graph_icons/tower.png', 35, -325, 45, 45, false, -1);
	createHUDLegendText(legendGroup, "Tower", 70, -320, 0.12);
	createHUDLegendImage(legendGroup, './img/graph_icons/fort.png', legendw / 2 + 25, -325, 50, 50, false, -1);
	createHUDLegendText(legendGroup, "Fort", legendw / 2 + 60, -320, 0.12);

	createHUDLegendImage(legendGroup, './img/graph_icons/objective.png', 35, -380, 35, 35, false, -1);
	createHUDLegendText(legendGroup, "Objective", 70, -370, 0.12);
	createHUDLegendImage(legendGroup, './img/graph_icons/boss.png', legendw / 2 + 25, -380, 140, 70, false, -1);
	createHUDLegendText(legendGroup, "Boss", legendw / 2 + 60, -380, 0.12);

	sceneOrtho.add(legendGroup);
	legendGroup.position.set((-windowWidth / 2) + 2, (-windowHeight / 2) + legendh + 1, 1);
}

function createHUDLegendText(group, text, xOffset, yOffset, size) {
	const loader = new FontLoader();
	loader.load('./fonts/Roboto_Regular.json',
	function(font) {
		const color = 0xebebeb;
		const matLite = new THREE.MeshBasicMaterial( {
			color: color,
			side: THREE.DoubleSide
		} );

		const msg = text;

		const shapes = font.generateShapes( msg, 100 );

		const geometry = new THREE.ShapeGeometry( shapes );
		
		geometry.computeBoundingBox();

		const yTop = -( geometry.boundingBox.max.y - geometry.boundingBox.min.y );

		geometry.translate( 0, yTop, 0 );

		const textMesh = new THREE.Mesh( geometry, matLite );

		textMesh.position.set(xOffset, yOffset, 1);
		textMesh.scale.set(size, size, 0);

		group.add(textMesh);
	});
}

function createHUDLegendImage(group, path, xOffset, yOffset, xSize, ySize, isHeroIcon, playerIndex) {
	const image = new THREE.TextureLoader().load( path );
	const material = new THREE.SpriteMaterial( { map: image, transparent: true } );
	const sprite = new THREE.Sprite( material );
	sprite.position.set(xOffset, yOffset, 1);
	sprite.scale.set(xSize, ySize, 0);

	if (isHeroIcon) {
		const circleGeometry = new THREE.CircleGeometry( Math.max(xSize, ySize) / 2 + 5, 32 );
		const circleMaterial = new THREE.MeshBasicMaterial( { color: colors[playerIndex] } );
		const circle = new THREE.Mesh( circleGeometry, circleMaterial );
		circle.position.set(xOffset, yOffset, 1);
		group.add(circle);
	}

	group.add(sprite);
}

function createViewFramesAndHeaders()
{
	const geometrym = new THREE.PlaneGeometry( 3, windowHeight );
	const materialm = new THREE.MeshBasicMaterial( {color: 0x000000, side: THREE.DoubleSide} );
	midSeparator = new THREE.Mesh( geometrym, materialm );
	sceneOrtho.add(midSeparator);
	midSeparator.position.set(0, 0, 1);

	const geometryr = new THREE.PlaneGeometry( windowWidth, 3 );
	const materialr = new THREE.MeshBasicMaterial( {color: 0x000000, side: THREE.DoubleSide} );
	rightSeparator = new THREE.Mesh( geometryr, materialr );
	sceneOrtho.add(rightSeparator);
	rightSeparator.position.set(windowWidth / 2, 0, 1);

	const loader = new FontLoader();
	loader.load('./fonts/Roboto_Regular.json',
		function(font) {
			const color = 0x000000;
			const matLite = new THREE.MeshBasicMaterial( {
				color: color,
				transparent: true,
				opacity: 1,
				side: THREE.DoubleSide
			} );

			const msg = 'Perspective';

			const shapes = font.generateShapes( msg, 100 );

			const geometry = new THREE.ShapeGeometry( shapes );
			
			geometry.computeBoundingBox();

			const yTop = -( geometry.boundingBox.max.y - geometry.boundingBox.min.y );

			geometry.translate( 0, yTop, 0 );

			mainViewHeader = new THREE.Mesh( geometry, matLite );

			mainViewHeader.position.set((-windowWidth / 2) + 4, windowHeight / 2, 1);
			mainViewHeader.scale.set(0.15, 0.15, 0.15);

			sceneOrtho.add(mainViewHeader);
		});

	loader.load('./fonts/Roboto_Regular.json',
		function(font) {
			const color = 0x000000;
			const matLite = new THREE.MeshBasicMaterial( {
				color: color,
				transparent: true,
				opacity: 1,
				side: THREE.DoubleSide
			} );

			const msg = 'Side view';

			const shapes = font.generateShapes( msg, 100 );

			const geometry = new THREE.ShapeGeometry( shapes );
			
			geometry.computeBoundingBox();

			const yTop = -( geometry.boundingBox.max.y - geometry.boundingBox.min.y );

			geometry.translate( 0, yTop, 0 );

			topViewHeader = new THREE.Mesh( geometry, matLite );

			topViewHeader.position.set(4, (windowHeight / 2) - 4, 1);
			topViewHeader.scale.set(0.15, 0.15, 0.15);

			sceneOrtho.add(topViewHeader);
		});

	loader.load('./fonts/Roboto_Regular.json',
		function(font) {
			const color = 0x000000;
			const matLite = new THREE.MeshBasicMaterial( {
				color: color,
				transparent: true,
				opacity: 1,
				side: THREE.DoubleSide
			} );

			const msg = 'Top view';

			const shapes = font.generateShapes( msg, 100 );

			const geometry = new THREE.ShapeGeometry( shapes );
			
			geometry.computeBoundingBox();

			const yTop = -( geometry.boundingBox.max.y - geometry.boundingBox.min.y );

			geometry.translate( 0, yTop, 0 );

			botViewHeader = new THREE.Mesh( geometry, matLite );

			botViewHeader.position.set(4, -2, 1);
			botViewHeader.scale.set(0.15, 0.15, 0.15);

			sceneOrtho.add(botViewHeader);
		});
}

function updateHUD()
{
	sceneOrtho.remove(rightSeparator);
	const geometryr = new THREE.PlaneGeometry( windowWidth, 3 );
	const materialr = new THREE.MeshBasicMaterial( {color: 0x000000, side: THREE.DoubleSide} );
	rightSeparator = new THREE.Mesh( geometryr, materialr );
	sceneOrtho.add(rightSeparator);
	rightSeparator.position.set(windowWidth / 2, 0, 1);
	
	if(mainViewHeader)
	{
		mainViewHeader.position.set((-windowWidth / 2) + 4, windowHeight / 2, 1);
	}

	if(topViewHeader)
	{
		topViewHeader.position.set(4, (windowHeight / 2) - 4, 1);
	}

	if(botViewHeader)
	{
		botViewHeader.position.set(4, -2, 1);
	}
}

// =====

// UI - CONTROLS/FILTERS FUNCTIONALITY

function syncViews() {
	if (lastInteractedViewIdx == 1) {
		views[2].camera.position.z = views[1].camera.position.z;
		views[2].controls.target.z = views[1].controls.target.z;
	}

	if (lastInteractedViewIdx == 2) {
		views[1].camera.position.z = views[2].camera.position.z;
		views[1].controls.target.z = views[2].controls.target.z;
	}
}

function hideShowLine(index, value, transparency) {
	const isVisible = value;
	linesVisible[index] = isVisible;
	for(var i = 0; i < playerDeathVisualizationObjects[index].length; i++) {
		playerDeathVisualizationObjects[index][i].visible = deathVisible;
		if(isVisible) {
			playerDeathVisualizationObjects[index][i].material.opacity = 1.0;
		}
		else {
			playerDeathVisualizationObjects[index][i].material.opacity = 1 - transparency;
		}
	}
}

function updateDeathsTransparency(transparency) {
	for(var i = 0; i < playerDeathVisualizationObjects.length; i++) {
		const isVisible = linesVisible[i];
		if(isVisible) {
			continue;
		}

		for(var j = 0; j < playerDeathVisualizationObjects[i].length; j++) {
			if(transparency == 1) {
				playerDeathVisualizationObjects[i][j].visible = false;
			}
			else {
				playerDeathVisualizationObjects[i][j].visible = true;
			}
			playerDeathVisualizationObjects[i][j].material.opacity = 1 - transparency;
		}
	}
}

function hideShowDeaths(val) {
	deathVisible = val;
	for(var i = 0; i < playerDeathVisualizationObjects.length; i++) {
		for(var j = 0; j < playerDeathVisualizationObjects[i].length; j++) {
			playerDeathVisualizationObjects[i][j].visible = deathVisible;
		}
	}
}

function hideShowStructureObjects(value) {
	for(var i = 0; i < structureVisualizationObjects.length; i++) {
		structureVisualizationObjects[i].visible = value;
	}
}

function showRawLines(transparency) {
	for(var i = 0; i < playerLines.length; i++) {
		for(var j = 0; j < playerLines[i].length; j++) {
			playerLines[i][j].visible = true;
			const isVisible = linesVisible[i];
			if(isVisible) {
				playerLines[i][j].material.opacity = 1.0;
			}
			else {
				if(transparency == 1) {
					playerLines[i][j].visible = false;
				}
				playerLines[i][j].material.opacity = 1 - transparency;
			}
		}
	}

	for(var i = 0; i < playerLinesSmooth.length; i++) {
		for(var j = 0; j < playerLinesSmooth[i].length; j++) {
			playerLinesSmooth[i][j].visible = false;
		}
	}
}

function showSmoothLines(transparency) {
	for(var i = 0; i < playerLines.length; i++) {
		for(var j = 0; j < playerLines[i].length; j++) {
			playerLines[i][j].visible = false;
		}
	}

	for(var i = 0; i < playerLinesSmooth.length; i++) {
		for(var j = 0; j < playerLinesSmooth[i].length; j++) {
			playerLinesSmooth[i][j].visible = true;
			const isVisible = linesVisible[i];
			if(isVisible) {
				playerLinesSmooth[i][j].material.opacity = 1.0;
			}
			else {
				if(transparency == 1) {
					playerLinesSmooth[i][j].visible = false;
				}
				playerLinesSmooth[i][j].material.opacity = 1 - transparency;
			}
		}
	}
}

function switchRawSmoothLines(lineType, transparency) {
	switch ( lineType ) {
		case 1:
			showRawLines(transparency);
			updateDeathsTransparency(transparency);

			break;
		case 0:
			showSmoothLines(transparency);
			updateDeathsTransparency(transparency);

			break;
	}
}

// =====

// BUILDING UI

function initGUI() {
	gui = new GUI({ autoPlace: false });

	const param = {
		teamBlue: true,
		teamRed: true,
		p1: true,
		p2: true,
		p3: true,
		p4: true,
		p5: true,
		p6: true,
		p7: true,
		p8: true,
		p9: true,
		p10: true,

		lineType: 0,
		filteredLineTransparency: 1,

		deaths: true,
		structures: true,
		mapTransparency: 0.5,
		mapPosition: 0,
		legend: true,

		sync: false
	};

	gui.add(param, 'legend').name("Legend").onChange( function ( val ) {
		legendGroup.visible = val;
	});

	const heroLines = gui.addFolder("Hero Lines");

	var bluet = heroLines.add(param, 'teamBlue').name(gameData.Players[0].IsWinner ? "Blue Team (Won)" : "Blue Team").onChange( function ( val ) {
		param.p1 = val;
		param.p2 = val;
		param.p3 = val;
		param.p4 = val;
		param.p5 = val;
		
		hideShowLine(0, val, param.filteredLineTransparency);
		hideShowLine(1, val, param.filteredLineTransparency);
		hideShowLine(2, val, param.filteredLineTransparency);
		hideShowLine(3, val, param.filteredLineTransparency);
		hideShowLine(4, val, param.filteredLineTransparency);
		switchRawSmoothLines(param.lineType, param.filteredLineTransparency);
		
		p1.updateDisplay();
		p2.updateDisplay();
		p3.updateDisplay();
		p4.updateDisplay();
		p5.updateDisplay();
	} );

	changeUIElementColor(bluet, "#0000ff50");

	var redt = heroLines.add(param, 'teamRed').name(gameData.Players[5].IsWinner ? "Red Team (Won)" : "Red Team").onChange( function ( val ) {
		param.p6 = val;
		param.p7 = val;
		param.p8 = val;
		param.p9 = val;
		param.p10 = val;
		
		hideShowLine(5, val, param.filteredLineTransparency);
		hideShowLine(6, val, param.filteredLineTransparency);
		hideShowLine(7, val, param.filteredLineTransparency);
		hideShowLine(8, val, param.filteredLineTransparency);
		hideShowLine(9, val, param.filteredLineTransparency);
		switchRawSmoothLines(param.lineType, param.filteredLineTransparency);

		p6.updateDisplay();
		p7.updateDisplay();
		p8.updateDisplay();
		p9.updateDisplay();
		p10.updateDisplay();
	} );

	changeUIElementColor(redt, "#ff000050");

	function updateTeamBlueToggleIfNeeded() {
		if(param.p1 || param.p2 || param.p3 || param.p4 || param.p5) {
			param.teamBlue = true;
			bluet.updateDisplay();
		}

		if(!param.p1 && !param.p2 && !param.p3 && !param.p4 && !param.p5) {
			param.teamBlue = false;
			bluet.updateDisplay();
		}
	}

	function updateTeamRedToggleIfNeeded() {
		if(param.p6 || param.p7 || param.p8 || param.p9 || param.p10) {
			param.teamRed = true;
			redt.updateDisplay();
		}

		if(!param.p6 && !param.p7 && !param.p8 && !param.p9 && !param.p10) {
			param.teamRed = false;
			redt.updateDisplay();
		}
	}

	const blueTeam = heroLines.addFolder("Blue Team Players")
	blueTeam.close();

	var p1 = blueTeam.add(param, 'p1').name(gameData.Players[0].Character).onChange( function ( val ) {
		hideShowLine(0, val, param.filteredLineTransparency);
		switchRawSmoothLines(param.lineType, param.filteredLineTransparency);
		updateTeamBlueToggleIfNeeded();
	} );

	changeUIElementColor(p1, colorsUI[0]);
	changeUIElementFontColor(p1, "#000000");

	var p2 = blueTeam.add(param, 'p2').name(gameData.Players[1].Character).onChange( function ( val ) {
		hideShowLine(1, val, param.filteredLineTransparency);
		switchRawSmoothLines(param.lineType, param.filteredLineTransparency);
		updateTeamBlueToggleIfNeeded();
	} );

	changeUIElementColor(p2, colorsUI[1]);
	changeUIElementFontColor(p2, "#000000");

	var p3 = blueTeam.add(param, 'p3').name(gameData.Players[2].Character).onChange( function ( val ) {
		hideShowLine(2, val, param.filteredLineTransparency);
		switchRawSmoothLines(param.lineType, param.filteredLineTransparency);
		updateTeamBlueToggleIfNeeded();
	} );

	changeUIElementColor(p3, colorsUI[2]);
	changeUIElementFontColor(p3, "#000000");

	var p4 = blueTeam.add(param, 'p4').name(gameData.Players[3].Character).onChange( function ( val ) {
		hideShowLine(3, val, param.filteredLineTransparency);
		switchRawSmoothLines(param.lineType, param.filteredLineTransparency);
		updateTeamBlueToggleIfNeeded();
	} );

	changeUIElementColor(p4, colorsUI[3]);
	changeUIElementFontColor(p4, "#000000");

	var p5 = blueTeam.add(param, 'p5').name(gameData.Players[4].Character).onChange( function ( val ) {
		hideShowLine(4, val, param.filteredLineTransparency);
		switchRawSmoothLines(param.lineType, param.filteredLineTransparency);
		updateTeamBlueToggleIfNeeded();
	} );

	changeUIElementColor(p5, colorsUI[4]);
	changeUIElementFontColor(p5, "#000000");

	const redTeam = heroLines.addFolder("Red Team Players")
	redTeam.close();

	var p6 = redTeam.add(param, 'p6').name(gameData.Players[5].Character).onChange( function ( val ) {
		hideShowLine(5, val, param.filteredLineTransparency);
		switchRawSmoothLines(param.lineType, param.filteredLineTransparency);
		updateTeamRedToggleIfNeeded();
	} );

	changeUIElementColor(p6, colorsUI[5]);
	changeUIElementFontColor(p6, "#000000");

	var p7 = redTeam.add(param, 'p7').name(gameData.Players[6].Character).onChange( function ( val ) {
		hideShowLine(6, val, param.filteredLineTransparency);
		switchRawSmoothLines(param.lineType, param.filteredLineTransparency);
		updateTeamRedToggleIfNeeded();
	} );

	changeUIElementColor(p7, colorsUI[6]);
	changeUIElementFontColor(p7, "#000000");

	var p8 = redTeam.add(param, 'p8').name(gameData.Players[7].Character).onChange( function ( val ) {
		hideShowLine(7, val, param.filteredLineTransparency);
		switchRawSmoothLines(param.lineType, param.filteredLineTransparency);
		updateTeamRedToggleIfNeeded();
	} );

	changeUIElementColor(p8, colorsUI[7]);
	changeUIElementFontColor(p8, "#000000");

	var p9 = redTeam.add(param, 'p9').name(gameData.Players[8].Character).onChange( function ( val ) {
		hideShowLine(8, val, param.filteredLineTransparency);
		switchRawSmoothLines(param.lineType, param.filteredLineTransparency);
		updateTeamRedToggleIfNeeded();
	} );

	changeUIElementColor(p9, colorsUI[8]);
	changeUIElementFontColor(p9, "#000000");

	var p10 = redTeam.add(param, 'p10').name(gameData.Players[9].Character).onChange( function ( val ) {
		hideShowLine(9, val, param.filteredLineTransparency);
		switchRawSmoothLines(param.lineType, param.filteredLineTransparency);
		updateTeamRedToggleIfNeeded();
	} );

	changeUIElementColor(p10, colorsUI[9]);
	changeUIElementFontColor(p10, "#000000");

	const lineSettings = gui.addFolder("Line Settings");
	lineSettings.add(param, 'lineType', { Smooth: 0, Raw: 1 }).name("Line Type").onChange( function ( val ) {
		switchRawSmoothLines(val, param.filteredLineTransparency);
	});

	lineSettings.add(param, 'filteredLineTransparency', 0, 1, 0.1).name("Unchecked Player Transparency").onChange( function ( val ) {
		filteredLinesTransparency = val;
		switchRawSmoothLines(param.lineType, val);;
	});

	const graphHelpers = gui.addFolder("Graph Helpers");
	graphHelpers.add(param, 'deaths').name("Deaths").onChange( function ( val ) {
		hideShowDeaths(val);
	});

	graphHelpers.add(param, 'structures').name("Structures").onChange( function ( val ) {
		hideShowStructureObjects(val);
	});

	graphHelpers.add(param, 'mapTransparency', 0, 1, 0.1).name("Map Transparency").onChange( function ( val ) {
		map.material.opacity = 1 - val;
		mapTransparency = val;
	});

	graphHelpers.add(param, 'mapPosition', 0, gameData.GameLengthSeconds, 1).name("Map Position (seconds)").onChange( function ( val ) {
		map.position.z = -val;
	});

	const viewControls = gui.addFolder("View Controls");

	viewControls.add(param, 'sync').name("Side-Top Sync Mode").onChange( function ( val ) {
		topSideSyncMode = val;
		syncViews();
	});

	$('.moveGUI').append($(gui.domElement));
}

function changeUIElementColor(uiElement, color) {
	uiElement.domElement.style.backgroundColor = color;
}

function changeUIElementFontColor(uiElement, color) {
	uiElement.domElement.style.color = color;
	uiElement.domElement.style.fontWeight = "bold";
}

// =====

// PREUPLOADED MATCH HANDLING

function hideInitialText() {
	var textToHide = document.querySelector('#init_text');
	if (textToHide.style.display == "none") return;
	textToHide.style.display = "none";
}

async function getMatch(name) {
	return await fetch('./matches/' + name + '.json')
  					.then(response => response.json())
 					.then(responseJson => {return responseJson});
}

async function preloadedMatch(name) {
	gameData = await getMatch(name);
	resetEverything();
	$("#jsonForm").val('');
}

document.querySelector('#match1').addEventListener('click', () => {
	preloadedMatch('alterac');
});

document.querySelector('#match2').addEventListener('click', () => {
	preloadedMatch('eternity');
});

document.querySelector('#match3').addEventListener('click', () => {
	preloadedMatch('blackheart');
});

document.querySelector('#match4').addEventListener('click', () => {
	preloadedMatch('braxis');
});

document.querySelector('#match5').addEventListener('click', () => {
	preloadedMatch('cursed');
});

document.querySelector('#match6').addEventListener('click', () => {
	preloadedMatch('dragon');
});

document.querySelector('#match7').addEventListener('click', () => {
	preloadedMatch('garden');
});

document.querySelector('#match8').addEventListener('click', () => {
	preloadedMatch('shrines');
});

document.querySelector('#match9').addEventListener('click', () => {
	preloadedMatch('sky');
});

document.querySelector('#match10').addEventListener('click', () => {
	preloadedMatch('tomb');
});

document.querySelector('#match11').addEventListener('click', () => {
	preloadedMatch('towers');
});

document.querySelector('#match12').addEventListener('click', () => {
	preloadedMatch('volskaya');
});

document.querySelector('#match13').addEventListener('click', () => {
	preloadedMatch('warhead');
});

document.querySelector('#match14').addEventListener('click', () => {
	preloadedMatch('lostcavern_aram');
});

// =====

// MATCH UPLOAD HANDLING

let form = document.querySelector('#jsonForm');

async function fileToJSON(file) {
	return new Promise((resolve, reject) => {
	  const fileReader = new FileReader()
	  fileReader.onload = () => resolve(JSON.parse(fileReader.result))
	  fileReader.onerror = error => reject(error)
	  fileReader.readAsText(file)
	})
}


async function handleUpload(event) {
	const jsonFile = event.target.files[0];
	const obj = await fileToJSON(jsonFile);
	gameData = obj;
	resetEverything();
}

form.addEventListener('change', handleUpload);

// =====