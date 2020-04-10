from django.test import TestCase
from django.utils import timezone
import datetime

from .models import TwitterNetwork

from django.urls import reverse


# Create your tests here.


def create_network():
    return True


class TwitterNetworkTest(TestCase):

    def network_was_created(self):
        self.assertIs(False, False)
