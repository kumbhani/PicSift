import numpy as np
import cv
import cv2
import pycircstat.descriptive as circstat
import emd
import pySaliencyMap
import pywt
import BlurDetection
#import matplotlib.pyplot as plt
from PIL import Image

def remove_border(in_img):
    img_g = in_img
    if len(in_img.shape)>2:
        img_g = cv2.cvtColor(in_img,cv.CV_RGB2GRAY)
    goodndx_row = np.where(np.var(img_g,axis=1)>2)[0]
    goodndx_col = np.where(np.var(img_g,axis=0)>10)[0]
    if len(in_img.shape)>2:
        img2 = in_img[goodndx_row,:,:]
        return img2[:,goodndx_col,:]
    else:
        img2 = in_img[goodndx_row,:]
        return img2[:,goodndx_col]


#def GetFeatures(input_img_name):
def GetFeatures(input_img):
    #input_img_name = "../images/10045.jpg"
    features = {}

    I_rgb_in = input_img#cv2.imread(input_img_name)[:,:,::-1]
    scaler = np.min([800.0/I_rgb_in.shape[0], 800.0/I_rgb_in.shape[1]])
    I_rgb = cv2.resize(I_rgb_in,(np.int(scaler*I_rgb_in.shape[1]),np.int(scaler*I_rgb_in.shape[0])),interpolation=cv.CV_INTER_AREA)
    print I_rgb_in.shape,"->",I_rgb.shape
    #assert isinstance(I_rgb, np.ndarray), "Filename %s is not valid" % input_img_name

    I_rgb = remove_border(I_rgb)
    I_hsv = cv2.cvtColor(I_rgb,cv.CV_RGB2HSV)
    I_h = I_hsv[:,:,0]
    I_h_rad = I_h.flatten()*np.pi/180.0
    I_s = I_hsv[:,:,1]
    features['isGray'] = np.all(I_s==0)
    I_v = I_hsv[:,:,2]
    I_g = cv2.cvtColor(I_rgb,cv.CV_RGB2GRAY)

    nrows = I_rgb.shape[0]
    ncols = I_rgb.shape[1]

    rows1thrd = np.int(np.floor(nrows*1.0/3.0))
    rows2thrd = np.int(np.floor(nrows*2.0/3.0))
    cols1thrd = np.int(np.floor(ncols*1.0/3.0))
    cols2thrd = np.int(np.floor(ncols*2.0/3.0))

    rows1thrd_o = np.int(rows1thrd - np.floor(nrows/20.0))
    rows2thrd_o = np.int(rows2thrd + np.floor(nrows/20.0))
    cols1thrd_o = np.int(cols1thrd - np.floor(ncols/20.0))
    cols2thrd_o = np.int(cols2thrd + np.floor(ncols/20.0))

    rows1thrd_i = np.int(rows1thrd + np.floor(nrows/20.0))
    rows2thrd_i = np.int(rows2thrd - np.floor(nrows/20.0))
    cols1thrd_i = np.int(cols1thrd + np.floor(ncols/20.0))
    cols2thrd_i = np.int(cols2thrd - np.floor(ncols/20.0))

    I_zRoT = np.zeros_like(I_g)
    I_zRoT[rows1thrd_o:rows2thrd_o,cols1thrd_o:cols2thrd_o] = 1
    I_zRoT[rows1thrd_i:rows2thrd_i,cols1thrd_i:cols2thrd_i] = 0

    sm = pySaliencyMap.pySaliencyMap(ncols, nrows)
    saliencymap = sm.SMGetSM(I_rgb)
    features['Salience_mu']    = np.mean(saliencymap)     # 0-1
    features['Salience_med']   = np.median(saliencymap)   # 0-1
    features['Salience_var']   = np.var(saliencymap)      # 0-1

    features['SubjLighting_Hue']        = np.log(circstat.mean(I_h[saliencymap>=0.2]*np.pi/180.0)/circstat.mean(I_h*np.pi/180.0))
    features['SubjLighting_Saturation'] = np.log(np.mean(I_s[saliencymap>=0.2])/np.mean(I_s))
    features['SubjLighting_Value']      = np.log(np.mean(I_v[saliencymap>=0.2])/np.mean(I_v))

    features['Blurriness']     = BlurDetection.blur_detector(I_rgb)[1]
    features['ComplementaryColorIndex'] = np.abs(np.exp(2*I_h_rad*1j).sum() / len(I_h_rad))

    # dutta f4
    features['Hue_mu']         = circstat.mean(I_h_rad)*180.0/np.pi           
    features['Hue_var']        = circstat.var(I_h_rad)*180.0/np.pi

    # dutta f3
    features['Saturation_mu']  = np.mean(I_s)/255.0                           
    features['Saturation_var'] = np.var(I_s/255.0)

    # dutta f1
    features['Value_mu']       = np.mean(I_v)/255.0                           
    features['Value_var']      = np.var(I_v/255.0)

    # dutta f2
    features['Colorfulness']   = emd.getColorfulness(I_rgb,8)                 

    # dutta f5 - circularized
    features['Rule_of_Thirds_Hue']        = circstat.mean(I_h[rows1thrd:rows2thrd,cols1thrd:cols2thrd]*np.pi/180.0)*180.0/np.pi 

    # dutta f6
    features['Rule_of_Thirds_Saturation'] = np.mean(I_s[rows1thrd:rows2thrd,cols1thrd:cols2thrd]/255.0)                         

    # dutta f7
    features['Rule_of_Thirds_Value']      = np.mean(I_v[rows1thrd:rows2thrd,cols1thrd:cols2thrd]/255.0)                         

    features['Rule_of_Thirds_Salience']   = np.sum(saliencymap[I_zRoT==1])/np.sum(I_zRoT)

    (maskr,maskc) = np.where(I_zRoT)
    (maxsr,maxsc) = np.where(saliencymap == np.max(saliencymap))
    features['Rule_of_Thirds_Distance']   = np.min([np.sqrt(((maxsc[0] - maskc[i])/np.float(ncols))**2 + ((maxsr[0] - maskr[i])/np.float(nrows))**2) for i in range(len(maskr))]) / np.sqrt(2)

    # dutta f8/f9 - Familiarity Metric - Requires Knn clustering of a large dataset.
    #

    # dutta f10-12
    wpH = pywt.WaveletPacket2D(data=I_h, wavelet='db1', mode='zpd', maxlevel=3)
    for ii in xrange(3):
        whh = wpH['d'*ii].data
        whl = wpH['v'*ii].data
        wlh = wpH['h'*ii].data
        Sk = np.linalg.norm(whh,2)+np.linalg.norm(whl,2)+np.linalg.norm(wlh,2)    
        features["Wavelet_hue_%d" % ii] = (whh.sum()+whl.sum()+wlh.sum())/Sk

    # dutta f13-15
    wpS = pywt.WaveletPacket2D(data=I_s, wavelet='db1', mode='zpd', maxlevel=3)
    for ii in xrange(3):
        whh = wpS['d'*ii].data
        whl = wpS['v'*ii].data
        wlh = wpS['h'*ii].data
        Sk = np.linalg.norm(whh,2)+np.linalg.norm(whl,2)+np.linalg.norm(wlh,2)    
        features["Wavelet_saturation_%d" % ii] = (whh.sum()+whl.sum()+wlh.sum())/Sk

    # dutta f16-18
    wpV = pywt.WaveletPacket2D(data=I_v, wavelet='db1', mode='zpd', maxlevel=3)
    for ii in xrange(3):
        whh = wpV['d'*ii].data
        whl = wpV['v'*ii].data
        wlh = wpV['h'*ii].data
        Sk = np.linalg.norm(whh,2)+np.linalg.norm(whl,2)+np.linalg.norm(wlh,2)    
        features["Wavelet_value_%d" % ii] = (whh.sum()+whl.sum()+wlh.sum())/Sk

    # dutta f19-21
    features['Wavelet_hue']        = features['Wavelet_hue_0']       +features['Wavelet_hue_1']       +features['Wavelet_hue_2']
    features['Wavelet_saturation'] = features['Wavelet_saturation_0']+features['Wavelet_saturation_1']+features['Wavelet_saturation_2']
    features['Wavelet_value']      = features['Wavelet_value_0']     +features['Wavelet_value_1']     +features['Wavelet_value_2']

    # dutta f22 - size
    features['Img_size'] = nrows + ncols

    # dutta f23 - ratio
    features['Img_ratio'] = float(ncols)/nrows

    # dutta f24-52 - Requires Segementation!
    #

    # dutta f53-55 Low DOF
    #wp = pywt.WaveletPacket2D(data=I_h, wavelet='db1', mode='zpd', maxlevel=3)
    (nsmallrows,nsmallcols) = wpH['ddd'].data.shape
    A = wpH['ddd'].data[nsmallrows*1/4:nsmallrows*3/4,nsmallcols*1/4:nsmallcols*3/4].sum() + \
        wpH['vvv'].data[nsmallrows*1/4:nsmallrows*3/4,nsmallcols*1/4:nsmallcols*3/4].sum() + \
        wpH['hhh'].data[nsmallrows*1/4:nsmallrows*3/4,nsmallcols*1/4:nsmallcols*3/4].sum()
    B = wpH['ddd'].data.sum() + wpH['vvv'].data.sum() + wpH['hhh'].data.sum()
    features["DoF_hue"] = A/B

    #wp = pywt.WaveletPacket2D(data=I_s, wavelet='db1', mode='zpd', maxlevel=3)
    (nsmallrows,nsmallcols) = wpS['ddd'].data.shape
    A = wpS['ddd'].data[nsmallrows*1/4:nsmallrows*3/4,nsmallcols*1/4:nsmallcols*3/4].sum() + \
        wpS['vvv'].data[nsmallrows*1/4:nsmallrows*3/4,nsmallcols*1/4:nsmallcols*3/4].sum() + \
        wpS['hhh'].data[nsmallrows*1/4:nsmallrows*3/4,nsmallcols*1/4:nsmallcols*3/4].sum()
    B = wpS['ddd'].data.sum() + wpS['vvv'].data.sum() + wpS['hhh'].data.sum()
    features["DoF_saturation"] = A/B

    #wp = pywt.WaveletPacket2D(data=I_v, wavelet='db1', mode='zpd', maxlevel=3)
    (nsmallrows,nsmallcols) = wpV['ddd'].data.shape
    A = wpV['ddd'].data[nsmallrows*1/4:nsmallrows*3/4,nsmallcols*1/4:nsmallcols*3/4].sum() + \
        wpV['vvv'].data[nsmallrows*1/4:nsmallrows*3/4,nsmallcols*1/4:nsmallcols*3/4].sum() + \
        wpV['hhh'].data[nsmallrows*1/4:nsmallrows*3/4,nsmallcols*1/4:nsmallcols*3/4].sum()
    B = wpV['ddd'].data.sum() + wpV['vvv'].data.sum() + wpV['hhh'].data.sum()
    features["DoF_value"] = A/B

    features["LapVar_Hue"]        = cv2.Laplacian(I_h/255.0, cv2.CV_64F).var()
    features["LapVar_Saturation"] = cv2.Laplacian(I_s/255.0, cv2.CV_64F).var()
    features["LapVar_Value"]      = cv2.Laplacian(I_v/255.0, cv2.CV_64F).var()

    tmp = I_h
    lines = cv2.HoughLinesP(cv2.Canny(tmp,100,200,apertureSize = 3),1,np.pi/180,100, minLineLength = 5, maxLineGap = 20)
    if not lines is None:
        features['ProbAngles_Hue'] = circstat.mean([np.arctan2(np.abs(y2-y1),np.abs(x2-x1)) for x1,y1,x2,y2 in lines[0]])
    else:
        features['ProbAngles_Hue'] = 0

    tmp = I_s
    lines = cv2.HoughLinesP(cv2.Canny(tmp,100,200,apertureSize = 3),1,np.pi/180,100, minLineLength = 5, maxLineGap = 20)
    if not lines is None:
        features['ProbAngles_Saturation'] = circstat.mean([np.arctan2(np.abs(y2-y1),np.abs(x2-x1)) for x1,y1,x2,y2 in lines[0]])
    else:
        features['ProbAngles_Saturation'] = 0
    tmp = I_v
    lines = cv2.HoughLinesP(cv2.Canny(tmp,100,200,apertureSize = 3),1,np.pi/180,100, minLineLength = 5, maxLineGap = 20)
    if not lines is None:
        features['ProbAngles_Value'] = circstat.mean([np.arctan2(np.abs(y2-y1),np.abs(x2-x1)) for x1,y1,x2,y2 in lines[0]])
    else:
        features['ProbAngles_Value'] = 0

    tmp = I_h
    a = tmp.astype("float")
    b1 = tmp[::-1,:].astype("float")
    b2 = tmp[:,::-1].astype("float")
    features['Sym_Horizontal_Hue'] = (a * b1).sum() / (np.sqrt((a**2).sum())*np.sqrt((b1**2).sum()))
    features['Sym_Vertical_Hue']   = (a * b2).sum() / (np.sqrt((a**2).sum())*np.sqrt((b2**2).sum()))

    tmp = I_s
    a = tmp.astype("float")
    b1 = tmp[::-1,:].astype("float")
    b2 = tmp[:,::-1].astype("float")
    features['Sym_Horizontal_Saturation'] = (a * b1).sum() / (np.sqrt((a**2).sum())*np.sqrt((b1**2).sum()))
    features['Sym_Vertical_Saturation']   = (a * b2).sum() / (np.sqrt((a**2).sum())*np.sqrt((b2**2).sum()))

    tmp = I_v
    a = tmp.astype("float")
    b1 = tmp[::-1,:].astype("float")
    b2 = tmp[:,::-1].astype("float")
    features['Sym_Horizontal_Value'] = (a * b1).sum() / (np.sqrt((a**2).sum())*np.sqrt((b1**2).sum()))
    features['Sym_Vertical_Value']   = (a * b2).sum() / (np.sqrt((a**2).sum())*np.sqrt((b2**2).sum()))
    return features
