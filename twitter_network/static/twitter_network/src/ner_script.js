'use strict'


function doData(origData){
	console.log(origData)


	Object.keys(origData).forEach(function(d){
		if (origData[d].length < 0){
			delete origData[d];
		}
	})

	let objNumExt = d3.extent(Object.keys(origData), function(d){
		return origData[d].length;
	})

	return {
		"data" : origData,
		"objNumExt" : objNumExt
	}
}

function getClassName(text){
	return text.replace(/ /g, "_").replace(/'/g, "_")
}



function renderNerGraph(dataObj, width, height, padding){

	 $('.obj-mouseover').off()
	d3.select('#org-vis-div').style("width", width - 100)
	let barWidth = 18
	let barPad = 2
	let svg_width = Object.keys(dataObj.data).length * (barWidth + barPad) + padding.left + padding.right
	let ner_svg = d3.select('#org-vis-div')
					.append("svg")
					.attr("id", "org-vis")
					.attr("height", height)
					.attr('width', svg_width)
					

	let xIndex = 0
	let xRange = Object.keys(dataObj.data).map(function(d){
		xIndex++;
		return xIndex * barWidth;
	})
	console.log(xRange)

	let sortedKeys = Object.keys(dataObj.data).sort(function(a,b){
		return dataObj.data[b].length - dataObj.data[a].length
	})

	let xScale = d3.scaleOrdinal().domain(sortedKeys).range(xRange)

	let yScale = d3.scaleLinear().domain(dataObj.objNumExt).range([ height - (padding.top + padding.bottom), 0])

	let y = ner_svg.append("g").attr("transform", "translate(" +  padding.left +"," + padding.top + ")").attr("class", "y-axis-obj").call(d3.axisLeft(yScale).ticks(6));
	let x = ner_svg.append("g").attr("transform", "translate(" +  padding.left +"," + (height - padding.bottom) +")").attr("class", "x-axis-obj").call(d3.axisBottom(xScale));
	let xlabels = x.selectAll("text").attr("class", function(d){
		return getClassName(d)
	})
	.attr("text-anchor", "start").attr("transform", "rotate(30)")

	let barsg = ner_svg.append("g").attr("tranform", "translate(" +  padding.left +"," + height - padding.bottom +")")

	//let subbarsg = 

	let ibars = barsg.selectAll(".i_obj_rect").data(Object.keys(dataObj.data)).enter().append("rect")
		.attr("x", function(d){
			return  padding.left + xScale(d) - 4
		})
		.attr("y", padding.top)
		.attr("height", function(d){
			return height - (padding.top + padding.bottom)
		})
		.attr("class", function(d){
			return "i_obj_rect " + getClassName(d)
		})
		.attr("width", 8)
		.on("mouseover", function(d){
			$('.obj-mouseover').removeClass('hidden')
			let mouseloc = d3.mouse(document.getElementById('vis-div'))
			let data = { left: mouseloc[0] + 5, top: mouseloc[1] + 48}
			$('.obj-mouseover').offset(data)
			$('.obj-mouseover p.name').text(d)
			$('.obj-mouseover p.count').text(dataObj.data[d].length)
        })
        .on("mouseout", function(d){
			$('.obj-mouseover').addClass('hidden')
        })
        .on("click", function(d){
        	console.log(d)
        	if (selectedOrgs[d] == undefined){
        		renderObjTable(d, dataObj)
        		d3.select(this).style("stroke", "blue")
        		d3.select(this).style("opacity", .6)
        		//d3.select()
        		selectedOrgs[d] = 1
        	}
        	else{
        		d3.select("#t" + getClassName(d)).remove()
        		d3.select(this).style("stroke", "none")
        		d3.select(this).style("opacity", .1)
        		delete selectedOrgs[d]
        	}
        	
        })

    let selectedOrgs = {}
	let bars = barsg.selectAll(".obj_rect").data(Object.keys(dataObj.data)).enter().append("rect")
		.attr("x", function(d){
			return  padding.left + xScale(d) - 2
		})
		.attr("y", function(d){
		 return padding.top +  yScale(dataObj.data[d].length)
		})
		.attr("height", function(d){
			return (height - (padding.top + padding.bottom)) - yScale(dataObj.data[d].length)
		})
		.attr("class", function(d){
			return getClassName(d)
		})
		.attr("width", 4)
}

function renderObjTable(d, dataObj){
	let objTweets = dataObj.data[d].sort(function(a, b){
		return b.p - a.p
	})
	console.log(objTweets)
	let height = 200;


	let tablediv = d3.select("#tables-row")
		.append("div")
		.attr("class", "col-12")
		.attr("id", "t" + getClassName(d))
		.style("border-style", "solid")
		.style("border-radius", "3px")
		.style("border-color", "steelblue")
		.style("overflow-y", "auto")
		.style("margin-bottom", "1rem")
	
	tablediv.append("h5").text(d + ": " + dataObj.data[d].length + " tweets")

	let innertableDiv = tablediv.append("div")
						.attr("class", "row")
						.append("div").attr("class", "col-12")
						.style("height", height)
						.style("overflow-y", "auto")
	let tweetTable = innertableDiv
		.append("table")
		.attr("class", "table")

	let theadr = tweetTable.append("thead")
		.append("tr")
		
	theadr.append("td").text("Popularity")
	theadr.append("td").text("User")
	theadr.append("td").text("Text")
	theadr.append("td").text("Date")
	let tb =  tweetTable.append("tbody")
	let trows = tb.selectAll("tr")
		.data(objTweets)
		.enter()
		.append("tr")

	let dtd = trows.selectAll("td").data(function(d,i){
    	return [d.p, d.user, d.text, d.date,]
  	}).enter()
  	.append("td").text(function(d){
      return d;
  	})



}




async function wrapper(){

	let width = window.innerWidth;
	let height = window.innerHeight;
	let fname = d3.select("#identifier").text()
	console.log(fname)

	let data = await d3.json("/static/twitter_network/data/" + fname + "_ner.json")
	let dataObj = doData(data)
	console.log(dataObj)
	d3.select("#loading-div").classed("hidden", true)
	d3.select("#vis-div").classed("hidden", false)

	let padding = {left : 50, right: 25, top: 25, bottom: 150}

	renderNerGraph(dataObj, width - 30, 350, padding)

}

wrapper();