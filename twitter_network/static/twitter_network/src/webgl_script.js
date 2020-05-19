'use strict'


async function wrapper(){

	 $('.obj-mouseover').off()

	let width = window.innerWidth;
	let height = window.innerHeight;
	let fname = d3.select("#identifier").text() + "data.json"
	let data =  await d3.json("/twitter_network/get_network_json?model_json=" + fname)
	let formatter  = d3.format(".3s")
	let dateParse = d3.timeParse("%H-%d-%m-%Y")
	let dateFormat = d3.timeFormat("%d-%m-%Y")

	data.centroids.forEach(function(c){
		c.count = 0
	})
	

	data.data.forEach(function(d){
		if(d.c > -1){
		data.centroids[d.c].count += 1
		}
	})

	data.centroids.forEach(function(c){
		if (c[1].length > 50){
			c[1] = c[1].slice(0, 50) + "..."
		}
		c[1] = c[1] + ":" + formatter(c.count)
	})
	console.log(data)
	

	

	let timeExt = [new Date(),new Date()]
	timeExt[0].setFullYear(2200)
	timeExt[1].setFullYear(1900)
	let timeCountExt = [10000000000000, -1]
	var timeScale;  

	d3.select('#found-count').text(formatter(data.data.length))

	var vertices = [];
	let colors = [];

	let colorScheme = d3.schemeSet3
	let color = new THREE.Color()
	var circle
	var sparkScaleX
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
			if (dateParse(data.data[i].d).getTime() < timeExt[0].getTime()){
				timeExt[0] = dateParse(data.data[i].d)
			}
			if (dateParse(data.data[i].d) > timeExt[1].getTime()){
				timeExt[1] = dateParse(data.data[i].d)
			}
			
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

			let thecolor = colorScheme[d.c]
			if (thecolor == undefined)
				color.setHex(0xffffff)
			else{
				color.setHex("0x" + thecolor.slice(1))
			}
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
	 	/*loader.load("/static/twitter_network/src/helvetiker.json", function(text){
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

	 	})*/
	 	
	 	
		//scene.add( sphere );
	 
	    renderer = new THREE.WebGLRenderer( { antialias: true } );
	    renderer.setSize( window.innerWidth - 30, window.innerHeight  - 89);
	    controls = new THREE.OrbitControls( camera, renderer.domElement );
	    controls.enableRotate = false
	    //controls.update();
	    document.getElementById('vis-div').appendChild( renderer.domElement );
	    document.getElementById('vis-div').addEventListener( 'mousemove', onDocumentMouseMove);

	    	    let padding = {left : 50, right: 10, top: 10, bottom : 10}
	    
	    let sparkwidth = 500;
	    let sparkheight = 100;
	    let clustersTimeLines = {}
	    var thingI = 0
	    sparkScaleX  = d3.scaleTime().domain(timeExt).range([0, sparkwidth - padding.left - padding.right])


	    data.centroids.forEach(function(c){
	    	clustersTimeLines[thingI]= {}
	    	thingI++
	    })
	    let timeMax = -1
	    console.log(clustersTimeLines)
	    data.data.forEach(function(tw){
	    	if (tw.c > -1){
		    	if (clustersTimeLines[tw.c][tw.d] != undefined){
		    		clustersTimeLines[tw.c][tw.d] += 1
		    		if (clustersTimeLines[tw.c][tw.d] > timeMax){
		    			timeMax = clustersTimeLines[tw.c][tw.d]
		    		}
		    	}
		    	else{
		    		clustersTimeLines[tw.c][tw.d] = 1
		    	}
	    	}
	    })
	    let y = d3.scaleLinear().domain([timeMax, 0]).range([padding.bottom, sparkheight - (padding.top + padding.bottom)])
	    let spark_svg = d3.select(".timeline-abs")
	    				.append("svg")
	    				.attr('id', "spark-svg")
	    				.attr("height", sparkheight)
	    				.attr("width", sparkwidth)

		spark_svg.append("g")
      .attr("transform", "translate(" + padding.left + "," + (sparkheight  - (padding.top + padding.bottom)) + ")")
      .attr("class", 'time-x-axis')
      .call(d3.axisBottom(sparkScaleX).ticks(4));
      spark_svg.append("g")
	      .attr("transform", "translate(" + padding.left + "," + 0 + ")")
	      .attr("class", 'time-y-axis')
	      .call(d3.axisLeft(y).ticks(4));

	    let line = d3.line()
      		.x(function(d) { return sparkScaleX(d[0]); })
      		.y(function(d) { return y(d[1]); })
      		.curve(d3.curveMonotoneX);

      	let lineg = spark_svg.append("g").attr('transform', 'translate(' + padding.left + ',' + 0 + ')')

      	circle = lineg.append("circle").attr("r", 3).attr("cx", 0).attr("cy", sparkheight - (padding.top + padding.bottom))

	   function addToLineG(lineData, linelabel, color){
			let sorted = lineData.sort(function(a,b){
		        return a[0].getTime() - b[0].getTime()
		     })

			let path = lineg.append("path").data([sorted])
		      .classed("line", true)
		      .classed("line_" + linelabel, true)
		      .style("stroke", color)
		      .attr("d", line);

		  path.append("svg:title").text(function(d){
		    return linelabel
		  })
		  path.on("mouseover", function(d){
		    d3.select("#id_" + linelabel).dispatch("mouseover")
		  })
		  path.on("mouseout", function(d){
		    d3.select("#id_" + linelabel).dispatch("mouseout")
		  })
		}
		//let otherDateParse = d3.timeParse("%d-%m-%Y")
		Object.keys(clustersTimeLines).forEach(function(c){
			addToLineG(Object.keys(clustersTimeLines[c]).map(function(t){
				
				return [dateParse(t), clustersTimeLines[c][t]]
			}), c, colorScheme[c])
		})
		let clabelIndex= 0 
		data.centroids.forEach(function(d){
			console.log(d[1])
			d3.select(".labels-abs").append("h6").attr("text-align", "center").style("background-color", colorScheme[clabelIndex]).style("font-size", ".7rem").text(d[1])
			clabelIndex++
		})
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
			if(data.data[index].c != -1){
				d3.selectAll('.line').classed("hidden", true)
				d3.select('.line_' + data.data[index].c).classed("hidden", false)
				circle.classed("hidden", false).attr("cx", sparkScaleX(dateParse(data.data[index].d)))

			}
		}
		else{
			if(index == undefined){
				$('.obj-mouseover').addClass('hidden')
				d3.selectAll('.line').classed("hidden", false)
				circle.classed("hidden", true)
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