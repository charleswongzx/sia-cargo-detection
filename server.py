from flask import Flask
from flask import request
import subprocess
import requests

app = Flask(__name__)

@app.route('/')
def hello_world():
    return 'hello world'

@app.route('/upload', methods=['POST'])
def upload():
    compute(request)


def compute(request):
    print(request.args.get('string','')) #get data from post request here
    int = subprocess.call(["ls", "-l"]) # call cpp exec here
    return str(int)

payload = {
    "id": 1,
    "name": "item",
    "width": 50,
    "height": 20,
    "depth": 30,
    "weight": 20,
    "rotatable": 'true',
    "fragile": 'false',
    "stackable": 'true'
}

def post_dimensions(payload):
    r = requests.post(' https://svfjld11of.execute-api.ap-southeast-1.amazonaws.com/prod/cargo-management', params = payload)

post_dimensions(payload)