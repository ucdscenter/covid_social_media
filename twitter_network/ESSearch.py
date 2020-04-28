from datetime import datetime
from elasticsearch import Elasticsearch as ES, RequestsHttpConnection
from requests_aws4auth import AWS4Auth


class ESSearch:
    def __init__(self, connection, es_index='covid_tweets'):
        aws_auth = AWS4Auth(connection['ACCESS_KEY'], connection['SECRET_KEY'], 'us-east-2', 'es')
        self.es = ES(
            hosts=[{'host': connection['AWS_HOST'], 'port': 443}],
            http_auth=aws_auth,
            use_ssl=True,
            verify_certs=True,
            connection_class=RequestsHttpConnection
        )
        self.es_index = es_index

    def format_query(self, keywords, startDateString=None, endDateString=None, tweettype=None):
        queries = []
        time_range = {}
        if startDateString:
            startDate = datetime.strptime(startDateString, '%m/%d/%Y')
            time_range['gte'] = startDate.strftime('00-%d-%m-%Y')
        if endDateString:
            endDate = datetime.strptime(endDateString, '%m/%d/%Y')
            time_range['lte'] = endDate.strftime('23-%d-%m-%Y')
        if time_range:
            queries.append({
                'range': {
                    'date': time_range
                }
            })
        if keywords:
            queries.append({
                "query_string": {
                    "query": keywords,
                    "fields" : ["text"],
                    "default_operator" : "or"
                }
            })
        if tweettype:
            queries.append({
                "terms": {
                    "tweet_type" : tweettype,
                }
                })
        print(queries)
        return queries

    def get_doc(self, tweet_id):
        retval = self.es.get(index=self.es_index, id=tweet_id, doc_type='document')
        return retval

    def count(self, keywords, startDateString=None, endDateString=None, tweettype=None):

        queries = self.format_query(keywords, startDateString, endDateString, tweettype)
        retval = self.es.count(index=self.es_index, body={ 'query' : {'bool': {'must' : queries}}})
        return retval

    def query(self, keywords, startDateString=None, endDateString=None, size=None, tweettype=None):
        queries = self.format_query(keywords, startDateString, endDateString, tweettype)
        if size:
            retval = self.es.search(index=self.es_index, scroll='1m', doc_type='document',
                body={'size': size, 'query': {'bool': {'must': queries }}})
            for tw in retval['hits']['hits']:
                yield tw
        else:
            retval = self.es.search(index=self.es_index, scroll='1m', doc_type='document',
                body={'size': 1000, 'query': {'bool': {'must': queries }}})
            total = retval["hits"]["total"]
            print(total)
            sid = retval['_scroll_id']
            scroll_size = len(retval['hits']['hits'])
            while scroll_size > 0:
                print("Scrolling...")
                for tw in retval['hits']['hits']:
                    yield tw
                if not size:
                    retval = self.es.scroll(scroll_id=sid, scroll='1m')
                    sid = retval['_scroll_id']
                    scroll_size = len(retval['hits']['hits'])
            self.es.clear_scroll(scroll_id=sid)

if __name__ == "__main__":
    from test_credentials import AWS_PROFILE
    e = ESSearch(AWS_PROFILE)
    count=0
    future_of_work_string="employee employees employed employing employ jobless job jobs work working works worked unemployable unemployed wfh"
    test_string = '"self care"'
    
    print(e.count(test_string, tweettype=["original", "quote", "reply"]))
    #for doc in e.query(test_string, tweettype=["original"]):
    #    print(doc["_source"])
    #    count+=1
    print(count)
