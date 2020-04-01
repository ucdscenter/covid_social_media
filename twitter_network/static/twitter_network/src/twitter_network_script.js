'use strict'



function reformatDate(datestr){

	let thing = datestr.split('-')
	if (thing[0].length == 1){
		thing[0] = "0" + thing[0]
	}
	if (thing[1].length == 1){
		thing[1] = "0" + thing[1]
	}
	let hourthing = thing[2].split(" ")
	if (hourthing[1].length == 1){
		hourthing[1] = "0" + hourthing[1]
	}
	let formatstr = thing[0]+"-"+thing[1]+'-'+hourthing[0]+" "+hourthing[1];
	return formatstr
}

 d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
  };

  d3.selection.prototype.moveToBack = function() {  
        return this.each(function() { 
            var firstChild = this.parentNode.firstChild; 
            if (firstChild) { 
                this.parentNode.insertBefore(this, firstChild); 
            } 
        });
    };


async function doData(network_data, dateparser, identifier){
	let searchTerms = {

  }

	let totalTime = {
	}
	let timeExt = [new Date(),new Date()]
	timeExt[0].setFullYear(2200)
	timeExt[1].setFullYear(1900)
	let timeCountExt = [10000000000000, -1]

	let nodeExt = d3.extent(network_data.nodes, function(d){
		return d.count;
	})

	
	let nodeScale = d3.scaleLinear().domain(nodeExt).range([10, 100])

	let topTweets = []
	let topNtweets = 25
	network_data.nodes.forEach(function(d){
		d.id = d.name.replace(/ /g, "_")
		if (d.nodetype == "searchword"){
			searchTerms[d.name] = d;
      d.topLinks = []
			totalTime[d.name] = d.timeline
			d.timeline.forEach(function(t){
				t.date = dateparser(reformatDate(t.date))
				if(t.count < timeCountExt[0]){
					timeCountExt[0] = t.count
				}
				if(t.count > timeCountExt[1]){
					timeCountExt[1] = t.count
				}

				if (t.date.getTime() < timeExt[0].getTime()){
					timeExt[0] = t.date
				}
				if (t.date.getTime() > timeExt[1].getTime()){
					timeExt[1] = t.date
				}
			})
			d.top_posts.forEach(function(p){
				if (topTweets.length < topNtweets){
					topTweets.push(p)
				}
				topTweets.sort(function(a, b){
					return b.popularity - a.popularity;
				})
				topTweets = topTweets.slice(0, topNtweets)
			})

		}
	})

  //let topNLinks = Math.ceil((network_data.nodes.length - Object.keys(searchTerms).length)/ Object.keys(searchTerms).length);
  let topNLinks = 20;
  if (identifier == 'Blevins'){
    topNLinks = 1000
  }
  console.log(topNLinks)

  network_data.links.forEach(function(d){
    if (searchTerms[d.source] != undefined && searchTerms[d.target] != undefined){
      //return true
      var sNode
      sNode = searchTerms[d.target]
      if (sNode.topLinks.length < topNLinks){
          sNode.topLinks.push(d)
        }
        sNode.topLinks.sort(function(a, b){
          return b.count - a.count;
        })
      sNode.topLinks = sNode.topLinks.slice(0, topNtweets)

      sNode = searchTerms[d.source]
      if (sNode.topLinks.length < topNLinks){
          sNode.topLinks.push(d)
        }
        sNode.topLinks.sort(function(a, b){
          return b.count - a.count;
        })
      sNode.topLinks = sNode.topLinks.slice(0, topNtweets)

    }
    else{
    var sNode
    if(searchTerms[d.source] == undefined){
      sNode=searchTerms[d.target]
    }
    else{
      sNode=searchTerms[d.source]
    }
    if (sNode.topLinks.length < topNLinks){
          sNode.topLinks.push(d)
        }
        sNode.topLinks.sort(function(a, b){
          return b.count - a.count;
        })
    sNode.topLinks = sNode.topLinks.slice(0, topNtweets)
  }
  })
	

  network_data.links = network_data.links.filter(function(d){
    /*if(d.count < 25){
      return false
    }
    return true*/
    if (searchTerms[d.source] != undefined && searchTerms[d.target] != undefined){
      //return true
      var sNode
      sNode=searchTerms[d.target]
      let inThere = false
      sNode.topLinks.forEach(function(l){
        if (l.name == d.name){
          inThere = true
        }
      })
      sNode = searchTerms[d.source]
      sNode.topLinks.forEach(function(l){
        if (l.name == d.name){
          inThere = true
        }
      })
      return inThere
    }
    var sNode
    if(searchTerms[d.source] == undefined){
      sNode=searchTerms[d.target]
    }
    else{
      sNode=searchTerms[d.source]
    }
    let inThere = false
    sNode.topLinks.forEach(function(l){
      if (l.name == d.name){
        inThere = true
      }
    })
   return inThere
	})

  let linkExt = d3.extent(network_data.links, function(d){
    return d.count;
  })

  let linkScale = d3.scaleLinear().domain(linkExt).range([10, 150])




	network_data.links.forEach(function(d){
		d.source = d.source.replace(/ /g, "_")
		d.target = d.target.replace(/ /g, "_")
	})
	let retObj = {
		"data" : network_data,
		"nodeExt" : nodeExt,
		"linkExt" : linkExt,
		"nodeScale" : nodeScale,
		"linkScale" : linkScale,
		"totalTime" : totalTime,
		"searchTerms" : searchTerms,
		"timeExt" : timeExt,
		"timeCountExt" : timeCountExt,
		"topTweets" : topTweets


	}
	return retObj
}

function fixna(x) {
    if (isFinite(x)) return x;
    return 0;
}


async function wrapper(){

let identifier = d3.select("#identifier").text()

let fname = identifier + "_network_data.json"

let dateParse = d3.timeParse("%m-%d-%Y %H")
let dateFormat = d3.timeFormat("%m-%d-%Y %H")

console.log(fname)

$('.loading-message').text("Loading data...")
let data = await d3.json("/static/twitter_network/data/" + fname)
console.log(data)
$('.loading-message').text("Formatting data...")
let dataObj = await doData(data, dateParse, identifier)

$('.loading-message').text("Rendering data...")

console.log(dataObj)
data = dataObj.data
const width = window.innerWidth
const height = window.innerHeight
const time_graph_height = 125
const time_graph_width = width * .75
const network_width = width * .75
const network_height = (height * .9) - time_graph_height


const table_div_height = height * .9
const padding = {
	top : 10,
	bottom : 10,
	left : 50,
	right : 10
}

let searchnodecolor = "purple"
let formatter  = d3.format(".3s")  
let transform = d3.zoomIdentity;

//DO INFO STUFF
d3.select("#found-count").text(formatter(data.total_found) + " tweets found")
//END DO INFO STUFF

//ALL THE TIME STUFF
let time_svg = d3.select("#timeline-div").append("svg").attr("id", "timeline_svg")
	.attr("height", time_graph_height)
	.attr("width", time_graph_width)

let x = d3.scaleTime().range([0, time_graph_width - (padding.left + padding.right)]).domain(dataObj.timeExt)

var y = d3.scaleLinear().range([padding.bottom, time_graph_height - (padding.top + padding.bottom)]).domain([dataObj.timeCountExt[1], 0])

let line = d3.line()
      .x(function(d) { return x(d.date); })
      .y(function(d) { return y(d.count); })
      .curve(d3.curveMonotoneX);


time_svg.append("g")
      .attr("transform", "translate(" + padding.left + "," + (time_graph_height  - (padding.top + padding.bottom)) + ")")
      .attr("class", 'time-x-axis')
      .call(d3.axisBottom(x));
time_svg.append("g")
      .attr("transform", "translate(" + padding.left + "," + 0 + ")")
      .attr("class", 'time-y-axis')
      .call(d3.axisLeft(y).ticks(4));

let lineg = time_svg.append("g").attr('transform', 'translate(' + padding.left + ',' + 0 + ')')

function addToLineG(lineData, linelabel, color){
	let sorted = lineData.sort(function(a,b){
        return a.date.getTime() - b.date.getTime()
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

Object.keys(dataObj.totalTime).forEach(function(d){
	addToLineG(dataObj.totalTime[d], d, searchnodecolor)
})




//END ALL THE TIME STUFF

//ALL THE TABLE STUFF
d3.select('#table-div').style("height", table_div_height)
function renderTweetTable(topTweetData, label="", color="white"){
	if(label == ""){
		d3.select('#tweet-table-label').text("Top tweets in Network")
	}
	else{
		d3.select('#tweet-table-label').text("Top tweets containing " + label)
	}

	d3.select(".tweet-table")
    	.select("tbody")
    	.selectAll("tr").remove()


    
    let dtbody = d3.select(".tweet-table")
                  .select("tbody")
  	let dtrows = dtbody.selectAll("tr").data(topTweetData).enter().append("tr")

  	let dtd = dtrows.selectAll("td").data(function(d,i){
        let tweettextobj = { "text" : d.full_text}
    		return [d.popularity, d.a_user, d.date, tweettextobj]
  	}).enter()
  	.append("td").text(function(d){
      if (typeof(d) == 'object'){
        return d.text;
        d3.select(this).style("font-size", 5)
      }
      return d;
  	})

  	d3.selectAll("tr").style("border-top", "2.5px solid "  + color)
}

renderTweetTable(dataObj.topTweets, "", searchnodecolor);
//
//ALL THE NETWORK STUFF
let network_svg = d3.select("#network-div")
					.append("svg")
					.attr("id", 'network_svg')
					.attr("width", network_width)
					.attr("height", network_height)

const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links).id(d => d.id.replace(/ /g, "_"))
        .distance((d) => 1/d.count)//dataObj.linkScale(d.count) )
        .strength((d)=> 1/d.count)
      )
      .force("charge", d3.forceManyBody()
        .strength(-1000)
      )
       .force('center', d3.forceCenter(network_width / 2, network_height / 2))
      .force("x", d3.forceX())
      .force("y", d3.forceY());


const zoomRect = network_svg.append("rect")
    .attr("width", network_width)
    .attr("height", network_height)
    .style("fill", "none")
    .style("pointer-events", "all")


const linkg = network_svg.append("g")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.05)

const link = linkg
    .selectAll("line")
    .data(data.links)
    .enter().append("line")
      .attr("stroke-width", function(d){
      	return dataObj.linkScale(d.count)
      })
      .attr("class", function(d){
        return "link_" + d.source.name.replace(/ /g, "_") + " link_" + d.target.name.replace(/ /g, "_")
      })
      .on("mouseover", function(d){
        d3.select(this).attr("stroke-opacity", 1)
      })
      .on("mouseout", function(d){
        d3.select(this).attr("stroke-opacity", .05)
      })
      .on("click", function(d){
        renderTweetTable(d.top_posts, d.name.replace(":", " and "), searchnodecolor)
      })

link.append("svg:title").text(function(d){
        return d.name.replace(":", " and ") + ": " + d.count;
      })

const node = network_svg.append("g")
    .attr("id", 'nodes_outer_g')
    .selectAll("g")
    .data(data.nodes)
    .enter().append("g")
    	.attr("class", 'node_g')
    	.attr("id", function(d){
    		return "id_" + d.id
    }).on("mouseover", function(d){
    	d3.selectAll(".line").style("stroke-opacity", .05)
    	if (d.nodetype == "searchword"){
    		d3.select(".line_" + d.name).style("stroke-opacity", 1).style("stroke-width", 2.5)
    	}
    	else{
    		if(d.timeline.length > 0 && typeof(d.timeline[0].date) == 'string'){
    			d.timeline.forEach(function(t){
    				t.date = dateParse(reformatDate(t.date));
    		})
    		}
    		addToLineG(d.timeline, d.name, "black")
    		d3.select(".line_" + d.name).style("stroke-opacity", 1).style("stroke-width", 2.5)
    	}
    	d3.select(this).select("circle")
          .style("stroke-width", 5)
    	d3.select(this).select("text")
          .style("font-size", 50)
    	highlightEdges(d.id)
    	d3.select(this).moveToFront()
    	
    })
    .on("mouseout", function(d){
    	d3.selectAll(".line").style("stroke-opacity", .5)
    	if (d.nodetype == "searchword"){
    		d3.select(".line_" + d.name).style("stroke-width", 1)
    	}
    	else{
    		d3.select(".line_" + d.name).remove()
    	}
    	d3.select(this).select("text").style("font-size", function(d){
    		return Math.max(20, dataObj.nodeScale(d.count))
    	})
    	d3.select(this).select("circle").style("stroke-width", 1.5)
    	$('.deselected_node').removeClass('deselected_node')
  		$('.selected_edge').removeClass('selected_edge')
  		d3.select(this).moveToBack()
    })
    .on("click", function(d){
    	if (d.nodetype == "searchword"){
    		renderTweetTable(d.top_posts, d.name, searchnodecolor)
    	}
    	else{
    		renderTweetTable(d.top_posts, d.name, "white")
    	}
    })

node.append("circle")
  	.attr("r", function(d){
 		return dataObj.nodeScale(d.count)
  	})
  	.attr("stroke", "black")
    .attr("stroke-width", 1.5)
    .attr("fill", function(d){
    	//console.log(d)
    	if (d.nodetype == "searchword"){
    		return searchnodecolor
    	}
    	return "white"
    });

node.append("text")
    .style("stroke", "white")
    .style("stroke-width", '.5px')
    .style("font-size", function(d){
    	return Math.max(20, .5 * dataObj.nodeScale(d.count))
    })
    .style("font-weight", "bold")
    .text(function(d){
    	return d.name + ": " + formatter(d.count)
    })
    .attr("pointer-events", "")
    .style("cursor", "pointer")


const zoom = d3.zoom()
      .scaleExtent([.05, 200])
      .on("zoom", zoomed);

zoomRect.on("click", function(){
    renderTweetTable(dataObj.topTweets, "", searchnodecolor)
  	//$('.deselected_node').removeClass('deselected_node')
  	//$('.selected_edge').removeClass('selected_edge')
  }
  )
zoomRect.call(zoom)
    .call(zoom.scaleTo, .3);

function zoomed() {

    transform = d3.event.transform;
    d3.select('#nodes_outer_g').attr("transform", d3.event.transform);
    link.attr("transform", d3.event.transform);
  }


function highlightEdges(id){
  $('.selected_edge').removeClass('selected_edge')
  $('.node_g').addClass("deselected_node")
  $('#' + "id_" + id).removeClass("deselected_node")
  link.attr("class", function(d){
    if(d.target.id == id){
      $('#' + "id_" + d.source.id).removeClass("deselected_node")
      return 'selected_edge'
    }
    else if(d.source.id == id){
      $('#' + "id_" + d.target.id).removeClass("deselected_node")

      return 'selected_edge'
    }
    else{
      return ''
    }
  })

}


let tickcount = 0
let maxticks = 50
simulation.on("tick", () => {
  	$('.loading-message').text("Generating network locations " + d3.format('.0%')((tickcount / maxticks)))
  	tickcount += 1
    link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

    node.attr("transform", function(d) {
        return "translate(" + fixna(d.x) + "," + fixna(d.y) + ")";
    });
    if (tickcount >= maxticks){
    	simulation.stop()
    	$('.loading-message').text("Finishing up")
    	 $('#loading-div').addClass("hidden")
		$('#vis-div').removeClass("hidden")
		$('#table-div').removeClass("hidden")

  	
    	
    }
  });
//END ALL THE NETWORK STUFF

}//wrapper()

wrapper()