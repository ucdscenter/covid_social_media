'use strict'


async function wrapper(){

	let width = window.innerWidth;
	let height = window.innerHeight;
	let fname = d3.select("#identifier").text()
	console.log(fname)


	d3.select("#loading-div").classed("hidden", true)
	d3.select("#vis-div").classed("hidden", false)


}

wrapper();