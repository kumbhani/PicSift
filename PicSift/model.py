from   AestheticsHelper import GetFeatures
from   PicSift import app

import os
from   threading import Lock
import numpy as np
from   collections import defaultdict
import pickle
from   PIL import Image
from   sklearn.cross_validation import train_test_split
from   sklearn.preprocessing import MinMaxScaler
from   sklearn.preprocessing import StandardScaler
from   sklearn.linear_model import LogisticRegression
import time
# load regression
#lr = pickle.load(open("logres.p","rb"))
lr = pickle.load(open("logres_20150208.p","rb"))
#print lr
#stdsc = pickle.load(open("stdsc.p","rb"))

def classify_image(image):
    #print image.filename
    #
    # Classifies the image using logistic regression
    # Returns the classification and image_url
    #

    image_path = image.filename
    image_data = np.array(Image.open(image.stream))
    try:
        t = time.time()
        features = GetFeatures(image_data)
        print "Took %.2f s to process" % (time.time() - t)
        features["LapVar_Hue"]        = np.log(features["LapVar_Hue"])
        features["LapVar_Saturation"] = np.log(features["LapVar_Saturation"])
        features["LapVar_Value"]      = np.log(features["LapVar_Value"])
    except:
        classification = -2
        return {"classification": classification,"image_url": image_path}

    if np.any([np.isnan(features[k]) for k in features.keys()]):
        classification = -1
        return {"classification": classification,"image_url": image_path}
    else:
        features.pop("isGray",None)
        X = [features[k] for k in sorted(features.keys())]
        #print X
        #inputfeatures = stdsc.transform(X)
        inputfeatures = X
        #print inputfeatures
        classification       = lr.predict(inputfeatures)[0]
        classification_score = lr.predict_proba(inputfeatures)[0][1]
        #print classification
        return {"classification": classification,                
                "classification_score": classification_score,
                "feature_keys": sorted(features.keys()),
                "feature_vals": inputfeatures,
                "image_url": image_path}


