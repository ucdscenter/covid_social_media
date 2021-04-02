from pprint import pprint
import nltk
from gensim.utils import tokenize
from gensim.models import FastText
from gensim.test.utils import get_tmpfile
from gensim.models import Word2Vec
from .ESSearch import ESSearch
from .s3_client import S3Client
import preprocessor as p
from .tweet_utils import load_dict_contractions

from gensim.models.doc2vec import Doc2Vec, TaggedDocument
from langdetect import detect
import re
from nltk.corpus import stopwords
import string
import igraph
import json

class TweetNetworkRunner:
	def __init__(self, startdate=None, enddate=None, tweettype=None, search_terms=None, remove_search_terms=True, size=None, aws_credentials=None, test=None):
		self.creds = aws_credentials
		self.e = ESSearch(aws_credentials)
		self.startdate = startdate
		self.enddate =enddate
		self.tweettype = tweettype
		self.processed_count = 0
		self.total_count = 0
		self.fasttextModel = None 
		self.d2vmodel = None
		self.search_terms=search_terms
		self.size=size
		self.count = 0
		self.users_count = 0
		self.query_info = None
		self.test = test
		self.hashtags = dict()
		self.es_count = 0

		self.verteces_dict = {}
		self.graph = igraph.Graph()
		
	def tweetsIter(self):
		if self.test != None:
			for x in self.test:
				yield x
		else:
			for tw in self.e.sizequery(self.search_terms, tweettype=self.tweettype, startDateString=self.startdate, endDateString=self.enddate, size=self.size):
				yield tw

	def remove_isolates(self):
		return

	def create_network_data(self, wfile=None, dump=None, plot_graph=True, write_local=True, write_s3=False):
		stored_thing = []

		self.query_info =self.e.count(self.search_terms, tweettype=self.tweettype, startDateString=self.startdate, endDateString=self.enddate, user=True)
		print(self.query_info)
		attribs_list = ['username', 'size']
		
		#self.graph.add_vertices(self.query_info['aggregations']['users_count']['value'])

		#creating all the nodes
		for tw in self.tweetsIter():
			#print(tw)
			if dump == True:
				stored_thing.append(tw)
			t = tw['_source']
			for h in t['hashtags']:
				if h in self.hashtags:
					self.hashtags[h] += 1
				else:
					self.hashtags[h] = 1

			if t['user_name'] not in self.verteces_dict:
				self.verteces_dict[t['user_name']] = {
					'u' : t['user_name'],
					'p' : t['retweets'] + t['favorites'],
					'c' : 1, 
					'i' : self.users_count
				}
				
				self.users_count += 1
			else:
				self.verteces_dict[t['user_name']]['p'] = self.verteces_dict[t['user_name']]['p'] + t['retweets'] + t['favorites']
				self.verteces_dict[t['user_name']]['c'] = self.verteces_dict[t['user_name']]['c'] + 1
			self.count += 1


		self.graph.add_vertices(self.users_count)
		self.graph.vs['user_name'] = list(self.verteces_dict.keys())
		print("creating links")
		#creating links
		for tw in self.tweetsIter():
			t = tw['_source']
			if t['user_name'] in self.verteces_dict and t['parent_tweet_user'] in self.verteces_dict:
				source_i = self.verteces_dict[t['user_name']]['i']
				target_i = self.verteces_dict[t['parent_tweet_user']]['i']
				if source_i != target_i:
					if self.graph.are_connected(source_i, target_i) == False:
						self.graph.add_edges([(source_i, target_i)])

		delete_ids = [v.index for v in self.graph.vs if v.degree() < 2]
		highest_degree_ids = []
		print(self.graph.vcount())
		self.graph.delete_vertices(delete_ids)

		delete_ids = [v.index for v in self.graph.vs if v.degree() < 1]
		self.graph.delete_vertices(delete_ids)
		print("number retained nodes post link filtering")
		print(self.graph.vcount())
		
		self.graph = self.graph.clusters(mode='weak').giant()
		print("number retained nodes post giant filtering")
		print(self.graph.vcount())
		#c1 = self.graph.community_walktrap()
		c1 = self.graph.community_fastgreedy()
		n_clusters = 0
		#if c1.optimal_count < 10:
		#	n_clusters = c1.optimal_count
		#else:
		n_clusters = 10
		print("number clusters")
		print(n_clusters)
		c1 = c1.as_clustering(n=n_clusters)

		betweenness = self.graph.betweenness()
		degree = self.graph.vs.degree()
		betweenness_sorted = sorted(range(len(betweenness)), key=lambda x: betweenness[x], reverse=True)
		degree_sorted = sorted(range(len(degree)), key=lambda x: degree[x], reverse=True)
		cluster_sizes = c1.sizes()
		#print(c1.membership)
		
		top_c_indexes = sorted(range(len(cluster_sizes)), key=lambda x: cluster_sizes[x])
		top_c_indexes = top_c_indexes[-10:]
		if len(betweenness_sorted) > 500:
			betweenness_sorted = betweenness_sorted[0: 500]
			degree_sorted = degree_sorted[0: 500]
		
		centrality_obj = {}

		for v in betweenness_sorted:
			if v not in centrality_obj:
				centrality_obj[v] = {
					'b' : betweenness[v],
					'd' : -1
				}
		for v in degree_sorted:
			if v not in centrality_obj:
				centrality_obj[v] = {
					'b' : -1,
					'd' : degree[v]
				}
			else:
				centrality_obj[v]['d'] = degree[v]
		if(self.graph.vcount()) < 10000:
			layout = self.graph.layout('drl')
		else:
			layout = self.graph.layout_drl(options="coarsest")
		for i, l in enumerate(layout):
			user_name = self.graph.vs[i]['user_name']
			x = round(l[0], 3)
			y = round(l[1], 3)
			#print(user_name, x, y)
			self.verteces_dict[user_name]['x'] = x
			self.verteces_dict[user_name]['y'] = y
			#self.verteces_dict[user_name]['cc'] = top_c_indexes.index(c1.membership[i]) if c1.membership[i] in top_c_indexes else -1
			self.verteces_dict[user_name]['cc'] = c1.membership[i]
			self.verteces_dict[user_name]['i'] = i

	
		if plot_graph:
			igraph.plot(self.graph, layout = layout, vertex_size=5, edge_width=1)
		if dump:
			return stored_thing
		json_d = {"nodes" : [], 
				"links" : [], 
				"info": {
					"model_name" : wfile,
					"terms" : self.search_terms,
					"start_date" : self.startdate,
					"end_date" : self.enddate,
					"timelines" : [],
					"hashtags" : self.hashtags,
					"top_centrality" :  centrality_obj,
					"query_info" : self.query_info

		}}
		def user_to_list(user_dict):
			return [user_dict['u'], user_dict['p'], user_dict['c'], user_dict['i'], user_dict['x'],
			user_dict['y'], user_dict['cc']]
		for vertex in self.graph.vs:
			user = vertex["user_name"]
			json_d["nodes"].append(user_to_list(self.verteces_dict[user]))

		for e in self.graph.es:
			json_d["links"].append([e.tuple[0], e.tuple[1]])

		if write_local:
				pre = "twitter_network/static/twitter_network/data/"
				json_f = open(pre + wfile, "w")
				json.dump(json_d, json_f)
		if write_s3:
			S3_BUCKET = "socialmedia-models"
			s3 = S3Client(self.creds, S3_BUCKET)
			s3.upload_str(json.dumps(json_d), wfile)

		return

