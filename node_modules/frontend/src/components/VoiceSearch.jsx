import React, { useState, useRef, useEffect } from 'react';

export default function VoiceSearch({ onResult }) {
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState('');   // 'listening' | 'processing' | ''
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
    
    // Try Hindi first
    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;
    recognition.continuous = false;

    recognition.onstart = () => {
      setListening(true);
      setStatus('listening');
    };

    recognition.onresult = (event) => {
      setStatus('processing');
      const results = event.results[0];
      let transcript = results[0].transcript.trim();
      transcript = transcript
        .replace(/^(सुनो|सुनिए|hey|hello|ओके)/i, '')
        .trim();
      if (transcript && onResult) {
        onResult(transcript);
      }
      setListening(false);
      setStatus('');
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        setListening(false);
        setStatus('');
        return;
      }
      if (event.error === 'not-allowed') {
        alert('Microphone access denied. Please allow microphone permission.');
      }
      setListening(false);
      setStatus('');
    };

    recognition.onend = () => {
      setListening(false);
      setStatus('');
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <div className="voice-search-wrap">
      { !listening && (
        <button
          onClick={startListening}
          className="voice-search-btn"
          title="Voice Search (Hindi / English)"
        >
          <i className="fas fa-microphone" />
          <span className="voice-search-label">Voice</span>
        </button>
      ) }
    {/* show a temporary status indicator while listening/processing */}
    {listening && (
      <div className="voice-search-status">
        {status === 'listening' && (
          <>
            <span className="voice-search-dot" /> Listening…
          </>
        )}
        {status === 'processing' && 'Processing…'}
      </div>
    )}

    </div>
  );
}
