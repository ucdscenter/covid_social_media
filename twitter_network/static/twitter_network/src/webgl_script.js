'use strict'


async function wrapper(){

	 $('.obj-mouseover').off()

	let width = window.innerWidth;
	let height = window.innerHeight;
	let fname = d3.select("#identifier").text() + "data.json"
	let data =  await d3.json("/static/twitter_network/data/" + fname)
	console.log(data)

	let formatter  = d3.format(".3s")  

	d3.select('#found-count').text(formatter(data.data.length))

	var vertices = [];
	let colors = [];

	let colorScheme = d3.schemeTableau10
	let color = new THREE.Color()
	const spreadMult = 100
	var raycaster;
	var threshold = 0.1;
	var geometry = new THREE.BufferGeometry();
	var material = new THREE.ShaderMaterial( {

					uniforms: {
						color: { value: new THREE.Color( 0xffffff ) },
						pointTexture: { value: new THREE.TextureLoader().load( "/static/twitter_network/images/disc.png" ) }
					},
					vertexShader: document.getElementById( 'vertexshader' ).textContent,
					fragmentShader: document.getElementById( 'fragmentshader' ).textContent,

					alphaTest: 0.9

		} );

	//var material = new THREE.PointsMaterial({size : 1, vertexColors : true})
	var points = new THREE.Points( geometry, material );	
 	var camera, scene, renderer;
	var geometry, material, mesh;
	var pointGeo
	var controls

	var outermousex, outermousey;
	var textGroup = new THREE.Group()
	
	
	var loader = new THREE.FontLoader();

	var mouse = {
    x: 0,
    y: 0
  	},
  	INTERSECTED;
  
	init();
	animate();
 
	function init() {

		var indices = new Uint16Array( data.data.length );
		var k = 0;
		let max_pop = -1
		for ( var i = 0; i < data.data.length; i ++ ){
			indices[ i ] = i;
			
			if (parseInt(data.data[i].p) > max_pop){
				max_pop = parseInt(data.data[i].p)
			}
		}


		let sizeScale = d3.scaleLinear().domain([0, max_pop]).range([1, 30])

		geometry.setAttribute( 'position', new THREE.Float32BufferAttribute(data.data.map(function(d){
			var x = d.l[0] * spreadMult;
			var y = d.l[1] * spreadMult;
			var z = 0//d.l[2] * spreadMult;
			return [x,y,z]
		}).flat(), 3 ));
		geometry.setAttribute( 'ca', new THREE.Float32BufferAttribute(data.data.map(function(d){
			color.setHex("0x" + colorScheme[d.c].slice(1))
			return [color.r, color.g, color.b]
		}).flat(), 3 ));
		geometry.setIndex( new THREE.BufferAttribute( indices, 1 ) );
		geometry.setAttribute('size', new THREE.Float32BufferAttribute( data.data.map(function(d){
			
			/*var scalesize = (d.p / max_pop) 
			if (scalesize > 1){
				console.log(max_pop)
				console.log(d.p)
				console.log(scalesize)
			}*/
			return [sizeScale(parseInt(d.p))];
		}).flat(), 1))


		geometry.computeBoundingSphere();
 
	    camera = new THREE.PerspectiveCamera( 45, window.innerWidth/ window.innerHeight, .1, 2000 );
	  
		camera.position.set(0, 0, 300)
		raycaster = new THREE.Raycaster();
		raycaster.params = {
				Mesh: {},
				Line: {},
				LOD: {},
				Points: { threshold: .5 },
				Sprite: {}
			};
		mouse = new THREE.Vector2();

	    scene = new THREE.Scene();
	    scene.background = new THREE.Color('white');
	    camera.lookAt(scene.position);
	 	scene.add(points);
	 	loader.load("/static/twitter_network/src/helvetiker.json", function(text){
	 		let cIndex = 0
	 		data.centroids.forEach(function(c){
	 			var sphereMat = new THREE.MeshBasicMaterial({
 					color: new THREE.Color().setHex("0x" + colorScheme[cIndex].slice(1)),
					transparent: true,
					opacity: .5,
	 			})
	 			var textMat = new THREE.MeshBasicMaterial( {
						color: 0x00000,
						transparent: true,
						opacity: 1,
					} );
	 			var textGeo = new THREE.TextGeometry(c[1], {
	 				font : text,
	 				size: 1,
	 				height: 0,
	 				bevelThickness : 1,
	 				bevelOffset : 1
	 			})

	 			var sphereGeo = new THREE.BoxGeometry(c[1].length, 5, .1)
	 		cIndex++;
	 		textGeo.center()
			let centroidLabel = new THREE.Mesh(textGeo, textMat)//makeTextSprite(c[1], "rgb(255,255,255)")
			let centroidSphere = new THREE.Mesh(sphereGeo, sphereMat)
			centroidLabel.position.set((c[0][0] * spreadMult), c[0][1] * spreadMult , 0)
			centroidSphere.position.set((c[0][0] * spreadMult), c[0][1] * spreadMult , 0)
			textGroup.add(centroidLabel)
			textGroup.add(centroidSphere)
			scene.add(centroidLabel)
	 		})
	 	
	 		scene.add(textGroup)

	 	})
	 	
	 	
		//scene.add( sphere );
	 
	    renderer = new THREE.WebGLRenderer( { antialias: true } );
	    renderer.setSize( window.innerWidth - 30, window.innerHeight  - 89);
	    controls = new THREE.OrbitControls( camera, renderer.domElement );
	    controls.enableRotate = false
	    //controls.update();
	    document.getElementById('vis-div').appendChild( renderer.domElement );
	    document.getElementById('vis-div').addEventListener( 'mousemove', onDocumentMouseMove);
	}//init

	function onDocumentMouseMove( event ) {
		mouse.x = ((event.clientX )/ window.innerWidth) * 2 - 1;
  		mouse.y = -((event.clientY  - 70) / (window.innerHeight)) * 2 + 1;
  		outermousex = event.clientX;
  		outermousey = event.clientY;
	}

 	var intersects
 	var thing = 0
	function animate() {
		requestAnimationFrame(animate);
  		render();
  		update();	 
	}//animate

	var index = undefined;
	var oldr, oldg, oldb;
	var fetchdoc
	function update() {
		raycaster.setFromCamera( mouse, camera );
		var intersects = raycaster.intersectObjects( [ points ] );
		fetchdoc = false

		
		if (intersects[0] != undefined){
			//console.log(intersects[0])
			if (intersects[0].index != index){
				points.geometry.attributes.ca.array[index * 3] = oldr
				points.geometry.attributes.ca.array[(index * 3) + 1] = oldg
				points.geometry.attributes.ca.array[(index * 3) + 2] = oldb

				index = intersects[ 0 ].index
				oldr = points.geometry.attributes.ca.array[index * 3]
				oldg = points.geometry.attributes.ca.array[(index * 3) + 1]
				oldb = points.geometry.attributes.ca.array[(index * 3) + 2]
				points.geometry.attributes.ca.array[index * 3] = 0
				points.geometry.attributes.ca.array[(index * 3) + 1] = 0
				points.geometry.attributes.ca.array[(index * 3) + 2] = 0
				fetchdoc = true
			}
			
		}
		else{
			if (index != undefined){
				points.geometry.attributes.ca.array[index * 3] = oldr
				points.geometry.attributes.ca.array[(index * 3) + 1] = oldg
				points.geometry.attributes.ca.array[(index * 3) + 2] = oldb
			}
			index = undefined
			
		}
		if(fetchdoc){
			getTweet(data.data[index]);
		}
		else{
			if(index == undefined){
				$('.obj-mouseover').addClass('hidden')
			}
		}
		points.geometry.attributes.ca.needsUpdate = true
  		controls.update();
	}

	function render() {
  		renderer.render(scene, camera);
	}
	
	async function getTweet(tweetObj){

		$('.obj-mouseover').removeClass('hidden')
		let data = { left: outermousex + 5, top: outermousey + 20}
		$('.obj-mouseover').offset(data)
		let tweet_data = await d3.json("/twitter_network/get_tweet?tweet_id=" + tweetObj["id"])
		$('.obj-mouseover p.name').text(tweet_data.user)
		$('.obj-mouseover p.count').text(tweet_data.text)
	}


	d3.select("#loading-div").classed("hidden", true)
	d3.select("#vis-div").classed("hidden", false)


	
	}//wrapper

wrapper();