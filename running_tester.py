from twitter_network.TweetNetworkCreator import TweetNetworkRunner
from twitter_network.ESSearch import ESSearch
from socialmedia_networks.credentials import AWS_PROFILE
import json
import igraph


DUMP = False


def test_network_runner(the_request=None):

	dates = ['01/01/2020', '02/01/2020']
	keywords_to_search = 'trump'
	dd = json.load(open("test_rslt.json", "r"))
	tweetstype = ["original", "quote", "reply"]

	t = TweetNetworkRunner(aws_credentials=AWS_PROFILE, tweettype=None, startdate=dates[0], enddate=dates[1], search_terms=keywords_to_search, test=None)

	dd = t.create_network_data(dump=DUMP, wfile= keywords_to_search + "_network_result.json")

	if DUMP:
		json.dump(dd, open("test_interactions_network_result.json", "w"))
	return


if __name__ == '__main__':
	test_network_runner()
