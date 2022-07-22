from twitter_network.TweetNetworkCreator import TweetNetworkRunner
from twitter_network.ESSearch import ESSearch
from socialmedia_networks.credentials import AWS_PROFILE
import json
import igraph
import os




"""notes
01/01/2020-08/01/2020
vaccine--vaccine--691,928
stigma--27,723
social distance--social AND distance--107,681
hand washing-- (hand AND wash) OR (hands AND wash)--182,617
facemask --facemask OR "face mask"-- 156,460

"""

def test_network_runner(the_request=None, keywords_to_search='', dump_es_rslts=False):
	print("starting")
	dates = ['01/20/2020', '08/01/2020']
	keywords_wfile = keywords_to_search.replace(" ", "_").replace('"', '')
	if os.path.exists(keywords_wfile + "_search_result.json"):
		dd = json.load(open(keywords_wfile + "_search_result.json", "r"))
	else:
		dd=None

	if dump_es_rslts:
		for x in t.tweetsIter():
			dd.append(x)
		json.dump(dd, open(keywords_wfile + "_search_result.json", "w"))
		return

	tweetstype = ["original", "quote", "reply"]
	t = TweetNetworkRunner(aws_credentials=AWS_PROFILE, tweettype=None, startdate=dates[0], enddate=dates[1], search_terms=keywords_to_search, test=dd, size=100000000,)
	dd = t.create_network_data(wfile=keywords_wfile + "fastgreedy_network_result.json",  plot_graph=False)
	


if __name__ == '__main__':

	blevins_keywords = ["trump", "dewine", "cdc", "andrew cuomo", "greg abbot", "fox news", "nytimes", "realDonaldTrump", "Govmikedewine", "mikedewine", "cdcgov", "nygovcuomo", "greg abbott", "govabbott", "foxnews", "nytimes", "new york times"]


	new_blevins_keywords = 'slate nytimes cnn msnbc npr buzzfeed huffpost washingtonpost politico bloomberg theeconomist'
	#new_blevins_keywords = 'wallstreetjournal wsj foxnews drudge breitbart limbaugh theblaze seanhannity glennbeck oann newsmax ingraham nypost'
	#new_blevins_keywords = "newyorker slate nytimes dailyshow theguardian aljazeera cnn npr buzzfeed pbs bbc huffpost washingtonpost wapo theeconomist politico msnbc cnn nbc bloomberg cbs wsj wallstreetjournal abc foxnews drudge breitbart limbaugh theblaze hannity glennbeck oann newsmax"

	keywords_list = [ 'vaccine',]

	for kwords in keywords_list:
		print(kwords)
		test_network_runner(keywords_to_search=kwords, dump_es_rslts=False)
