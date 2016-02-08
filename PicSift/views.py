import PicSift
from PicSift import app, model
import model
from flask import Flask, redirect, url_for, render_template, request, make_response, jsonify
import json
import os
import os.path
import numpy as np

def valid_filename(filename):
    #
    # Return if a file is valid based on extension
    #
    valid_ext = [".jpg", ".png", ".gif", ".jpeg"]
    return os.path.splitext(filename)[-1].lower() in valid_ext

def json_error(message):
    response = jsonify(message=message)
    response.status_code = 500
    return response

@app.route("/")
@app.route("/index.html")
@app.route("/index")
def front_page():
    #
    # Render front page template
    #
    return render_template('index.html', title="PicSift.net")

# @app.route('/robots.txt')
# @app.route('/sitemap.xml')
# def static_from_root():
#     return send_from_directory(app.static_folder, request.path[1:])

@app.route("/examples")
def example_page():
    #
    # Render examples template
    #
    return render_template('examples.html', title="PicSift.net")

@app.route('/classify', methods=['POST'])
def classify():
    #
    # Accept user-provided image upload and classify
    #
    image = request.files['file']
    print image.filename
    if image and valid_filename(image.filename):
        try:
            image_response = model.classify_image(image)
        except IOError:
            print "model failed"
            return json_error("Invalid image file or bad upload")
        return make_response(json.dumps(image_response))
    else:
        print "invalid image"
        return json_error("Invalid image file")


@app.route("/slides")
def slides():
    """ Render slides page """
    return render_template("slides.html", title="PicSift.net")
