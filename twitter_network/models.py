from django.db import models

# Create your models here.


class TwitterNetwork(models.Model):
	search_terms = models.CharField(max_length=5000, default='')
	display_name = models.CharField(max_length=100, default='name')
	min_occurrence = models.IntegerField(default=10)
	network_status = models.CharField(max_length=150, default='started')
	pub_date = models.DateTimeField(auto_now=True)
