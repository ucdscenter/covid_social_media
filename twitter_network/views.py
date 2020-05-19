from django.shortcuts import render, redirect
from django.template import loader
from django.http import HttpResponse
from elasticsearch import Elasticsearch


from socialmedia_networks.credentials import AWS_PROFILE
from .ESSearch import ESSearch
from .models import TwitterNetwork
import json


def index(request):
    template = 'twitter_network/index.html'
    context = {}
    return render(request, template, context)


def show_all_networks(request):
    template = 'twitter_network/show_all_networks.html'
    all_networks = TwitterNetwork.objects.order_by('-pub_date')
    context = {'networks': all_networks}
    return render(request, template, context)


def show_twitter_network(request):
    template = 'twitter_network/show_twitter_network.html'
    identifier = request.GET.get('identifier')
    pregenerated = ['']
    context = {'info': identifier}
    return render(request, template, context)


def show_ner(request):
	template = 'twitter_network/named_entity_vis.html'
	identifier = request.GET.get('identifier')
	pregenerated = ['']
	context = {'info': identifier}
	return render(request, template, context)


def show_webgl(request):
    template = 'twitter_network/webgl_vis.html'
    identifier = request.GET.get('identifier')
    pregenerated = ['']
    context = {'info': identifier}
    return render(request, template, context)

def webgl_timeline(request):
    template = 'twitter_network/webgl_timeline.html'
    identifier = request.GET.get('identifier')
    pregenerated = ['']
    context = {'info': identifier}
    return render(request, template, context)

def get_query_count(request):
    keywords_to_search = request.GET.get('keywords_to_search')
    date_range = request.GET.get('daterange')
    dates = date_range.split(' - ')
    e = ESSearch(AWS_PROFILE)
    count_data = e.count(keywords_to_search, tweettype=["original", "quote", "reply"], startDateString=dates[0], endDateString=dates[1])
    print(count_data["count"])
    ret_obj = {"count" : count_data["count"]}

    return HttpResponse(json.dumps(ret_obj), content_type='application/json')

def create_network(request):
    from .TweetD2vCreator import TweetModelRunner
    
    network_name = request.POST.get('network_name')
    keywords_to_search = request.POST.get('keywords_to_search')
    date_range = request.POST.get('daterange')

    dates = date_range.split(' - ')
    t = TweetModelRunner(aws_credentials=AWS_PROFILE, tweettype=["original", "quote", "reply"], startdate=dates[0], enddate=dates[1], search_terms=keywords_to_search)
    t.doc2vec()
    t.jsonclusterd2vModel(wfile=network_name +"_data.json", write_s3=True)
    

    template = 'twitter_network/create_network_confirm.html'
    context = {}
    print(network_name)
    print(keywords_to_search)
    network = TwitterNetwork(display_name=network_name, search_terms=keywords_to_search, network_status="complete")
    network.save()

    return render(request, template, context)

def get_network_json(request):
    from .s3_client import S3Client
    S3_BUCKET = "socialmedia-models"
    s3 = S3Client(AWS_PROFILE, S3_BUCKET)
    fp = request.GET.get('model_json')
    data_str = s3.read_fileobj(fp).read()
    
    return HttpResponse(data_str, content_type='application/json')

def get_tweet(request):
    myEs = ESSearch(AWS_PROFILE)
    try:
        tweet_obj = myEs.get_doc(request.GET.get('tweet_id'))
        ret_obj  ={
            "user" : tweet_obj["_source"]["user_name"],
            "text" : tweet_obj["_source"]["text"],
            "retweets" : tweet_obj["_source"]["retweets"],
            "date" : tweet_obj["_source"]["date"]
        }
    except:
        ret_obj  ={
            "user" : "ERROR",
            "text" : "ELASTICSEARCH OVERLOADED",
            "retweets" : "-1",
            "date" : "-1"
        }
    return HttpResponse(json.dumps(ret_obj), content_type='application/json')

def twitter_network_form(request):
    template = 'twitter_network/twitter_network_form.html'
    context = {}
    return render(request, template, context)
