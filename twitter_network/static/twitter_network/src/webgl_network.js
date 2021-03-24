'use strict'

async function wrapper(){
	let width = window.innerWidth;
	let height = window.innerHeight;
	let fname = d3.select("#identifier").text() + "_network_result.json"
	let data =  await d3.json("/twitter_network/get_network_json?model_json=" + fname + '&local=true')
	console.log(data)

	
	var vertices = [];
	let colors = [];

	let formatter  = d3.format(".3s")  
	let dateParse = d3.timeParse("%H-%d-%m-%Y")
	let dateFormat = d3.timeFormat("%d-%m-%Y")

	let colorScheme = d3.schemeSet3
	var circle
	var sparkScaleX
	let color = new THREE.Color()
	let spreadMult = 100
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

	d3.select('#found-count').text(formatter(data.nodes.length) + " accounts")


	d3.select("#loading-div").classed("hidden", true)
	d3.select("#vis-div").classed("hidden", false)

 
	function init() {

		var indices = new Uint16Array( data.nodes.length );
		var k = 0;
		let max_pop = -1
		let max_score = -1
		let x_extent = [100, -100]
		let y_extent = [100, -100]
		for ( var i = 0; i < data.nodes.length; i ++ ){
			indices[ i ] = i;
			/*if (dateParse(data.data[i].d).getTime() < timeExt[0].getTime()){
					timeExt[0] = dateParse(data.data[i].d)
			}
			if (dateParse(data.data[i].d) > timeExt[1].getTime()){
				timeExt[1] = dateParse(data.data[i].d)
			}*/
			if (parseInt(data.nodes[i][1]) > max_pop){
				max_pop = parseInt(data.nodes[i][1])
			}
			if (parseInt(data.nodes[i][2]) > max_score){
				max_score = parseInt(data.nodes[i][2])
			}
			if (data.nodes[i][4] < x_extent[0]){
				x_extent[0] = data.nodes[i][4]
			}
			if (data.nodes[i][4] > x_extent[1]){
				x_extent[1] =data.nodes[i][4]
			}
			if (data.nodes[i][5] < y_extent[0]){
				y_extent[0] = data.nodes[i][5]
			}
			if (data.nodes[i][5] > y_extent[1]){
				y_extent[1] = data.nodes[i][5]
			}
		}

		console.log(x_extent)
		console.log(y_extent)
		console.log(max_pop)
		console.log(max_score)
		/*var Difference_In_Time = timeExt[1] - timeExt[0]
		var Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);

		spreadMult = (Difference_In_Days / 2) * 10
		let sizeScale = d3.scaleLinear().domain([0, max_pop]).range([1, 30])
		timeScale = d3.scaleTime().range([-spreadMult, spreadMult]).domain(timeExt)
		let spreadExt = d3.extent(data.data, function(d){
			return d.l[0]
		})
		let spreadScale = d3.scaleLinear().domain(spreadExt).range([0, 100]) 
		*/
		let scoreScale = d3.scaleLinear().domain([0, max_score]).range([1, 30])
		let popScale = d3.scaleLinear().domain([0, max_pop]).range([1, 30])
		let xScale = d3.scaleLinear().domain(x_extent).range([-250, 250])
		let yScale = d3.scaleLinear().domain(y_extent).range([-250, 250])

		geometry.setAttribute( 'position', new THREE.Float32BufferAttribute(data.nodes.map(function(d){
			var x = xScale(d[[4]])
			var y = yScale(d[5])
			var z = 0//d.l[2] * spreadMult;
			return [x,y,z]
		}).flat(), 3 ));
		geometry.setAttribute( 'ca', new THREE.Float32BufferAttribute(data.nodes.map(function(d){
			let thecolor = colorScheme[3]
			if (thecolor == undefined)
				color.setHex(0xffffff)
			else{
				color.setHex("0x" + thecolor.slice(1))
			}
			return [color.r, color.g, color.b]
		}).flat(), 3 ));
		geometry.setIndex( new THREE.BufferAttribute( indices, 1 ) );
		geometry.setAttribute('size', new THREE.Float32BufferAttribute( data.nodes.map(function(d){
			
			/*var scalesize = (d.p / max_pop) 
			if (scalesize > 1){
				console.log(max_pop)
				console.log(d.p)
				console.log(scalesize)
			}*/
			return [scoreScale(d[2])];
		}).flat(), 1))


		geometry.computeBoundingSphere();
 
	    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, .1, 2000 );
	  
		camera.position.set(0, 0, 300)
		raycaster = new THREE.Raycaster();
		raycaster.params = {
				Mesh: {},
				Line: {},
				LOD: {},
				Points: { threshold: 2 },
				Sprite: {}
			};
		mouse = new THREE.Vector2();

	    scene = new THREE.Scene();
	    scene.background = new THREE.Color('white');
	    camera.lookAt(scene.position);
	 	scene.add(points);


	 
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
  		mouse.y = -((event.clientY  - 35) / (window.innerHeight)) * 2 + 1;
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
			/*
			getTweet(data.nodes[index]);
			if(data.data[index].c != -1){
				d3.selectAll('.line').classed("hidden", true)
				d3.select('.line_' + data.data[index].c).classed("hidden", false)
				circle.classed("hidden", false).attr("cx", sparkScaleX(dateParse(data.data[index].d)))

			}
			*/
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


}
wrapper()