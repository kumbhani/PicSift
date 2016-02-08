#Import OpenCv library
import cv
import cv2
import numpy as np

### HISTOGRAM FUNCTION #########################################################
def calcHistogram(src,quantization=16):
    # Convert to HSV
    #src = cv.fromarray(_src)
    luv = cv.CreateImage(cv.GetSize(src), 8, 3)
    cv.CvtColor(src, luv, cv.CV_RGB2Luv)

    # Extract the H and S planes
    size = cv.GetSize(src)
    L_plane = cv.CreateMat(size[1], size[0], cv.CV_8UC1)
    U_plane = cv.CreateMat(size[1], size[0], cv.CV_8UC1)
    V_plane = cv.CreateMat(size[1], size[0], cv.CV_8UC1)
    cv.Split(luv, L_plane, U_plane, V_plane, None)
    planes = [L_plane, U_plane, V_plane]
    #print np.asarray(L_plane),np.asarray(U_plane),np.asarray(V_plane)
    #Define number of bins
    L_bins = quantization
    U_bins = quantization
    V_bins = quantization

    #Define histogram size
    hist_size = [L_bins, U_bins, V_bins]

    # 
    L_ranges = [0, 255]
    U_ranges = [0, 255]
    V_ranges = [0, 255]

    ranges = [L_ranges, U_ranges, V_ranges]

    #Create histogram
    hist = cv.CreateHist([L_bins, U_bins, V_bins], cv.CV_HIST_ARRAY, ranges, 1)

    #Calc histogram
    cv.CalcHist([cv.GetImage(i) for i in planes], hist)
    
    #Normalize histogram
    cv.NormalizeHist(hist, 1.0)
    
    #Return histogram
    return hist

### EARTH MOVERS ############################################################
def calcEM(hist1,hist2,l_bins=16,u_bins=16,v_bins=16):

    #Define number of rows
    numRows = l_bins*u_bins*v_bins

    sig1 = cv.CreateMat(numRows, 4, cv.CV_32FC1)
    sig2 = cv.CreateMat(numRows, 4, cv.CV_32FC1)    
    eq_val = 1.0/numRows
    
    for l in range(l_bins):
        for u in range(u_bins):
            for v in range(v_bins):                
                bin_val = cv.QueryHistValue_3D(hist1, l, u, v)
                
                cv.Set2D(sig1, l*u_bins*v_bins+u*v_bins+v, 0, cv.Scalar(bin_val))
                cv.Set2D(sig1, l*u_bins*v_bins+u*v_bins+v, 1, cv.Scalar(l))
                cv.Set2D(sig1, l*u_bins*v_bins+u*v_bins+v, 2, cv.Scalar(u))
                cv.Set2D(sig1, l*u_bins*v_bins+u*v_bins+v, 3, cv.Scalar(v))
                
                if hist2==None:
                    bin_val = eq_val
                else:
                    bin_val = cv.QueryHistValue_3D(hist2, l, u, v)
                cv.Set2D(sig2, l*u_bins*v_bins+u*v_bins+v, 0, cv.Scalar(bin_val))
                cv.Set2D(sig2, l*u_bins*v_bins+u*v_bins+v, 1, cv.Scalar(l))
                cv.Set2D(sig2, l*u_bins*v_bins+u*v_bins+v, 2, cv.Scalar(u))
                cv.Set2D(sig2, l*u_bins*v_bins+u*v_bins+v, 3, cv.Scalar(v))

    #This is the important line were the OpenCV EM algorithm is called
    return (cv.CalcEMD2(sig1,sig2,cv.CV_DIST_L2),np.asarray(sig1)[:,0],np.asarray(sig2)[:,0])

def getColorfulness(_img,quantization=16):
    img = _img
    if type(_img) is np.ndarray:
    	img = cv.CreateImageHeader((_img.shape[1], _img.shape[0]), cv.IPL_DEPTH_8U, 3)
    	cv.SetData(img, _img.tostring(), _img.dtype.itemsize * 3 * _img.shape[1])
    elif not type(_img) is cv2.cv.iplimage:
        return(None)
    
    histSrc1 = calcHistogram(img,quantization)
    histComp,s1,s2 = calcEM(histSrc1,None,quantization,quantization,quantization)
    return histComp

### MAIN ########################################################################
if __name__=="__main__":
    
    #Load image 1
    #src1 = cv.LoadImage("image1.jpg")
    #t = tm.time()
    #src1 = cv.LoadImage('Insight/colortest.jpg')        # colorful img1
    src1 = cv.LoadImage('Insight/colortest2.jpg')      # colorful img2
    #src1 = cv.LoadImage('Insight/images/11026.jpg')    # landscape
    #src1 = cv.LoadImage('Insight/images2/437418.jpg')  # cat
    #print "Time for Image load: %.1f s" % (tm.time()-t)

    # Get histograms
    #t = tm.time()
    histSrc1= calcHistogram(src1)
    #histSrc2= calcHistogram(src2)
    #print "Time for Hist: %.1f s" % (tm.time()-t)

    # Compare histograms using earth mover's
    #t = tm.time()
    #histComp,s1,s2 = calcEM(histSrc1,histSrc2,16,16,16)
    histComp,s1,s2 = calcEM(histSrc1,None,16,16,16)
    #print "Time for EMD: %.1f s" % (tm.time()-t)

    #Print solution
    print histComp


