'use strict'

async function wrapper(){
	let width = window.innerWidth;
	let height = window.innerHeight;
	let fname = d3.select("#identifier").text() + "_network_result.json"
	let data =  await d3.json("/twitter_network/get_network_json?model_json=" + fname + '&local=true')


	let dateParse = d3.timeParse("%Y-%m-%dT%H:%M:%S")
	let dateFormat = d3.timeFormat("%d-%m-%Y")

	console.log(data)
	data.nodes.forEach(function(n){
		n[8] = n[8].map(x => dateParse(x.split('.')[0]))
	})


	Object.keys(data.info.hashtags).forEach(function(h){
		data.info.hashtags[h] = { 'count' : data.info.hashtags[h], 'idxs' : []}
	})

	/*data.nodes.forEach(function(n, i){

		let text = n[7].toLowerCase()
		if(n[7].indexOf("#") > -1){
			console.log(text)
			Object.keys(data.info.hashtags).forEach(function(h){
				if(text.indexOf( "#" + h.toLowerCase()) > -1){
					// console.log(text)
					// console.log(i)
					//console.log(h)
					data.info.hashtags[h].idxs.push(i)
				}
			})

		}
	})*/




	
	
	var vertices = [];
	let colors = [];

	let formatter  = d3.format(".3s")  


	let scoreScale 
	let popScale 
	let xScale 
	let yScale 

	let colorScheme = d3.schemePaired
	var circle
	var sparkScaleX
	let color = new THREE.Color()
	let spreadMult = 100
	var raycaster;
	var threshold = 0.1;
	

	var circle_sprite = new THREE.TextureLoader().load(
        "/static/twitter_network/images/disc.png"
        )



	var indices
	var indices_dict = {};
	var user_idx_dict;


	var choose_points, choose_generated_points
	  


	var s_geometry = new THREE.BufferGeometry();
	var geometry = new THREE.BufferGeometry();

	var material = new THREE.PointsMaterial({
            size: 15,
            sizeAttenuation: false,
            vertexColors: THREE.VertexColors,
            map: circle_sprite,
            transparent: true,
        });


	var s_material = new THREE.PointsMaterial({
            size: 15,
            sizeAttenuation: false,
            vertexColors: THREE.VertexColors,
            map: circle_sprite,
            transparent: true,
       });

	var s_points = new THREE.Points( s_geometry, s_material );

	var points = new THREE.Points( geometry, material );
	var interaction_points	

	const linegeometry = new THREE.BufferGeometry()
	const linematerial = new THREE.LineBasicMaterial({
				color: 0xdfdfdf,
				linewidth: .01,
			});

	let c_objs = []
		Object.keys(data.info.top_centrality).forEach(function(c){
			c_objs.push([data.nodes[c][0], data.info.top_centrality[c].b, data.info.top_centrality[c].d, c, data.nodes[c][6]])
		})
		c_objs.sort(function(a,b) {
			return b[1] - a[1]
		})

	let top_100 = -2//c_objs[][1];

	const line = new THREE.LineSegments( linegeometry, linematerial );
	const selpositions = new Float32Array( data.links.length * 3 )


	let sellinegeometry = new THREE.BufferGeometry()
	sellinegeometry.setAttribute('position', new THREE.BufferAttribute( selpositions, 3 ) )
	let sellinematerial = new THREE.LineBasicMaterial({
				color: 0x213FC6 ,
				linewidth: .01,
			});
	let selline = new THREE.LineSegments( sellinegeometry, sellinematerial );

 	var camera, scene, renderer;
	var geometry, material, mesh;
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

	function addPoints(){

		geometry.setAttribute( 'position', new THREE.Float32BufferAttribute(data.nodes.map(function(d){
			var x = xScale(d[[4]])
			var y = yScale(d[5])
			var z = 0//d.l[2] * spreadMult;
			return [x,y,z]
		}).flat(), 3 ));
		geometry.setAttribute( 'color', new THREE.Float32BufferAttribute(data.nodes.map(function(d){
			let thecolor = colorScheme[d[6]]
			if (thecolor == undefined)
				color.setHex(0xd3d3d3)
			else{
				color.setHex("0x" + thecolor.slice(1))
			}
			return [color.r, color.g, color.b]
		}).flat(), 3 ));
		geometry.setIndex( new THREE.BufferAttribute( indices, 1 ) );
		geometry.setAttribute('size', new THREE.Float32BufferAttribute( data.nodes.map(function(d){
			return [popScale(d[2])];
		}).flat(), 1))

		console.log(geometry)
		geometry.computeBoundingSphere();
	    scene.add(points);
	    interaction_points = points;
	    user_idx_dict = indices_dict;

	}

	var filter_idx_dict = {};

	function addPointsSubset(dd){
		s_geometry = new THREE.BufferGeometry();
		s_points = new THREE.Points( s_geometry, s_material );
		let ids = dd[1].idxs;
		let filt_idx = 0;
		let filt_data = data.nodes.filter(function(d, i){
			if(i == ids[filt_idx]){
				filt_idx++;
				return true;
			}
			else{
				return false;
			}
		})	

		let filt_indices = new Uint16Array( filt_data.length )

		ids.forEach(function(d, i){
			filt_indices[i] = i
			filter_idx_dict[i] = d
		})
		console.log(filt_data.length)
		s_geometry.setAttribute( 'position', new THREE.Float32BufferAttribute(filt_data.map(function(d1){
			var x = xScale(d1[[4]])
			var y = yScale(d1[5])
			var z = 0//d.l[2] * spreadMult;
			return [x,y,z];
		}).flat(), 3 ));
		s_geometry.setAttribute( 'color', new THREE.Float32BufferAttribute(filt_data.map(function(d){
			let thecolor = colorScheme[d[6]]
			if (thecolor == undefined)
				color.setHex(0xd3d3d3)
			else{
				color.setHex("0x" + thecolor.slice(1))
			}
			return [color.r, color.g, color.b]
		}).flat(), 3 ));
		s_geometry.setIndex( new THREE.BufferAttribute( filt_indices, 1 ) );
		s_geometry.setAttribute('size', new THREE.Float32BufferAttribute( filt_data.map(function(d){
			return [popScale(d[2])];
		}).flat(), 1))

		s_geometry.computeBoundingSphere();
	    scene.add(s_points);
	    interaction_points = s_points;
	    user_idx_dict = filter_idx_dict
	}
	

 
	function init() {

		indices = new Uint16Array( data.nodes.length );
		var k = 0;
		let max_pop = -1
		let max_score = -1
		let x_extent = [100, -100]
		let y_extent = [100, -100]
		for ( var i = 0; i < data.nodes.length; i ++ ){
			indices[ i ] = i;
			indices_dict[i] = i
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
		scoreScale = d3.scaleLinear().domain([0, max_score]).range([1, 30])
		popScale = d3.scaleLinear().domain([0, max_pop]).range([1, 30])
		xScale = d3.scaleLinear().domain(x_extent).range([-100, 100])
		yScale = d3.scaleLinear().domain(y_extent).range([-70, 70])
		scene = new THREE.Scene();
 		addPoints()
	    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, .1, 2000 );
	  
		camera.position.set(0, 0, 300)
		raycaster = new THREE.Raycaster();
		raycaster.params = {
				Mesh: {},
				Line: {},
				LOD: {},
				Points: { threshold: 1 },
				Sprite: {}
			};

		mouse = new THREE.Vector2();


	    scene.background = new THREE.Color('white');
	    camera.lookAt(scene.position);
	 	


	 	
	let line_points = [];
	let removed_count = 0

	
	data.links.forEach(function(l){
			line_points.push(xScale(data.nodes[l[0]][4]))
			line_points.push(yScale(data.nodes[l[0]][5]))
			line_points.push(-.1)
			line_points.push(xScale(data.nodes[l[1]][4]))
			line_points.push(yScale(data.nodes[l[1]][5]))
			line_points.push(-.1)
	})

	const line_vertices = new Float32Array(line_points)
	
	linegeometry.setAttribute( 'position', new THREE.BufferAttribute(line_vertices, 3))
	scene.add(line);
	scene.add(selline);

	
	 
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( window.innerWidth - 30, window.innerHeight  - 89);
    controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.enableRotate = false

    document.getElementById('vis-div').appendChild( renderer.domElement );
    document.getElementById('vis-div').addEventListener( 'mousemove', onDocumentMouseMove);

}//init


	function createCentralityTable(){
		

		let c_div = d3.select(".centrality-table-div")

		let c_users = c_div.selectAll(".centrality-user")
				.data(c_objs)
				.enter()
				.append("p")
				.text(function(d){
					return d[0] + ", " + formatter(d[1]) + ", " + d[2]
				})
				.style("background-color", function(d){
					return colorScheme[d[4]]
				})
				.on("click", function(d){
					index = d[3];
					console.log(index)
					highlightUser()
				})
	}
	createCentralityTable()


	function onDocumentMouseMove( event ) {
		mouse.x = ((event.clientX )/ window.innerWidth) * 2 - 1;
  		mouse.y = -((event.clientY  - 35) / (window.innerHeight)) * 2 + 1;
  		outermousex = event.clientX;
  		outermousey = event.clientY;
	}

	async function getUserTweet(tweet_i){
		let tweetObj = data.nodes[tweet_i]
		//let user_data = await d3.json("/twitter_network/get_user_tweets?usr=" + tweetObj[0] + "&start_d=" + data.info.start_date + "&end_d=" + data.info.end_date + '&qry=' + data.info.terms)
		//console.log(user_data)
		let user_data = tweetObj[7]
		//d3.select("#user-tweet-count").text(user_data.hits.total)
		d3.select("#user-tweet-count").text(user_data.length)
		d3.select("#user-tweet-selected").text(tweetObj[0])
		let t = d3.select(".clicked-user-table")
		//user_data.hits.hits.forEach(function(tw){
		user_data.forEach(function(tw){
			t.append("p")
			.attr("class", "user-tweet-element")
			.text("Text:" +  tw)
			//.text("Date: " + tw._source.date + " Text: " + tw._source.text + " Retweets: " + tw._source.retweets)
			t.append("hr").attr("class", "user-tweet-element")
		})	
	}

	async function getTweet(tweetObj){

		$('.obj-mouseover').removeClass('hidden')
		let mousedata = { left: outermousex + 5, top: outermousey + 20}
		$('.obj-mouseover').offset(mousedata)
		//let user_data = await d3.json("/twitter_network/get_user_tweets?usr=" + tweetObj[0] + "&start_d=" + data.info.start_date + "&end_d=" + data.info.end_date + '&qry=' + data.info.terms)
		//console.log(user_data)
		$('.obj-mouseover p.name').text("User: " +tweetObj[0])
		$('.obj-mouseover p.count').text("Number of Tweets: " + tweetObj[2])
	}

	$('#user_search').on('change', function(e){
		let user = $('#user_search').val()
		let nodecount = 0
		
		data.nodes.forEach(function(n){
			if(n[0].toLowerCase() == user.toLowerCase()){
				index = user_idx_dict[nodecount];
				console.log(user)
				highlightUser()
				return
			}
			nodecount++;
		})

	})
	$('canvas').on("click", highlightUser)


	function addToLinkTable(the_index){
		d3.select(".links-table-div").append("a")
			.attr("class", "links-element").style("background-color", colorScheme[data.nodes[the_index][6]]).text(data.nodes[the_index][0] + " " + data.nodes[the_index][2])
			.on("click", function(){
				index = user_idx_dict[the_index];
				highlightUser()
			})
		d3.select(".links-table-div").append("hr").attr("class", "links-element")
	}


	function addHashtagstoTable(){
		console.log(data.info.hashtags)
		let tags_limit = 20
		let top_tags = []
		let padding = {top : 10, bottom: 10, left : 50, right: 10}
		let sparkheight = 80
		let tagpadding = 60
		let sparkwidth = tags_limit * tagpadding
		Object.keys(data.info.hashtags).forEach(function(h){
			top_tags.push([h, data.info.hashtags[h]])
		})
		top_tags.sort(function(a,b){
			return b[1].count - a[1].count;
		})
		top_tags = top_tags.slice(0, tags_limit)
		console.log(top_tags)

		let hashtags_svg = d3.select('.hashtags-table-div').append("svg").attr("id", "hashtags-svg").attr("height", 80).attr("width", sparkwidth)

		let hextent = [0, top_tags[0][1].count]
		var i = -1
		let htagsscale = d3.scaleBand().domain(top_tags.map(function(h){ return h[0]})).range([0, sparkwidth - padding.left - padding.right])
		let hheightscale = d3.scaleLinear().domain(hextent).range([sparkheight - (padding.top + padding.bottom), padding.bottom])
		console.log(top_tags)

		hashtags_svg.append("g")
      		.attr("transform", "translate(" + padding.left + "," + (sparkheight  - (padding.top + padding.bottom)) + ")")
      		.attr("class", 'hashtag-x-axis')
      		.call(d3.axisBottom(htagsscale));
      	hashtags_svg.append("g")
	      .attr("transform", "translate(" + padding.left + "," + 0 + ")")
	      .attr("class", 'time-y-axis')
	      .call(d3.axisLeft(hheightscale).ticks(4));

	    let bars_g = hashtags_svg.append("g")
	    	.attr('transform', 'translate(' + padding.left + ',' + 0 + ')')
	    	
	    bars_g.selectAll(".h-bars")
	    	.data(top_tags)
	    	.enter()
	    	.append("rect").attr("class", "h-bars")
	    	.attr("x", function(d){
	    		return htagsscale(d[0])
	    	})
	    	.attr("y", function(d){

	    		return hheightscale(d[1].count)
	    	})
	    	.attr("width", htagsscale.bandwidth() - 15)
	    	.attr("height", function(d){
	    		return (sparkheight - padding.top - padding.bottom) - hheightscale(d[1].count)
	    	})
	    	.on("click", function(d){
	    		highlightTag(d, this)	
	    	})

	}
	addHashtagstoTable()


	let selectedTag = undefined;

	function highlightTag(d, ref_el){
		if(selectedTag == ref_el){
			unhighlightTag(ref_el)
			return;
		}
		if(selectedTag != undefined){
			unhighlightTag(selectedTag);			
		}
		d3.select(ref_el).classed("selected-bar", true)
		d3.select(ref_el).classed("h-bars", false)
		console.log(d)
		material.visible = false
		material.needsUpdate = true
		selectedTag = ref_el
		addPointsSubset(d);
	}


	function unhighlightTag(ref_el){
		d3.select(ref_el).classed("selected-bar", false);
		d3.select(ref_el).classed("h-bars", true)
		material.visible = true;
		material.needsUpdate = true
		selectedTag = undefined
		scene.remove(s_points);
		interaction_points = points;
		user_idx_dict = indices_dict;
	}

	function changeNodeColor(the_index, new_color){
		//console.log(data.nodes[the_index])
		let saved_color = {}
		saved_color.r = interaction_points.geometry.attributes.color.array[the_index * 3]
		saved_color.g = interaction_points.geometry.attributes.color.array[(the_index * 3) + 1]
		saved_color.b = interaction_points.geometry.attributes.color.array[(the_index * 3) + 2]
		interaction_points.geometry.attributes.color.array[the_index * 3] = new_color.r
		interaction_points.geometry.attributes.color.array[(the_index * 3) + 1] = new_color.g
		interaction_points.geometry.attributes.color.array[(the_index * 3) + 2] = new_color.b
		return saved_color
	}

	function unlightUser(the_index){
		line.visible = true
		$('#user_search').val("")
		d3.selectAll('.links-element').remove()
		d3.selectAll(".user-tweet-element").remove()
		d3.select(".centrality-table-div").classed("hidden", false)
		selline.visible = false
		var old_color;
		let click_color = { r : color.r, g : color.g, b: color.b}
		console.log(the_index)
		if(the_index == undefined){
			return
		}
		old_color = colorScheme[data.nodes[the_index][6]]
			if (old_color == undefined)
				color.setHex(0xd3d3d3)
			else{
				color.setHex("0x" + old_color.slice(1))
			}
				click_color = { r : color.r, g : color.g, b: color.b}
		
		changeNodeColor(the_index, click_color)
		data.links.forEach(function(l){
			if(l[0] == the_index){
				old_color = colorScheme[data.nodes[l[1]][6]]
				if (old_color == undefined)
					color.setHex(0xeeeeee)
				else{
					color.setHex("0x" + old_color.slice(1))
				}
				click_color = { r : color.r, g : color.g, b: color.b}
				changeNodeColor(l[1], click_color)
			} 
			if(l[1] == the_index){
				old_color = colorScheme[data.nodes[l[0]][6]]
				if (old_color == undefined)
					color.setHex(0xeeeeee)
				else{
					color.setHex("0x" + old_color.slice(1))
				}
				click_color = { r : color.r, g : color.g, b: color.b}
				changeNodeColor(l[0], click_color)
			}
			
		})
		/*for (var i=0; i <= pos_index; i++){
			selline.geometry.attributes.position.array[pos_index++] = 0
		}
		return*/
	}
	let pos_index = 0

	function lightUser(the_index){
		console.log(data.nodes[the_index])
		let selline_points = [];
		let selected_color = { r : 200, g : 200, b: 8}
		let click_color = { r : 0, g : 0, b: 206}
		line.visible = false
		selline.visible = true
		let linkfound = 0
		let link_index = 0
		pos_index = 0

		changeNodeColor(the_index, click_color)
		data.links.forEach(function(l){
			if(l[0] == the_index){
				changeNodeColor(l[1], click_color)
				selline.geometry.attributes.position.array[pos_index++] = xScale(data.nodes[l[0]][4])
				selline.geometry.attributes.position.array[pos_index++] = yScale(data.nodes[l[0]][5])
				selline.geometry.attributes.position.array[pos_index++] = -.1
				selline.geometry.attributes.position.array[pos_index++] = xScale(data.nodes[l[1]][4])
				selline.geometry.attributes.position.array[pos_index++] = yScale(data.nodes[l[1]][5])
				selline.geometry.attributes.position.array[pos_index++] = -.1
				linkfound += 1
				addToLinkTable(l[1])

			} 
			if(l[1] == the_index){
				changeNodeColor(l[0], click_color)
				selline.geometry.attributes.position.array[pos_index++] = xScale(data.nodes[l[0]][4])
				selline.geometry.attributes.position.array[pos_index++] = yScale(data.nodes[l[0]][5])
				selline.geometry.attributes.position.array[pos_index++] = -.1
				selline.geometry.attributes.position.array[pos_index++] = xScale(data.nodes[l[1]][4])
				selline.geometry.attributes.position.array[pos_index++] = yScale(data.nodes[l[1]][5])
				selline.geometry.attributes.position.array[pos_index++] = -.1
				linkfound += 1
				addToLinkTable(l[0])
			}
			link_index += 1
		})
		d3.select("#link-counts").text(linkfound)
		selline.geometry.computeBoundingBox();
		selline.geometry.computeBoundingSphere();
		selline.geometry.setDrawRange( 0, linkfound * 2);
		selline.geometry.attributes.position.needsUpdate = true;
		points.geometry.attributes.color.needsUpdate = true;
		render()
  		controls.update();
	}
	
	function highlightUser(){
		unlightUser(clicked_index)


		clicked_index = user_idx_dict[index];
		if(index != undefined){
			console.log(clicked_index)
			$('#user_search').val(data.nodes[clicked_index][0])
			console.log($('#user_search').val())
			d3.select(".centrality-table-div").classed("hidden", true)
			lightUser(clicked_index)
			getUserTweet(clicked_index)
		}
		
	}

 	var intersects
 	var thing = 0
	function animate() {
		requestAnimationFrame(animate);
  		render();
  		update();	 
	}//animate

	var index = undefined;
	var clicked_index = undefined;
	var oldr, oldg, oldb;
	var fetchdoc
	var rv_index = undefined;
	function update() {
		raycaster.setFromCamera( mouse, camera );
		var intersects = raycaster.intersectObjects( [ interaction_points ] );
		fetchdoc = false

		if (intersects[0] != undefined){
			//console.log(intersects[0])
			if (user_idx_dict[intersects[0].index] != index){

				interaction_points.geometry.attributes.color.array[index * 3] = oldr
				interaction_points.geometry.attributes.color.array[(index * 3) + 1] = oldg
				interaction_points.geometry.attributes.color.array[(index * 3) + 2] = oldb

				index = intersects[ 0 ].index;
				oldr = interaction_points.geometry.attributes.color.array[index * 3]
				oldg = interaction_points.geometry.attributes.color.array[(index * 3) + 1]
				oldb = interaction_points.geometry.attributes.color.array[(index * 3) + 2]
				interaction_points.geometry.attributes.color.array[index * 3] = 0
				interaction_points.geometry.attributes.color.array[(index * 3) + 1] = 0
				interaction_points.geometry.attributes.color.array[(index * 3) + 2] = 0
				fetchdoc = true
			}
			
		}
		else{
			if (index != undefined){
				if(index != clicked_index){
				interaction_points.geometry.attributes.color.array[index * 3] = oldr
				interaction_points.geometry.attributes.color.array[(index * 3) + 1] = oldg
				interaction_points.geometry.attributes.color.array[(index * 3) + 2] = oldb
				}
			}
			index = undefined
			$('.obj-mouseover').addClass('hidden')

			
		}
		if(fetchdoc){
			getTweet(data.nodes[user_idx_dict[index]]);
			/*
			if(data.data[index].c != -1){
				d3.selectAll('.line').classed("hidden", true)
				d3.select('.line_' + data.data[index].c).classed("hidden", false)
				circle.classed("hidden", false).attr("cx", sparkScaleX(dateParse(data.data[index].d)))

			}*/
		}
		interaction_points.geometry.attributes.color.needsUpdate = true
  		controls.update();


	}//update

	function render() {
  		renderer.render(scene, camera);
	}//render
	
}//wrapper
wrapper()