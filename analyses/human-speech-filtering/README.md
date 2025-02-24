Checks an audio sample for the presence of human speech. If the sample contains human speech, it's qarantined and the sample is marked for deletion.

Have a new bucket that the audio moves to if the human processing is requrired



Actions: 
[]: When processing the audio-drop-box Check to see if human speech filtering is enabled for this project
[]: If enabled, move the audio to the new audio-speech-filter bucket
[]: Create a function to dispatch a pubsub job when audio is added to the bucket
[]: Create a container that listens for the pubsub job and runs the speech detect function
[]: If speech is found, move the audio to the audio-speech-quarantine bucket
[]: Create a function that watches audio-speech-quarantine bucket for new audio. It should check the project settings to see if audio should be deleted or not and delete it if it should.
[]: Record that the audio was deleted