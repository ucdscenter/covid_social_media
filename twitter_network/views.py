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

def create_network(request):
    network_name = request.POST.get('network_name')
    keywords_to_search = request.POST.get('keywords_to_search')
    date_range = request.POST.get('daterange')

    print(date_range)
    myES = ESSearch(AWS_PROFILE)

    if date_range != '':
        dates = date_range.split(' - ')
        data = myES.query(keywords_to_search, dates[0], dates[1])
    else:
        data = myES.query(keywords_to_search);

    print(data)
    template = 'twitter_network/create_network_confirm.html'
    context = {}
    print(network_name)
    print(keywords_to_search)
    network = TwitterNetwork(display_name=network_name, search_terms=keywords_to_search, network_status="started")
    network.save()

    return render(request, template, context)

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
