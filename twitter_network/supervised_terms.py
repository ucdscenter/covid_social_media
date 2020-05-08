
from ESSearch import ESSearch
import TweetD2vCreator as t
from test_credentials import AWS_PROFILE

econ_model = {
	"main_terms" : 'work employment job career',
	"bucket_terms" : [
	'"work from home" "remote work" "flexible work"',
	'"job disruption" "reduced hours" "loss of hours" "fewer hours"',
	'"loss of income" "cant pay bills" "cannot pay bills" "pay my bills" "unable to pay bills"',
	'"back to work" "return to work"',
	'unemployment furloughed "laid off"',
	'"employer closed"',
	'bankruptcy "employer bankruptcy" "personal bankruptcy" bankrupt',
	'"new ways" "new process" "change how"'
	],
	"bucket_terms_arrs" : [
		["work from home", "remote work", "flexible work"],
		["job disruption" ,"reduced hours" ,"loss of hours" ,"fewer hours"],
		["loss of income" ,"cant pay bills" ,"cannot pay bills","pay my bills" ,"unable to pay bills"],
		["back to work", "return to work"],
		["unemployment", "furloughed", "laid off"],
		["employer closed"],
		["bankruptcy","employer bankruptcy", "personal bankruptcy", "bankrupt"],
		["new ways", "new process", "change how"]
	]
}
"""
"new reality" normalcy "back to normal" future "future normal" "new normal" "return to work" "opening up"
[{'query_string': {'query': 'work employment job career', 'fields': ['text'], 'default_operator': 'or'}}, {'terms': {'tweet_type': ['original', 'quote', 'reply']}}]
637293
"work from home" "remote work" "flexible work"
[{'query_string': {'query': '"work from home" "remote work" "flexible work"', 'fields': ['text'], 'default_operator': 'or'}}, {'terms': {'tweet_type': ['original', 'quote', 'reply']}}]
29540
"job disruption" "reduced hours" "loss of hours" "fewer hours"
[{'query_string': {'query': '"job disruption" "reduced hours" "loss of hours" "fewer hours"', 'fields': ['text'], 'default_operator': 'or'}}, {'terms': {'tweet_type': ['original', 'quote', 'reply']}}]
484
"loss of income" "cant pay bills" "cannot pay bills" "pay my bills" "unable to pay bills"
[{'query_string': {'query': '"loss of income" "cant pay bills" "cannot pay bills" "pay my bills" "unable to pay bills"', 'fields': ['text'], 'default_operator': 'or'}}, {'terms': {'tweet_type': ['original', 'quote', 'reply']}}]
1314
"back to work" "return to work"
[{'query_string': {'query': '"back to work" "return to work"', 'fields': ['text'], 'default_operator': 'or'}}, {'terms': {'tweet_type': ['original', 'quote', 'reply']}}]
30898
unemployment furloughed "laid off"
[{'query_string': {'query': 'unemployment furloughed "laid off"', 'fields': ['text'], 'default_operator': 'or'}}, {'terms': {'tweet_type': ['original', 'quote', 'reply']}}]
47217
"employer closed"
[{'query_string': {'query': '"employer closed"', 'fields': ['text'], 'default_operator': 'or'}}, {'terms': {'tweet_type': ['original', 'quote', 'reply']}}]
10
bankruptcy "employer bankruptcy" "personal bankruptcy" bankrupt
[{'query_string': {'query': 'bankruptcy "employer bankruptcy" "personal bankruptcy" bankrupt', 'fields': ['text'], 'default_operator': 'or'}}, {'terms': {'tweet_type': ['original', 'quote', 'reply']}}]
12764
"new ways" "new process" "change how"
[{'query_string': {'query': '"new ways" "new process" "change how"', 'fields': ['text'], 'default_operator': 'or'}}, {'terms': {'tweet_type': ['original', 'quote', 'reply']}}]
3987


"""

normal_model = {
	"main_terms" : '"new reality" normalcy "back to normal" future "future normal" "new normal" "return to work" "opening up"',
	"bucket_terms" : [
	'open reopen',
	'"testing requirements" "employee testing" "employer testing" "population testing" "patron testing"',
	'tests "antibody testing" "serological testing" "number of tests" serology "herd immunity"',
	'screening "employee screening" "employer screening" "patron screening"',
	'"social distancing" "reduce contact" "social distance"',
	'"end social distancing" "stop social distancing"',
	'protocols "federal requirements" "state requirements" "local requirements" "return to work" "state guidance" "local guidance"',
	'economy "stock market" "bull market" "bear market"',
	'"stay at home" "shelter in place"',
	'sanitization "cleaning procedures"',
	'"new requirements" "new precautions"',
	'"flatten the curve" "number of deaths" "death toll" "number of infections" "number of cases"'
	],
	"bucket_terms_arrs" : [
		["open", "reopen"],
		["testing requirements","employee testing","employer testing","population testing","patron testing"],
		["tests" ,"antibody testing", "serological testing", "number of tests", "serology", "herd immunity"],
		["screening", "employee screening", "employer screening", "patron screening"],
		["social distancing", "reduce contact", "social distance"],
		["end social distancing", "stop social distancing"],
		["protocols", "federal requirements", "state requirements", "local requirements","return to work", "state guidance", "local guidance"],
		["economy", "stock market", "bull market", "bear market"],
		["stay at home", "shelter in place"],
		["sanitization", "cleaning procedures"],
		["new requirements", "new precautions"],
		["flatten the curve", "number of deaths", "death toll", "number of infections", "number of cases"]
	]
}


"""
"new reality" normalcy "back to normal" future "future normal" "new normal" "return to work" "opening up"
[{'query_string': {'query': '"new reality" normalcy "back to normal" future "future normal" "new normal" "return to work" "opening up"', 'fields': ['text'], 'default_operator': 'or'}}, {'terms': {'tweet_type': ['original', 'quote', 'reply']}}]
123981
open reopen
[{'query_string': {'query': 'open reopen', 'fields': ['text'], 'default_operator': 'or'}}, {'terms': {'tweet_type': ['original', 'quote', 'reply']}}]
219244
"testing requirements" "employee testing" "employer testing" "population testing" "patron testing"
[{'query_string': {'query': '"testing requirements" "employee testing" "employer testing" "population testing" "patron testing"', 'fields': ['text'], 'default_operator': 'or'}}, {'terms': {'tweet_type': ['original', 'quote', 'reply']}}]
371
tests "antibody testing" "serological testing" "number of tests" serology "herd immunity"
[{'query_string': {'query': 'tests "antibody testing" "serological testing" "number of tests" serology "herd immunity"', 'fields': ['text'], 'default_operator': 'or'}}, {'terms': {'tweet_type': ['original', 'quote', 'reply']}}]
219211
screening "employee screening" "employer screening" "patron screening"
[{'query_string': {'query': 'screening "employee screening" "employer screening" "patron screening"', 'fields': ['text'], 'default_operator': 'or'}}, {'terms': {'tweet_type': ['original', 'quote', 'reply']}}]
34586
"social distancing" "reduce contact" "social distance"
[{'query_string': {'query': '"social distancing" "reduce contact" "social distance"', 'fields': ['text'], 'default_operator': 'or'}}, {'terms': {'tweet_type': ['original', 'quote', 'reply']}}]
438853
"end social distancing" "stop social distancing"
[{'query_string': {'query': '"end social distancing" "stop social distancing"', 'fields': ['text'], 'default_operator': 'or'}}, {'terms': {'tweet_type': ['original', 'quote', 'reply']}}]
1224
protocols "federal requirements" "state requirements" "local requirements" "return to work" "state guidance" "local guidance"
[{'query_string': {'query': 'protocols "federal requirements" "state requirements" "local requirements" "return to work" "state guidance" "local guidance"', 'fields': ['text'], 'default_operator': 'or'}}, {'terms': {'tweet_type': ['original', 'quote', 'reply']}}]
18732
economy "stock market" "bull market" "bear market"
[{'query_string': {'query': 'economy "stock market" "bull market" "bear market"', 'fields': ['text'], 'default_operator': 'or'}}, {'terms': {'tweet_type': ['original', 'quote', 'reply']}}]
265879
"stay at home" "shelter in place"
[{'query_string': {'query': '"stay at home" "shelter in place"', 'fields': ['text'], 'default_operator': 'or'}}, {'terms': {'tweet_type': ['original', 'quote', 'reply']}}]
227239
sanitization "cleaning procedures"
[{'query_string': {'query': 'sanitization "cleaning procedures"', 'fields': ['text'], 'default_operator': 'or'}}, {'terms': {'tweet_type': ['original', 'quote', 'reply']}}]
2046
"new requirements" "new precautions"
[{'query_string': {'query': '"new requirements" "new precautions"', 'fields': ['text'], 'default_operator': 'or'}}, {'terms': {'tweet_type': ['original', 'quote', 'reply']}}]
178
"flatten the curve" "number of deaths" "death toll" "number of infections" "number of cases"
[{'query_string': {'query': '"flatten the curve" "number of deaths" "death toll" "number of infections" "number of cases"', 'fields': ['text'], 'default_operator': 'or'}}, {'terms': {'tweet_type': ['original', 'quote', 'reply']}}]
181807

"""


if __name__ == "__main__":
	
	"""e = ESSearch(AWS_PROFILE)
	print(econ_model["main_terms"])
	print(e.count(econ_model["main_terms"], tweettype=["original", "quote", "reply"])["count"])

	for s in econ_model["bucket_terms_arrs"]:
		print(s)
		print(e.count(s, tweettype=["original", "quote", "reply"])["count"])
	"""
	"""
	tmr = t.TweetModelRunner(aws_credentials=AWS_PROFILE, tweettype=["original", "quote", "reply"], startdate="04/01/2020", enddate="04/30/2020", search_terms=econ_model["main_terms"])
	tmr.doc2vec(cluster_buckets=econ_model["bucket_terms_arrs"])
	tmr.jsonclusterd2vModel(wfile="static/twitter_network/data/econ_model_test_data.json", cluster_buckets=econ_model["bucket_terms_arrs"])


	tmr = t.TweetModelRunner(aws_credentials=AWS_PROFILE, tweettype=["original", "quote", "reply"], startdate="04/01/2020", enddate="04/30/2020", search_terms=normal_model["main_terms"])
	tmr.doc2vec(cluster_buckets=normal_model["bucket_terms_arrs"])
	"""
	tmr = t.TweetModelRunner(aws_credentials=AWS_PROFILE, tweettype=["original", "quote", "reply"], startdate="04/01/2020", enddate="04/30/2020", search_terms=econ_model["main_terms"])
	tmr.loadd2vModel()
	tmr.jsonclusterd2vModel(wfile="static/twitter_network/data/econ_model_test_data.json", cluster_buckets=econ_model["bucket_terms_arrs"])
	"""tmr = t.TweetModelRunner(aws_credentials=AWS_PROFILE, tweettype=["original", "quote", "reply"], startdate="04/01/2020", enddate="04/30/2020", search_terms=normal_model["main_terms"])
	tmr.loadd2vModel()
	tmr.jsonclusterd2vModel(wfile="static/twitter_network/data/normal_model_test_data.json", cluster_buckets=normal_model["bucket_terms_arrs"])"""
	

