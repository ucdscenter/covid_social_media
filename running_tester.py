from twitter_network.TweetNetworkCreator import TweetNetworkRunner
from twitter_network.ESSearch import ESSearch
from socialmedia_networks.credentials import AWS_PROFILE
import json
import igraph


DUMP = False


def test_network_runner(the_request=None):

	dates = ['01/20/2020', '03/21/2020']
	keywords_to_search = ""
	dd = json.load(open("_network_result.json", "r"))
	tweetstype = ["original", "quote", "reply"]

	t = TweetNetworkRunner(aws_credentials=AWS_PROFILE, tweettype=None, startdate=dates[0], enddate=dates[1], search_terms=keywords_to_search, test=dd, size=10000)
	dd = t.create_network_data(wfile=keywords_to_search + "fastgreedy_network_result.json")
	dd = []
	if DUMP:
		for x in t.tweetsIter():
			dd.append(x)
		json.dump(dd, open(keywords_to_search + "_network_result.json", "w"))
	return


if __name__ == '__main__':

	blevins_keywords = ["trump", "dewine", "cdc", "andrew cuomo", "greg abbot", "fox news", "nytimes", "realDonaldTrump", "Govmikedewine", "mikedewine", "cdcgov", "nygovcuomo", "greg abbott", "govabbott", "foxnews", "nytimes", "new york times"]


	new_blevins_keywords = 'slate nytimes cnn msnbc npr buzzfeed huffpost washingtonpost politico bloomberg theeconomist'
	#new_blevins_keywords = 'wallstreetjournal wsj foxnews drudge breitbart limbaugh theblaze seanhannity glennbeck oann newsmax ingraham nypost'
	#new_blevins_keywords = "newyorker slate nytimes dailyshow theguardian aljazeera cnn npr buzzfeed pbs bbc huffpost washingtonpost wapo theeconomist politico msnbc cnn nbc bloomberg cbs wsj wallstreetjournal abc foxnews drudge breitbart limbaugh theblaze hannity glennbeck oann newsmax"
	test_network_runner()
