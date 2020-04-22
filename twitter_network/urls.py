from django.urls import path

from . import views

app_name = 'twitter_network'

urlpatterns = [
    path('', views.index, name='index'),
    path('twitter_network_form', views.twitter_network_form),
    path('show_all_networks', views.show_all_networks),
    path('create_network', views.create_network),
    path('show_network', views.show_twitter_network),
    path('show_ner', views.show_ner),
   	path('show_webgl', views.show_webgl),
   	path('get_tweet', views.get_tweet)
]

