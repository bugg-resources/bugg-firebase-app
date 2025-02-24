import torch

def preload():
    print("preloading the model...")
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    torch.hub.load('pyannote/pyannote-audio', 'sad_ami', device=device, batch_size=128)


if __name__ == "__main__":
    preload()

