'use strict'

async function wrapper() {
	$('input[name="daterange"]').daterangepicker({
	  opens: 'left'
	}, function(start, end, label) {
	  console.log("A new date selection was made: " + start.format('YYYY-MM-DD') + ' to ' + end.format('YYYY-MM-DD'));
	});

	async function queryClick(){
		let dates = $('#dates').val()
		let keywords = $('#keywords').val()
		let resp = await d3.json('/twitter_network/get_query_count?keywords_to_search=' + keywords + '&daterange=' + dates)
		console.log(resp)
		$('#query_count').text(resp.count)
	}
	$('#query_btn').click(queryClick)


}
wrapper()