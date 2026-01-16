class AudioEngine {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5; // Avoid clipping
        this.masterGain.connect(this.ctx.destination);
    }

    resume() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playInstrument(name, frequency, duration = 0.5) {
        const now = this.ctx.currentTime;

        // --- Helper for Envelope ---
        const createEnv = (attack, decay, sustain, release) => {
            const gain = this.ctx.createGain();
            const sus = Math.max(0.001, sustain); // Prevent exponential ramp to 0 error
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(1, now + attack);
            gain.gain.exponentialRampToValueAtTime(sus, now + attack + decay);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration + release);
            return gain;
        };

        const osc = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator(); // Secondary osc for thickness
        let gainNode;

        switch (name) {
            case 'piano':
                osc.type = 'triangle';
                gainNode = createEnv(0.01, 0.1, 0.5, 0.4);
                // Filter for "thud"
                const pFilter = this.ctx.createBiquadFilter();
                pFilter.type = 'lowpass';
                pFilter.frequency.value = 1000;
                osc.connect(pFilter);
                pFilter.connect(gainNode);
                break;

            case 'trumpet':
                osc.type = 'sawtooth';
                gainNode = createEnv(0.05, 0.1, 0.8, 0.2);
                const tFilter = this.ctx.createBiquadFilter();
                tFilter.type = 'lowpass';
                tFilter.frequency.setValueAtTime(500, now);
                tFilter.frequency.linearRampToValueAtTime(2500, now + 0.1); // Brass "blare"
                osc.connect(tFilter);
                tFilter.connect(gainNode);
                break;

            case 'flute':
                osc.type = 'sine';
                // Slight vibrato
                osc.frequency.setValueAtTime(frequency, now);
                // Breath noise? Keep simple for now.
                gainNode = createEnv(0.1, 0.1, 0.9, 0.2);
                osc.connect(gainNode);
                break;

            case 'violin':
                osc.type = 'sawtooth';
                gainNode = createEnv(0.3, 0.2, 0.8, 0.5); // Slow attack (bowing)
                const vFilter = this.ctx.createBiquadFilter();
                vFilter.type = 'highpass'; // Thin sound
                vFilter.frequency.value = 500;
                osc.connect(vFilter);
                vFilter.connect(gainNode);
                break;

            case 'guitar':
                osc.type = 'sawtooth'; // Brighter, twangier
                gainNode = createEnv(0.005, 0.4, 0.0, 0.1); // Sharp pluck, no sustain
                const gFilter = this.ctx.createBiquadFilter();
                gFilter.type = 'lowpass';
                gFilter.frequency.setValueAtTime(3000, now);
                gFilter.frequency.exponentialRampToValueAtTime(500, now + 0.2); // Filter "wah" / pluck
                osc.connect(gFilter);
                gFilter.connect(gainNode);
                break;

            case 'saxophone':
                osc.type = 'square';
                gainNode = createEnv(0.1, 0.1, 0.8, 0.2);
                const sFilter = this.ctx.createBiquadFilter();
                sFilter.type = 'lowpass';
                sFilter.frequency.setValueAtTime(400, now);
                sFilter.frequency.exponentialRampToValueAtTime(3000, now + 0.1); // Growl
                osc.connect(sFilter);
                sFilter.connect(gainNode);
                break;

            case 'marimba':
                osc.type = 'sine';
                gainNode = createEnv(0.01, 0.05, 0.0, 0.1); // Very short
                gainNode.gain.setValueAtTime(0, now);
                gainNode.gain.linearRampToValueAtTime(1, now + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3); // Explicit fast decay
                osc.connect(gainNode);
                break;

            case 'banjo':
                osc.type = 'sawtooth'; // Twangy
                gainNode = createEnv(0.01, 0.2, 0.1, 0.1);
                const bFilter = this.ctx.createBiquadFilter();
                bFilter.type = 'highpass';
                bFilter.frequency.value = 1000; // Thin it out
                osc.connect(bFilter);
                bFilter.connect(gainNode);
                break;

            case 'synth':
                osc.type = 'sawtooth';
                osc2.type = 'square'; // Detune
                osc2.frequency.setValueAtTime(frequency * 1.01, now);

                const sGain = createEnv(0.01, 0.1, 0.5, 0.5);

                osc.connect(sGain);
                osc2.connect(sGain);

                gainNode = sGain;
                osc2.start();
                osc2.stop(now + duration + 0.5);
                break; // Special case with 2 oscs

            case 'oboe':
                osc.type = 'sawtooth';
                gainNode = createEnv(0.05, 0.1, 0.8, 0.2);
                const obFilter = this.ctx.createBiquadFilter();
                obFilter.type = 'bandpass';
                obFilter.frequency.value = 1500; // Nasal quality
                obFilter.Q.value = 1;
                osc.connect(obFilter);
                obFilter.connect(gainNode);
                break;

            case 'harp':
                osc.type = 'triangle';
                gainNode = createEnv(0.01, 0.5, 0.1, 0.5); // Long clean decay
                osc.connect(gainNode);
                break;

            case 'celesta':
                osc.type = 'sine';
                gainNode = createEnv(0.001, 0.2, 0.0, 0.2); // Bell like
                osc.frequency.setValueAtTime(frequency * 2, now); // Higher pitch
                osc.connect(gainNode);
                break;

            case 'accordion':
                osc.type = 'square';
                // Need rich harmonics
                osc2.type = 'square';
                osc2.frequency.setValueAtTime(frequency * 1.005, now); // Detune
                osc2.start(now); osc2.stop(now + duration + 0.5);

                const accGain = createEnv(0.05, 0.1, 0.9, 0.2);
                osc.connect(accGain);
                osc2.connect(accGain);
                gainNode = accGain;
                break;

            case 'sitar':
                osc.type = 'sawtooth';
                gainNode = createEnv(0.01, 0.3, 0.5, 0.5);
                const siFilter = this.ctx.createBiquadFilter();
                siFilter.type = 'lowpass';
                siFilter.frequency.setValueAtTime(3000, now);
                siFilter.frequency.exponentialRampToValueAtTime(100, now + 0.3); // "Twang"
                siFilter.Q.value = 5; // Resonance
                osc.connect(siFilter);
                siFilter.connect(gainNode);
                break;

            case 'koto':
                osc.type = 'triangle';
                gainNode = createEnv(0.01, 0.1, 0.0, 0.1); // Short pluck
                const kFilter = this.ctx.createBiquadFilter();
                kFilter.type = 'highpass';
                kFilter.frequency.value = 800;
                osc.connect(kFilter);
                kFilter.connect(gainNode);
                break;

            case 'steeldrum':
                osc.type = 'sine';
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(frequency * 2.5, now); // Harmonic
                osc2.start(now); osc2.stop(now + duration + 0.5);

                const sdGain = createEnv(0.01, 0.2, 0.0, 0.1);
                osc.connect(sdGain);
                osc2.connect(sdGain);
                gainNode = sdGain;
                break;

            case '8bit':
                osc.type = 'square';
                gainNode = createEnv(0.001, 0.1, 0.5, 0.1); // Blocky
                osc.connect(gainNode);
                break;

            case 'bass':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(frequency * 0.5, now); // Octave down
                gainNode = createEnv(0.01, 0.3, 0.5, 0.2);
                osc.connect(gainNode);
                break;

            case 'organ':
                osc.type = 'triangle';
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(frequency * 2, now);
                osc2.start(now); osc2.stop(now + duration + 0.5);

                const orgGain = createEnv(0.05, 0.1, 1.0, 0.1); // Sustain
                osc.connect(orgGain);
                osc2.connect(orgGain);
                gainNode = orgGain;
                break;

            case 'clarinet':
                osc.type = 'square'; // Hollow sound
                gainNode = createEnv(0.05, 0.1, 0.8, 0.2);
                const cFilter = this.ctx.createBiquadFilter();
                cFilter.type = 'lowpass';
                cFilter.frequency.value = 2000;
                osc.connect(cFilter);
                cFilter.connect(gainNode);
                break;

            default: // Default to piano
                osc.type = 'triangle';
                gainNode = createEnv(0.01, 0.1, 0.5, 0.4);
                osc.connect(gainNode);
                break;
        }

        if (name !== 'synth') {
            // Standard path
            osc.frequency.setValueAtTime(frequency, now);
            gainNode.connect(this.masterGain);
            osc.start();
            osc.stop(now + duration + 0.5); // Add release tail
        } else {
            // Synth already connected
            gainNode.connect(this.masterGain);
            osc.frequency.setValueAtTime(frequency, now);
            osc.start();
            osc.stop(now + duration + 0.5);
        }
    }

    playTrumpet(frequency, duration = 0.5) {
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.type = 'sawtooth'; // Brassy sound
        osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

        const now = this.ctx.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.8, now + 0.05); // Brassy attack
        gainNode.gain.exponentialRampToValueAtTime(0.4, now + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

        // Lowpass filter for warmth
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2000;

        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);

        osc.start();
        osc.stop(now + duration);
    }

    playDrum(sound) {
        const now = this.ctx.currentTime;

        switch (sound) {
            case 'kick':
                const kickOsc = this.ctx.createOscillator();
                const kickGain = this.ctx.createGain();
                kickOsc.type = 'sine';
                kickOsc.frequency.setValueAtTime(150, now);
                kickOsc.frequency.exponentialRampToValueAtTime(0.01, now + 0.5);
                kickGain.gain.setValueAtTime(1, now);
                kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                kickOsc.connect(kickGain);
                kickGain.connect(this.masterGain);
                kickOsc.start(now);
                kickOsc.stop(now + 0.5);
                break;

            case 'snare':
                this.playNoise(0.2);
                this.playTone(200, 'triangle', 0.1);
                break;

            case 'hihat':
                this.playNoise(0.05, 1000);
                break;

            case 'tom1':
            case 'tom':
                const t1Osc = this.ctx.createOscillator();
                const t1Gain = this.ctx.createGain();
                t1Osc.type = 'sine';
                t1Osc.frequency.setValueAtTime(200, now);
                t1Osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
                t1Gain.gain.setValueAtTime(1, now);
                t1Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                t1Osc.connect(t1Gain);
                t1Gain.connect(this.masterGain);
                t1Osc.start(now);
                t1Osc.stop(now + 0.3);
                break;

            case 'tom2':
                const t2Osc = this.ctx.createOscillator();
                const t2Gain = this.ctx.createGain();
                t2Osc.type = 'sine';
                t2Osc.frequency.setValueAtTime(150, now);
                t2Osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
                t2Gain.gain.setValueAtTime(1, now);
                t2Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                t2Osc.connect(t2Gain);
                t2Gain.connect(this.masterGain);
                t2Osc.start(now);
                t2Osc.stop(now + 0.3);
                break;

            case 'clap':
                this.playNoise(0.1, 800);
                break;

            case 'crash':
                this.playNoise(1.0, 500); // Longer noise
                break;

            case 'openhat':
                this.playNoise(0.4, 800);
                break;

            case 'ride':
                this.playTone(5000, 'square', 0.1); // Metallic ping
                break;

            case 'cowbell':
                this.playTone(800, 'square', 0.1);
                this.playTone(1200, 'square', 0.1);
                break;
        }
    }

    playNoise(duration, highPassFreq = 0) {
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        let output = noise;

        if (highPassFreq > 0) {
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = highPassFreq;
            noise.connect(filter);
            output = filter;
        }

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        output.connect(gain);
        gain.connect(this.masterGain);
        noise.start();
    }
}
