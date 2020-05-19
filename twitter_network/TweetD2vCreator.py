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
"""
document': {
			'properties': {
				'tweet_id': {'type': 'keyword', 'store' : True},
				'user_id': {'type': 'keyword'},
				'user_name':{'type': 'text'},
				'followers' : {'type' : 'integer'},
				'text': {'type': 'text'},
				'date': {'type': 'date', 
						'format' : 'HH-dd-MM-yyyy'},
				'hashtags': {'type': 'text'},
				'mentions' : {'type' : 'text'},
				'parent_tweet_id' : {'type' : 'keyword'},
				'parent_tweet_user' : { 'type' : 'keyword'},
				'tweet_type' : {'type' : 'keyword'},
				'location' : {'type' : 'text'},
				'retweets' : { 'type' : 'integer'},
				'favorites' : { 'type' : 'integer'}
			}
"""

CONTRACTIONS = load_dict_contractions()


class TweetModelRunner:
	def __init__(self, startdate=None, enddate=None, tweettype=None, search_terms=None, remove_search_terms=True, size=None, aws_credentials=None):
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
		self.stopwords = set(stopwords.words('english'))
		additional_stops = ['rt', 'de', 'que', 'en', 'la', 'por', 'un', 'se', 'el', '...', 'amp', "coronavirus", "covid", "19", '&amp']
		for stop in additional_stops:
			self.stopwords.add(stop)
		if remove_search_terms is True and search_terms is not None:
			for term in self.search_terms.lower().translate(str.maketrans('', '', string.punctuation)).split():
				self.stopwords.add(term)
		p.set_options(p.OPT.URL, p.OPT.EMOJI, p.OPT.SMILEY, p.OPT.MENTION)


	def _removeNonAscii(self, s): 
		return "".join(i for i in s if ord(i)<128)

	def _remove_stops(self, word_text):
		filtered_text = [w for w in word_text if not w in self.stopwords] 
		return filtered_text

	def _clean_text(self, the_tweet_text):
		cleaned_text = p.clean(the_tweet_text).lower().replace("’","'")
		words = cleaned_text.split()
		reformed = [CONTRACTIONS[word] if word in CONTRACTIONS else word for word in words]
		cleaned_text = " ".join(reformed)
		cleaned_text = cleaned_text.translate(str.maketrans('', '', string.punctuation))
		cleaned_text = self._removeNonAscii(cleaned_text)
		tokenized_text = list(tokenize(cleaned_text))
		tokenized_text = self._remove_stops(tokenized_text)

		return tokenized_text

	def tweetsIter(self, d2v=False):
		for tw in self.e.query(self.search_terms, tweettype=self.tweettype, startDateString=self.startdate, endDateString=self.enddate, size=self.size):
			tokenized_text = self._clean_text(tw["_source"]["text"])
			if len(tokenized_text) > 3:
				if d2v:
					yield TaggedDocument(tokenized_text, [str(tw["_source"]["tweet_id"]) + "&" + tw["_source"]["date"] + "&" + str(tw["_source"]["retweets"])])
				else:
					yield tokenized_text
			else:
				continue
	def fastText(self):
		self.total_count = self.e.count(self.search_terms, tweettype=self.tweettype, startDateString=self.startdate, endDateString=self.enddate)
		print("TOTAL TWEETS MATCHING:" + str(self.total_count))
		self.fasttextModel = FastText(size=4, window=3, min_count=1)
		self.fasttextModel.build_vocab(sentences=self.tweetsIter(search_terms=search_terms))
		total_examples = self.fasttextModel.corpus_count
		self.fasttextModel.train(sentences=self.tweetsIter(search_terms=search_terms), total_examples=total_examples, epochs=5)
		sstring = self.search_terms + self.startdate.replace('/', '-')
		fname = open('twitter_models/' + sstring + "fasttext.model", "wb")
		self.fasttextModel.save(fname)

	def loadFTModel(self, fileName):
		self.fasttextModel = FastText.load(fileName)

	def most_sims_FT(self, word):
		print(self.fasttextModel.wv.similar_by_word(word))

	def doc2vec(self, search_terms=None, save_model=True):
		from gensim.test.utils import common_texts
		print(self.tweettype)
		self.total_count = self.e.count(self.search_terms, tweettype=self.tweettype, startDateString=self.startdate, endDateString=self.enddate)
		print("TOTAL TWEETS MATCHING:" + str(self.total_count))
		self.d2vmodel = Doc2Vec(vector_size=100, window=10, min_count=1, workers=4, epochs=20)
		self.d2vmodel.build_vocab(self.tweetsIter(d2v=True))
		self.d2vmodel.train(self.tweetsIter(d2v=True), total_examples=self.d2vmodel.corpus_count, epochs=self.d2vmodel.epochs)
		sstring = self.search_terms + self.startdate.replace('/', '-') if self.startdate is not None else self.search_terms
		sstring = sstring.replace('"', '*')
		fname = open('twitter_network/twitter_created_models/' + sstring + "d2v.model", "wb")
		print(self.d2vmodel)
		if save_model:
			self.d2vmodel.save(fname)

	def loadd2vModel(self):
		lstring = self.search_terms + self.startdate.replace('/', '-') if self.startdate is not None else self.search_terms
		lstring = sstring = sstring.replace('"', '*')
		fstring = 'twitter_network/twitter_created_models/' + lstring + "d2v.model"
		self.d2vmodel = Doc2Vec.load(fstring)
		print(self.d2vmodel.corpus_count)

	def jsonclusterd2vModel(self, wfile=None, write_s3=True, write_local=False):
		from sklearn.cluster import AffinityPropagation
		from sklearn.cluster import KMeans
		from sklearn.cluster import MiniBatchKMeans
		from sklearn.preprocessing import StandardScaler
		from sklearn.decomposition import PCA
		import numpy
		import json
		import umap
		from collections import Counter
		import random
		if self.d2vmodel is None:
			raise ValueError("Please Initialize d2vmodel!")
		num_clusters = 1
		kmeans_model = KMeans(n_clusters=num_clusters, init='k-means++', max_iter=250)
		self.d2vmodel.init_sims(replace=True)
		X = kmeans_model.fit(self.d2vmodel.docvecs.doctag_syn0)
		labels=kmeans_model.labels_.tolist()
		l = kmeans_model.fit_predict(self.d2vmodel.docvecs.doctag_syn0)
		
		pca = PCA(n_components=2).fit(self.d2vmodel.docvecs.doctag_syn0)
		datapoint = pca.transform(self.d2vmodel.docvecs.doctag_syn0)

		if wfile:
			json_d = {"data" : [], "centroids" : [], "timeline" : [], "search_terms" : self.search_terms}
			centroid_labels = []
			centroids = kmeans_model.cluster_centers_

			for x in range(datapoint.shape[0]):
				json_d["data"].append({
					"c" : labels[x],
					"id" : self.d2vmodel.docvecs.index_to_doctag(x).split('&')[0],
					"l" : datapoint[x].tolist(),
					"d" : self.d2vmodel.docvecs.index_to_doctag(x).split('&')[1],
					"p" : self.d2vmodel.docvecs.index_to_doctag(x).split('&')[2],
				})

			for cluster in range(num_clusters):
				thing = list(filter(lambda x: x["c"] == cluster, json_d["data"]))
				centroide = (sum(map(lambda x: x["l"][0], thing))/ len(thing),sum(map(lambda x: x["l"][1], thing))/ len(thing))
				wcounter= Counter()
				sample_n = 100 if len(thing) > 100 else len(thing)

				for choice in range(sample_n):
					if sample_n < 100:
						tweetobj = thing[choice]
					else:
					 	tweetobj = (random.choice(thing))
					cleaned_text = self._clean_text((self.e.get_doc(tweetobj["id"].split('&')[0])["_source"]["text"]))
					wcounter.update(cleaned_text)
				centroid_labels.append(",".join(map(lambda x: x[0], wcounter.most_common(5))))
				json_d["centroids"].append([centroide, centroid_labels[cluster]])
			print(centroid_labels)
			if write_local:
				pre = "twitter_network/static/twitter_network/data/"
				json_f = open(pre + wfile, "w")
				json.dump(json_d, json_f)
			if write_s3:
				S3_BUCKET = "socialmedia-models"
				s3 = S3Client(self.creds, S3_BUCKET)
				s3.upload_str(json.dumps(json_d), wfile)


if __name__ == "__main__":
	from test_credentials import AWS_PROFILE
	import supervised_terms
	#test_string="employee employees employed employing employ jobless job jobs work working works worked unemployable unemployed wfh"
	test_string = "emp"
	t = TweetModelRunner(aws_credentials=AWS_PROFILE, tweettype=["original", "quote", "reply"], startdate="01/01/2020", enddate="04/30/2020", search_terms=test_string)
	#t.loadd2vModel()
	t.doc2vec()
	t.jsonclusterd2vModel(wfile="twitter_network/static/twitter_network/data/emp_test_data.json")
	
	

	


