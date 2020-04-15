from django.utils.datetime_safe import datetime
from elasticsearch import Elasticsearch as ES, RequestsHttpConnection
from requests_aws4auth import AWS4Auth


class ESSearch:
    def __init__(self, connection):
        print(connection)
        aws_auth = AWS4Auth(connection['ACCESS_KEY'], connection['SECRET_KEY'], 'us-east-2', 'es')
        self.es = ES(
            hosts=[{'host': connection['AWS_HOST'], 'port': 443}],
            http_auth=aws_auth,
            use_ssl=True,
            verify_certs=True,
            connection_class=RequestsHttpConnection
        )

    def query(self, keywords, startDateString=None, endDateString=None):
        queries = []
        time_range = {}
        if startDateString:
            startDate = datetime.strptime(startDateString, '%m/%d/%Y')
            print(startDate)
            time_range['gte'] = startDate.strftime('%H-%d-%m-%Y')
        if endDateString:
            endDate = datetime.strptime(endDateString, '%m/%d/%Y')
            time_range['lte'] = endDate.strftime('%H-%d-%m-%Y')
        if time_range:
            queries.append({
                'range': {
                    'date': time_range
                }
            })
        if keywords:
            queries.append({
                "multi_match": {
                    "query": keywords,
                    "fields": ["location", "mentions", "text"]
                }
            })
        print(queries)
        return self.es.search(index='covid_tweets', scroll='1m', doc_type='document',
                              body={'size': 1000, 'query': {'bool': {
                                  'must': queries
                              }}})
