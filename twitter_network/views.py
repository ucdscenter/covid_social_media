from django.shortcuts import render, redirect
from django.template import loader
from django.http import HttpResponse
from .models import TwitterNetwork


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


def create_network(request):
    network_name = request.POST.get('network_name')
    keywords_to_search = request.POST.get('keywords_to_search')
    template = 'twitter_network/create_network_confirm.html'
    context = {}
    print(network_name)
    print(keywords_to_search)
    network = TwitterNetwork(display_name=network_name, search_terms=keywords_to_search, network_status="started")
    network.save()

    return render(request, template, context)


def twitter_network_form(request):
    template = 'twitter_network/twitter_network_form.html'
    context = {}
    return render(request, template, context)
