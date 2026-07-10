import React, { useState, useRef, useEffect } from 'react';

export default function VoiceSearch({ onResult }) {
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState(''); // 'listening' | 'processing' | ''
  const [currentTranscript, setCurrentTranscript] = useState('');
  const recognitionRef = useRef(null);

  const SpeechRecognition =
    typeof window !== 'undefined'
      ? (window.SpeechRecognition || window.webkitSpeechRecognition)
      : null;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const startListening = () => {
    if (!SpeechRecognition) {
      alert('Voice search is not supported in this browser. Use Chrome or Edge.');
      return;
    }

    setListening(true);
    setStatus('listening');
    setCurrentTranscript('');

    // Try multiple language codes in sequence for better mixed-language detection
    const languages = ['hi-IN', 'en-US', 'hi-IN,en-US'];
    let langIndex = 0;

    const tryLanguage = () => {
      if (langIndex >= languages.length) {
        // No more languages to try, stop listening
        setListening(false);
        setStatus('');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = languages[langIndex];
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 10; // More alternatives for better accuracy

      let hasFinalResult = false;

      recognition.onstart = () => {
        console.log('Voice recognition started with lang:', recognition.lang);
      };

      recognition.onresult = (event) => {
        let transcript = '';
        let isFinal = false;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          transcript += result[0].transcript;
          if (result.isFinal) {
            isFinal = true;
            hasFinalResult = true;
          }
        }

        transcript = transcript.trim();

        // Clean up common filler words in both Hindi and English
        transcript = transcript
          .replace(/^(सुनो|सुनिए|hey|hello|ओके|ok|okay|um|uh)/i, '')
          .trim();

        setCurrentTranscript(transcript);

        if (isFinal && transcript && onResult) {
          setStatus('processing');
          // Small delay to make it feel like processing
          setTimeout(() => {
            onResult(transcript);
            setListening(false);
            setStatus('');
            setCurrentTranscript('');
          }, 300);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error, 'lang:', recognition.lang);

        // If no speech, try next language
        if (event.error === 'no-speech') {
          langIndex++;
          tryLanguage();
          return;
        }

        // Handle other errors gracefully
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please allow microphone permission in your browser settings.');
        } else if (event.error === 'audio-capture') {
          alert('No microphone detected. Please ensure a microphone is connected and try again.');
        } else if (event.error === 'network') {
          alert('Network error. Please check your internet connection and try again.');
        } else if (event.error !== 'aborted') {
          alert(`Voice search error: ${event.error}. Please try again.`);
        }

        setListening(false);
        setStatus('');
        setCurrentTranscript('');
      };

      recognition.onend = () => {
        // Only try next language if we didn't get a final result
        if (!hasFinalResult && listening) {
          langIndex++;
          tryLanguage();
        } else {
          setListening(false);
          setStatus('');
          setCurrentTranscript('');
        }
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
        // Try next language if start fails
        langIndex++;
        tryLanguage();
      }
    };

    tryLanguage();
  };

  // Allow clicking the status to stop listening
  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // Ignore errors when stopping
      }
    }
    setListening(false);
    setStatus('');
    setCurrentTranscript('');
  };

  return (
    <div className="voice-search-wrap">
      {!listening ? (
        <button
          onClick={startListening}
          className="voice-search-btn"
          title="Voice Search (Hindi / English / Mixed)"
        >
          <i className="fas fa-microphone" />
          <span className="voice-search-label">Voice</span>
        </button>
      ) : (
        <button
          onClick={stopListening}
          className="voice-search-btn voice-search-btn--active"
          title="Stop Listening"
        >
          <i className="fas fa-microphone-slash" />
          <span className="voice-search-label">Stop</span>
          <div className="voice-search-pulse" />
        </button>
      )}
      {/* Show temporary status indicator while listening/processing */}
      {listening && (
        <div className="voice-search-status" onClick={stopListening}>
          {status === 'listening' && (
            <>
              <span className="voice-search-dot" />
              Listening…
              {currentTranscript && <span style={{ marginLeft: '10px' }}>"{currentTranscript}"</span>}
            </>
          )}
          {status === 'processing' && (
            <>
              <span className="voice-search-dot" />
              Processing…
            </>
          )}
        </div>
      )}
    </div>
  );
}
