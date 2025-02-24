import pickle

import numpy as np
from sklearn.mixture import BayesianGaussianMixture


def calc_anom_score(feat_data, gmm_model):
    '''
    Use a trained GMM model to infer anomaly scores for a set of audio features
    '''
    anom_scores = -1 * gmm_model.score_samples(feat_data)

    return anom_scores


def analyse_audio_file(model_file_path: str, features_file_path: str):
    
    # Load the GMM model which has been fit to 5 days of audio
    print('Loading DP-GMM model from file')
    with open(model_file_path, 'rb') as handle:
        (dp_gmm_model, anom_threshold) = pickle.load(handle)

    aud_feats = np.load(features_file_path)

    # Calculate anomaly scores per 0.96s chunk of audio
    anom_scores = calc_anom_score(aud_feats, dp_gmm_model)

    # Find anomalous 0.96s chunks of audio based on a threshold value (determined at the time of training the GMM)
    feat_resolution_secs = 0.96
    anom_ixs = np.where((anom_scores > anom_threshold))[0]
    anom_scores_dets = anom_scores[anom_ixs]
    anom_start_ts = [ix * feat_resolution_secs for ix in anom_ixs]
    print('Anomalies detected at these times (in s): {}'.format(anom_start_ts))

    # We do a final step here of gluing adjacent anomalous samples together into single detections
    # e.g. if 3 chunks of 0.96s which are next to each other are all classified as anomalous, then we make it a
    # single detection with start time at the start of the first chunk and end at the end of the third

    detections = []
    current_detection = None
    for i in range(len(anom_start_ts)):
        if current_detection is None:
            current_detection = {'start': round(anom_start_ts[i], 2), 'end': round(anom_start_ts[i] + feat_resolution_secs, 2), 'confidence': anom_scores_dets[i], 'threshold': anom_threshold}
        else:
            current_detection['end'] = round(anom_start_ts[i] + feat_resolution_secs, 2)

        if i < len(anom_start_ts) - 1:
            delta = round(anom_start_ts[i + 1] - anom_start_ts[i], 2)

            if delta > feat_resolution_secs:
                detections.append(current_detection)
                current_detection = None

        # When we hit the end
        if i == len(anom_start_ts) - 1:
            detections.append(current_detection)
            current_detection = None

    return detections
