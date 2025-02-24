import os
import pickle
import shutil
from timeit import default_timer as timer

import dateutil.parser
import numpy as np
from firebase_admin import firestore, storage
from google.cloud import storage as gcstorage
from joblib import Parallel, delayed
from sklearn.mixture import BayesianGaussianMixture


def download_features(docId, vggish_performed, project, features_folder, bucket_name):
    if not vggish_performed:
        print(f"Warning: {docId} has not yet gone through feature extraction and will be excluded")
    else:
        bucket_path = f'artifacts/vggish/{project}/{docId}/raw_audioset_feats_960ms.npy'
        local_path = os.path.join(features_folder, f"{docId}_raw_audioset_feats_960ms.npy")         

        storage_client = gcstorage.Client()

        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(bucket_path)
        blob.download_to_filename(local_path)

        print(f"    {local_path}", end='\r')


def train_gmm_model(project: str, recorder: str, from_iso_date: str, to_iso_date: str): 
    """
    Downloads the audio features and fits a GMM then uploads the result to storage.
    """
    start_global_timer = timer()

    from_date = dateutil.parser.isoparse(from_iso_date)
    to_date = dateutil.parser.isoparse(to_iso_date)

    print(f"Training model for {project} {recorder}")
    print(f"    from {from_date}")
    print(f"    to   {to_date}")

    work_folder = os.path.join("/","tmp", recorder, f'{from_date.strftime("%y-%m-%d")}_{to_date.strftime("%y-%m-%d")}') 
    features_folder = os.path.join(work_folder, "features") 

    # Ensure we have a clean directory to start
    if os.path.exists(work_folder):
        shutil.rmtree(work_folder)  
    os.makedirs(features_folder)

    bucket_name = "bugg-301712.appspot.com"
    bucket = storage.bucket(bucket_name)

    # get the audio records from firestore for this date range
    db = firestore.client()
    audio_col_ref = db.collection(u'audio')
    docs = audio_col_ref.where(u'project', u'==', project).where(u'recorder', u'==', recorder).where("uploadedAt",">=",from_date).where("uploadedAt","<=",to_date).order_by("uploadedAt",  direction=firestore.Query.DESCENDING).stream()

    # download all the features for each audio record

    print("Downloading features")
    start_download_timer = timer()

    Parallel(n_jobs=4)(delayed(download_features)(doc.id, "vggish" in doc.to_dict()["analysesPerformed"], project, features_folder, bucket_name) for doc in docs)

    end_download_timer = timer()
    print("")
    
    all_fs = os.listdir(features_folder)
    print(f"Download of {len(all_fs)} files completed in {end_download_timer - start_download_timer} secs")

    # load features into array
    all_feat_data = None

    print(f"Stacking features")
    start_stack_timer = timer()
    # Load features from each file in turn
    for f in all_fs:
        if ".npy" in f: 
            # print(f"Stacking {f}", end='\r')
            with open(os.path.join(features_folder, f), 'rb') as handle:
                f_feat_data = np.load(handle)

        # Add results from this file into big array holding features from all audio
        if all_feat_data is None:
            all_feat_data = f_feat_data
        else:
            all_feat_data = np.vstack((all_feat_data, f_feat_data))

    end_stack_timer = timer()
    print("")
    print(f"Features stacked {all_feat_data.shape} in {end_stack_timer - start_stack_timer} secs")

    gmm_path = os.path.join(work_folder, f'{recorder}_{from_date.strftime("%y-%m-%d")}_{to_date.strftime("%y-%m-%d")}_gmm_model.pickle')         


    # Fit the Gaussian Mixture Model (GMM) to the feature data

    # IMPORTANT: these are the two parameters we can play with to tune how long the model fitting runs.
    # We want gmm_comps to be at least 10. The higher the better (e.g., 100+), but it will also take longer to converge
    gmm_comps = 100
    # cov_type can take two values: 'diag' or 'full'. 'diag' is a lot faster, but 'full' is more accurate
    cov_type = 'diag'
    # A little subjective, but gmm_comps being larger is more important than using cov_type = 'full'

    print('Fitting DP-GMM model')
    start = timer()
    dp_gmm_model = BayesianGaussianMixture(n_components=gmm_comps,covariance_type=cov_type,
                                                           weight_concentration_prior_type='dirichlet_process',
                                                           random_state=10).fit(all_feat_data)
    end = timer()
    print(f'Fit completed in {end - start} secs')

    all_anom_scores = -1 * dp_gmm_model.score_samples(all_feat_data)

    # Set the threshold such that anything that would have been in the top 0.01 percent of scores is anomalous
    # We might want to come back and adjust this threshold if we are getting too many / too few detections
    anom_threshold = np.percentile(all_anom_scores, 99.99)

    # Save the model which has been fit to the audio
    print('Saving DP-GMM model to file')
    with open(gmm_path, 'wb') as handle:
        pickle.dump((dp_gmm_model, anom_threshold), handle, protocol=pickle.HIGHEST_PROTOCOL)
    
    # upload the model to cloud storage
    print(f"Uploading {gmm_path}")
    gmm_destination_path = f'artifacts/gmm/{project}/{recorder}/{recorder}_{from_date.strftime("%y-%m-%d")}_{to_date.strftime("%y-%m-%d")}_gmm_model.pickle'
    gmm_destination_blob = bucket.blob(gmm_destination_path)
    gmm_destination_blob.upload_from_filename(gmm_path)

    print(f"Upload complete gs://{bucket_name}/{gmm_destination_path}")
    print(f"")
    print(f"")
    print(f'https://console.firebase.google.com/u/0/project/bugg-301712/storage/bugg-301712.appspot.com/files/~2Fartifacts~2Fgmm~2F{project}~2F{recorder}')
    print(f"")

    # cleanup and remove all files downloaded
    shutil.rmtree(work_folder)

    end_global_timer = timer()
    print(f"task took {end_global_timer - start_global_timer} secs")
