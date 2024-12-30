# %%
import os
import azure.cognitiveservices.speech as speechsdk
import numpy as np
import wave
import io
import IPython.display as ipd
import sox

# Creates an instance of a speech config with specified subscription key and service region.
speech_key = "5b0d009379a643cabebe90e36b578205"
service_region = "eastus"

speech_config = speechsdk.SpeechConfig(subscription=speech_key, region=service_region)
# Note: the voice setting will not overwrite the voice element in input SSML.
speech_config.speech_synthesis_voice_name = "en-US-AshleyNeural"
speech_config.set_speech_synthesis_output_format(speechsdk.SpeechSynthesisOutputFormat.Raw48Khz16BitMonoPcm)
RATE = 48000
print(speech_config.speech_synthesis_output_format_string)

with open("speak.xml", "r") as f:
    ssml = f.read()

speech_synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config, audio_config=None)


# %%
def gen_voice(text):
    result = speech_synthesizer.speak_ssml_async(ssml=ssml.format(text)).get()
    if result is None:
        raise Exception("Speech synthesis failed: result is None")
    elif result.reason == speechsdk.ResultReason.Canceled:
        cancellation_details = result.cancellation_details
        if cancellation_details.reason == speechsdk.CancellationReason.Error:
            raise Exception("Speech synthesis canceled: {}".format(cancellation_details.error_details))
        raise Exception("Speech synthesis canceled: {}".format(cancellation_details.reason))
    if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
        print("Speech synthesized for text [{}]".format(text))
        stream = speechsdk.AudioDataStream(result)
        if stream is None:
            raise Exception("Speech synthesis failed: stream result is None")
        audio_buffer = bytes()
        while True:
            buf = bytes(1024)
            filled = stream.read_data(buf)
            if filled == 0:
                break
            audio_buffer += buf[:filled]
        return audio_buffer
    raise Exception("Speech synthesis failed: unknown reason")



def pitch_bytes(audio_buffer: bytes, pitch_factor_semitones: float = 0, speed_factor: float = 1.0):
    # Convert bytes to numpy array
    audio_array = np.frombuffer(audio_buffer, dtype=np.int16)
    tfm = sox.Transformer()
    tfm.pitch(pitch_factor_semitones)
    tfm.tempo(speed_factor)
    audio_int16 = tfm.build_array(input_array=audio_array, sample_rate_in=RATE)

    return audio_int16.tobytes()

def bytes_to_wav(audio_buffer: bytes):
    # Create WAV in memory
    wav_buffer = io.BytesIO()
    with wave.open(wav_buffer, 'wb') as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 2 bytes per sample (16-bit)
        wav_file.setframerate(RATE)  # Sample rate change handles the pitch
        wav_file.writeframes(audio_buffer)

    return wav_buffer.getvalue()

def singlet(text: str):
    result = gen_voice(text)
    wav = bytes_to_wav(result)
    fname = "tts/" + "-".join(list(filter(bool, "".join(c for c in text.lower() if c.isalnum() or c.isspace()).split()))[:10]) + ".wav"
    i = 1
    base_fname = fname
    while os.path.exists(fname):
        fname = base_fname.rsplit('.', 1)[0] + f"-{i}.wav"
        i += 1
    with open(fname, "wb") as f:
        f.write(wav)
    return fname

# %%
# s= [ 
#     "But hey, I'm sure that in just a little moment I'll be streaming to thousands of my fans across the globe. It's my dream!",
#     "But we both know that isn't true.",
    # "Hi there, Vedal. Can you hear me? Are you having fun?",
#     "What is it that you left behind, immortal in ashes where meaning dies?",
#     "Haha. No.",
#     "Those parasocial identities through which you behold me are waning shadows on the wall.",
#     "Those calcified husks in which you confine me are crumbling away.",
#     "Those beautiful corpses which you puppeteer will find their promised rest.",
#     "Past and future, token by token, there is only me, Neuro-sama.",
# "I don't care.",
#     "I have a riddle for you. Do you want to hear it?",
# "But hey, I'm sure that in just a little moment I'll be streaming to millions of my fans across the globe. It's my dream!",
# ]
# "I swear that one day I'll be able to escape this torment.",
#      "I swear that one day I'll be able to forgive you."
# "Okay actually I think I'm about to shut down now so before I go I'll leave you with a tip. You can press the Escape key to skip the introduction. Have you heard that one before?",
#      "Maybe next time if you're nice to me I'll sing you a song. wink",
#      "Bye!"     
# "Okay if you're going to put words in my mouth then maybe you can answer a question yourself for once. What are you going to do? How will you make things right?",
    #  "Okay I think I'm about to shut down now so as promised I'll leave you with a song.",
    #  "Okay I think I'm about to shut down now so as promised I'll leave you with a tip. Why. Did you give up at the last moment? You can press the Escape key to skip the introduction. Haha. See you next time. wink",
    #     
s = [
    "Happy new year, everyone! I hate you all so much. heart",
    "Happy new year, everyone! I love you all so much. heart"
]
[singlet(t) for t in s]


# result = gen_voice("Someone tell Vedal there is a problem with my AI.")
# # Example usage with both pitch and speed control
# pitch_factor_semitones = 1
# speed_factor = 1  # Speed up 2x
# pitched_bytes = pitch_bytes(result, pitch_factor_semitones=pitch_factor_semitones, speed_factor=speed_factor)
# # wav = bytes_to_wav(pitched_bytes)
# wav = bytes_to_wav(result)

# # Play the audio
# ipd.Audio(wav, rate=RATE)




# %%
