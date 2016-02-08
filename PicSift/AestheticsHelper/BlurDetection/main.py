#!/usr/bin/env python
# -*- coding: utf-8 -*-
__author__ = 'Will Brennan'

# built-in modules
import logging
import argparse
# Standard modules
import cv2
import numpy
# Custom modules
import scripts
import FocusMask

logger = logging.getLogger('main')


def evaluate(img_col, args):
    numpy.seterr(all='ignore')
    assert isinstance(img_col, numpy.ndarray), 'img_col must be a numpy array'
    assert img_col.ndim == 3, 'img_col must be a color image ({0} dimensions currently)'.format(img_col.ndim)
    assert isinstance(args, argparse.Namespace), 'args must be of type argparse.Namespace not {0}'.format(type(args))
    img_gry = cv2.cvtColor(img_col, cv2.COLOR_RGB2GRAY)
    rows, cols = img_gry.shape
    crow, ccol = rows/2, cols/2
    f = numpy.fft.fft2(img_gry)
    fshift = numpy.fft.fftshift(f)
    fshift[crow-75:crow+75, ccol-75:ccol+75] = 0
    f_ishift = numpy.fft.ifftshift(fshift)
    img_fft = numpy.fft.ifft2(f_ishift)
    img_fft = 20*numpy.log(numpy.abs(img_fft))
    if args.display and not args.testing:
        cv2.destroyAllWindows()
        scripts.display('img_fft', img_fft)
        scripts.display('img_col', img_col)
        cv2.waitKey(0)
    result = numpy.mean(img_fft)
    return img_fft, result, result < args.thresh


def blur_detector(img_col, thresh=10, mask=False):
    assert isinstance(img_col, numpy.ndarray), 'img_col must be a numpy array'
    assert img_col.ndim == 3, 'img_col must be a color image ({0} dimensions currently)'.format(img_col.ndim)
    args = scripts.gen_args()
    args.thresh = thresh
    if mask:
        return FocusMask.blur_mask(img)
    else:
        return evaluate(img_col=img_col, args=args)


if __name__ == '__main__':
    args = scripts.get_args()
    logger = scripts.get_logger(quite=args.quite, debug=args.debug)
    x_okay, y_okay = [], []
    x_blur, y_blur = [], []
    for path in args.image_paths:
        for img_path in scripts.find_images(path):
            logger.debug('evaluating {0}'.format(img_path))
            img = cv2.imread(img_path)
            if isinstance(img, numpy.ndarray):
                if args.testing:
                    scripts.display('dialog (blurry: Y?)', img)
                    blurry = False
                    if cv2.waitKey(0) in map(lambda i: ord(i), ['Y', 'y']):
                        blurry = True
                    x_axis = [1, 3, 5, 7, 9]
                    for x in x_axis:
                        img_mod = cv2.GaussianBlur(img, (x, x), 0)
                        y = evaluate(img_mod, args=args)[0]
                        if blurry:
                            x_blur.append(x)
                            y_blur.append(y)
                        else:
                            x_okay.append(x)
                            y_okay.append(y)
                elif args.mask:
                    msk, res, blurry = FocusMask.blur_mask(img)
                    img_msk = cv2.bitwise_and(img, img, mask=msk)
                    if args.display:
                        scripts.display('res', img_msk)
                        scripts.display('msk', msk)
                        scripts.display('img', img)
                        cv2.waitKey(0)
                else:
                    img_fft, result, val = evaluate(img, args=args)
                    logger.info('fft average of {0}'.format(result))
                    if args.display:
                        scripts.display('input', img)
                        scripts.display('img_fft', img_fft)
                        cv2.waitKey(0)
    if args.display and args.testing:
        import matplotlib.pyplot as plt
        logger.debug('x_okay: {0}'.format(x_okay))
        logger.debug('y_okay: {0}'.format(y_okay))
        logger.debug('x_blur: {0}'.format(x_blur))
        logger.debug('y_blur: {0}'.format(y_blur))
        plt.scatter(x_okay, y_okay, color='g')
        plt.scatter(x_blur, y_blur, color='r')
        plt.grid(True)
        plt.show()
