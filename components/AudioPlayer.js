'use client';

import { useState, useEffect, useRef } from 'react';

export default function AudioPlayer({ title, author, content, excerpt }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(0.85); // Speed: 0.85x (Normal), 1.0x, 1.15x, 1.3x
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [supported, setSupported] = useState(false);

  const sentencesRef = useRef([]);
  const synthRef = useRef(null);
  const utteranceRef = useRef(null);

  // 1. Sanitize and prepare text
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setSupported(true);
      synthRef.current = window.speechSynthesis;
    }

    // Clean up HTML tags and prepare the script
    const cleanHTML = (html) => {
      if (!html) return '';
      return html
        .replace(/<[^>]*>/g, ' ') // Strip HTML tags
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ') // Collapse multiple spaces
        .trim();
    };

    const cleanTitle = title || '';
    const cleanExcerpt = excerpt || '';
    const cleanContent = cleanHTML(content);

    // Build a natural speaking script
    const script = `
      Article Title: ${cleanTitle}.
      Written by ${author || 'MedSense Editorial Team'}.
      Summary: ${cleanExcerpt}.
      ${cleanContent}
    `;

    // Split text into short, natural sentences to avoid the browser speech-lock bug
    const sentenceList = script
      .split(/(?<=[.!?])\s+/) // Split by sentences using lookbehind
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.includes('©') && !s.toLowerCase().includes('all rights reserved')); // Exclude copyright/disclaimer lines

    sentencesRef.current = sentenceList;
  }, [title, author, content, excerpt]);

  // Clean up speech synthesis when component unmounts
  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const speakSentence = (index) => {
    if (!synthRef.current || index >= sentencesRef.current.length) {
      handleStop();
      return;
    }

    setCurrentSentenceIndex(index);
    const text = sentencesRef.current[index];

    // Cancel any active utterance just in case
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    utterance.rate = rate;

    // Auto-select a high-quality natural voice if available
    const voices = synthRef.current.getVoices();
    const premiumVoice = voices.find(v => 
      v.lang.startsWith('en') && 
      (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Microsoft'))
    );
    if (premiumVoice) {
      utterance.voice = premiumVoice;
    }

    // Handle end of sentence -> play next sentence
    utterance.onend = () => {
      speakSentence(index + 1);
    };

    utterance.onerror = (e) => {
      console.error('Speech error:', e);
      if (e.error !== 'interrupted') {
        handleStop();
      }
    };

    synthRef.current.speak(utterance);
  };

  const handlePlayPause = () => {
    if (!supported || sentencesRef.current.length === 0) return;

    if (isPlaying) {
      if (isPaused) {
        // Resume
        setIsPaused(false);
        synthRef.current.resume();
      } else {
        // Pause
        setIsPaused(true);
        synthRef.current.pause();
      }
    } else {
      // Start fresh or resume from last sentence
      setIsPlaying(true);
      setIsPaused(false);
      speakSentence(currentSentenceIndex);
    }
  };

  const handleStop = () => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentSentenceIndex(0);
  };

  const handleSpeedChange = () => {
    const speeds = [0.85, 1.0, 1.15, 1.3];
    const currentIndex = speeds.indexOf(rate);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setRate(nextSpeed);

    // If active, restart the current sentence with the new speed immediately
    if (isPlaying && !isPaused) {
      speakSentence(currentSentenceIndex);
    }
  };

  if (!supported) return null;

  return (
    <div className="audio-article-player" style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.6rem',
      padding: '0.4rem 0.8rem',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: '20px',
      margin: '1rem auto 1.5rem auto',
      width: '100%',
      maxWidth: '280px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
      justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button 
          onClick={handlePlayPause}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'var(--intel-blue)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            transition: 'all 0.2s',
            flexShrink: 0,
          }}
          aria-label={isPlaying && !isPaused ? "Pause Article" : "Listen to Article"}
        >
          {isPlaying && !isPaused ? (
            <i className="fas fa-pause"></i>
          ) : (
            <i className="fas fa-play" style={{ marginLeft: isPlaying ? '0' : '2px' }}></i>
          )}
        </button>
        
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: '85px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text)', whiteSpace: 'nowrap' }}>
            {isPlaying ? (isPaused ? "Paused" : "Listening...") : "Listen to Article"}
          </span>
          {isPlaying && (
            <span style={{ fontSize: '0.6rem', opacity: 0.6, whiteSpace: 'nowrap' }}>
              {`${currentSentenceIndex + 1}/${sentencesRef.current.length}`}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderLeft: '1px solid var(--border)', paddingLeft: '0.4rem' }}>
        {isPlaying && (
          <button 
            onClick={handleStop}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text)',
              fontSize: '0.75rem',
              padding: '2px 4px',
              opacity: 0.7,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Stop Audio"
          >
            <i className="fas fa-stop"></i>
          </button>
        )}

        <button 
          onClick={handleSpeedChange}
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '2px 6px',
            fontSize: '0.65rem',
            fontWeight: 800,
            cursor: 'pointer',
            color: 'var(--text)',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Change Reading Speed"
        >
          {rate === 0.85 ? '1.0x' : rate === 1.0 ? '1.2x' : rate === 1.15 ? '1.4x' : '1.6x'}
        </button>
      </div>
    </div>
  );
}
