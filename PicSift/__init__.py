from flask import Flask
app = Flask(__name__, instance_relative_config=True)
from PicSift import views
from PicSift import model
