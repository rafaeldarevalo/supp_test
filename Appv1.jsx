import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { Button } from '@/components/ui/button'; // Assuming these are custom/shadcn components
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'; // Assuming these are custom/shadcn components
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Speaker, BookOpen, Zap, Repeat2, Loader2, MessageSquareText, PlusCircle, Shuffle, Lightbulb, 
    Mic, Download, X, Ear, Radio, Sparkles, AlertTriangle, Image as ImageIcon, Play, Pause, Info, 
    BrainCircuit, Layers, Briefcase, GraduationCap, Type, AudioWaveform, ArrowLeft, Send, CheckCircle, Settings2, UserCheck, Clock,
    FileText, Star, Award, HelpCircle, RefreshCw 
} from 'lucide-react';

// Helper function to apply Tailwind classes
const cn = (...classes) => classes.filter(Boolean).join(' ');

// Define the Noto Sans font family
const notoSans = "'Noto Sans', sans-serif";

// --- UI Placeholder Components ---
const Button = ({ variant, size, className, children, onClick, disabled, "aria-label": ariaLabel }) => {
    const baseStyle = "font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center";
    let variantClasses = "";
    let sizeClasses = "px-4 py-2 rounded-md";

    if (variant === "outline") {
        variantClasses = "border border-gray-600 text-gray-300 hover:bg-gray-700";
    } else if (variant === "ghost") {
        variantClasses = "hover:bg-gray-700/50";
    } else if (variant === "secondary") {
        variantClasses = "bg-gray-600 text-white hover:bg-gray-500";
    } else if (variant === "link") {
        variantClasses = "text-indigo-400 hover:text-indigo-300 p-0"; 
        sizeClasses = ""; 
    } else { 
        variantClasses = "bg-blue-500 text-white hover:bg-blue-600";
    }

    if (size === "icon") {
        sizeClasses = "p-0 w-8 h-8 rounded-full"; 
        if (className && (className.includes('w-') || className.includes('h-'))) {
            // Allow className to override default icon button size
        } else {
            // Apply default icon button size if not specified in className
             sizeClasses = "p-0 w-8 h-8 rounded-full";
        }
    } else if (size === "sm") {
        sizeClasses = "px-3 py-1.5 text-sm rounded-md";
    }


    return (
        <button
            onClick={onClick}
            disabled={disabled}
            aria-label={ariaLabel}
            className={cn(baseStyle, variantClasses, sizeClasses, className)}
        >
            {children}
        </button>
    );
};

const Card = ({ className, children, onClick }) => (
    <div
        className={cn("bg-gray-900/90 border border-gray-800 shadow-xl backdrop-blur-md rounded-lg", onClick ? "cursor-pointer hover:border-purple-500/70" : "", className)}
        onClick={onClick}
    >
        {children}
    </div>
);

const CardHeader = ({ children }) => <div className="p-6 border-b border-gray-700">{children}</div>;
const CardTitle = ({ className, children }) => <h2 className={cn("text-2xl font-bold text-white", className)}>{children}</h2>;
const CardDescription = ({ className, children }) => <p className={cn("text-gray-400", className)}>{children}</p>;
const CardContent = ({ children }) => <div className="p-6">{children}</div>;

// Modified ScrollArea: Removed default maxHeight style
const ScrollArea = ({ className, children }) => (
    <div className={cn("overflow-y-auto", className)}> 
        {children}
    </div>
);
// --- End UI Placeholder Components ---


// API Keys
const GROQ_API_KEYS_ARRAY = [
    "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",
    "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",
    "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",
    "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",
    "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",
];
const GEMINI_API_KEY_CONST = "AIzaSyAaNzF201suAeX3nnPGr3KbvhPH-H_PKIY"; // Replace with your actual Gemini API key
const UNSPLASH_ACCESS_KEY_CONST = "u3Q7e_djtupNgqOyKC03UDWlrhX2knQpBA89uMcLJdw"; // Replace with your actual Unsplash Access Key

// Global constants for the app
const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1']; 

// Helper function to highlight stressed words
const highlightStressedWords = (text, stressedWords) => {
    if (!Array.isArray(stressedWords) || stressedWords.length === 0) {
        return text;
    }

    const words = text.split(/(\s+)/); 
    return words.map((word, index) => {
        const cleanWord = word.replace(/[.,!?]/g, '').toLowerCase();
        if (stressedWords.some(stressed => stressed.toLowerCase() === cleanWord)) {
            return <span key={index} className="font-bold text-yellow-300">{word}</span>;
        }
        return word;
    });
};

// Helper function to render highlighted phrase from LLM (basic sanitizer)
const renderHighlightedPhrase = (highlightedHtml) => {
    if (!highlightedHtml) return null;
    const cleanHtml = highlightedHtml
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") 
        .replace(/<em\b[^>]*>/gi, '<em class="text-red-400 font-bold not-italic">') 
        .replace(/<\/?(?!(em\b|\/em\b))[^>]+>/gi, ''); 
    return <span dangerouslySetInnerHTML={{ __html: cleanHtml }} />;
};


// Archivos de datos
const dataFiles = {
    idioms: {
        title: "Modismos Comunes en Reuniones de Trabajo",
        items: [
            { example: "Let's get the ball rolling.", explanation: "Empecemos la reunión/tarea.", exercise: "Usa 'get the ball rolling' para iniciar una actividad.", ipa: "/lɛts ɡɛt ðə bɔːl ˈroʊlɪŋ/", spanishPronunciation: "letsgetdebolrouling", pronunciationDetails: { stressed: ["get", "ball", "rolling"], contractions: [{ original: "Let us", contracted: "Let's" }], omissions: ["La 't' de 'get' se enlaza con 'the'", "La 'l' de 'ball' se enlaza con 'rolling'"] } },
            { example: "On the same page.", explanation: "Estar de acuerdo o entender la misma información.", exercise: "Pregunta a tu equipo si están 'on the same page'.", ipa: "/ɒn ðə seɪm peɪdʒ/", spanishPronunciation: "ondeiseimpeich", pronunciationDetails: { stressed: ["same", "page"], contractions: [], omissions: ["La 'th' de 'the' se reduce o se omite", "La 'm' de 'same' se enlaza con 'page'"] } },
            { example: "Touch base.", explanation: "Ponerse en contacto brevemente.", exercise: "Propón 'touch base' con un colega.", ipa: "/tʌtʃ beɪs/", spanishPronunciation: "tachbeis", pronunciationDetails: { stressed: ["touch", "base"], contractions: [], omissions: ["La 'ch' de 'touch' se enlaza con 'base'"] } },
            { example: "Back to the drawing board.", explanation: "Volver a empezar desde cero (un plan o idea).", exercise: "Usa 'back to the drawing board' cuando un proyecto no funciona.", ipa: "/bæk tuː ðə ˈdrɔːɪŋ bɔːrd/", spanishPronunciation: "baktuedroingbord", pronunciationDetails: { stressed: ["back", "drawing", "board"], contractions: [], omissions: ["La 'k' de 'back' se enlaza con 'to'", "La 'th' de 'the' se reduce o se omite"] } },
            { example: "Think outside the box.", explanation: "Pensar de forma creativa o no convencional.", exercise: "Anima a tu equipo a 'think outside the box'.", ipa: "/θɪŋk aʊtˈsaɪd ðə bɒks/", spanishPronunciation: "zinkautsaiddeboks", pronunciationDetails: { stressed: ["think", "outside", "box"], contractions: [], omissions: ["La 'k' de 'think' se enlaza con 'outside'", "La 'th' de 'the' se reduce o se omite"] } },
            { example: "Low-hanging fruit.", explanation: "Objetivos fáciles de alcanzar.", exercise: "Identifica el 'low-hanging fruit' en tu lista de tareas.", ipa: "/loʊ ˈhæŋɪŋ fruːt/", spanishPronunciation: "loujangingfrut", pronunciationDetails: { stressed: ["low", "hanging", "fruit"], contractions: [], omissions: ["La 'h' de 'hanging' puede ser suave o casi inaudible"] } },
            { example: "Win-win situation.", explanation: "Situación en la que todos se benefician.", exercise: "Describe una 'win-win situation' en tu trabajo.", ipa: "/wɪn wɪn ˌsɪtʃuˈeɪʃən/", spanishPronunciation: "uin uin sichueishon", pronunciationDetails: { stressed: ["win", "win", "situation"], contractions: [], omissions: [] } },
            { example: "Call it a day.", explanation: "Dar por terminada la jornada de trabajo.", exercise: "Usa 'call it a day' al final de tu jornada.", ipa: "/kɔːl ɪt ə deɪ/", spanishPronunciation: "coliredei", pronunciationDetails: { stressed: ["call", "day"], contractions: [], omissions: ["La 'l' de 'call' se enlaza con 'it'", "La 't' de 'it' se reduce a una 'r' suave (flapped 't') o se omite", "La 'a' de 'a' se reduce"] } },
            { example: "Cut corners.", explanation: "Tomar atajos, hacer algo de la manera más fácil y rápida (a menudo sacrificando calidad).", exercise: "Explica por qué no deberías 'cut corners' en tu trabajo.", ipa: "/kʌt ˈkɔːrnərz/", spanishPronunciation: "catcornars", pronunciationDetails: { stressed: ["cut", "corners"], contractions: [], omissions: ["La 't' de 'cut' puede ser suave o casi inaudible"] } },
            { example: "Bring to the table.", explanation: "Aportar algo valioso (habilidades, ideas) a una discusión o proyecto.", exercise: "Menciona qué puedes 'bring to the table' en un nuevo proyecto.", ipa: "/brɪŋ tuː ðə ˈteɪbl/", spanishPronunciation: "bringtudeteibol", pronunciationDetails: { stressed: ["bring", "table"], contractions: [], omissions: ["La 'g' de 'bring' puede ser suave o casi inaudible", "La 'th' de 'the' se reduce o se omite"] } },
        ],
    },
    phrasalVerbs: {
        title: "Phrasal Verbs Comunes en Reuniones de Trabajo",
        items: [
            { example: "Set up a meeting.", explanation: "Organizar o programar una reunión.", exercise: "Usa 'set up' para una reunión.", ipa: "/sɛt ʌp ə ˈmiːtɪŋ/", spanishPronunciation: "serapemiting", pronunciationDetails: { stressed: ["set", "up", "meeting"], contractions: [], omissions: ["La 't' de 'set' se enlaza con 'up' (flapped 't')", "La 'p' de 'up' se enlaza con 'a'"] } },
            { example: "Follow up on.", explanation: "Dar seguimiento a algo.", exercise: "Usa 'follow up on' para una tarea pendiente.", ipa: "/ˈfɒloʊ ʌp ɒn/", spanishPronunciation: "folouapon", pronunciationDetails: { stressed: ["follow", "up", "on"], contractions: [], omissions: ["La 'w' de 'follow' se enlaza con 'up'", "La 'p' de 'up' se enlaza con 'on'"] } },
        ],
    },
    linkedSounds: {
        title: "Sonidos Conectados Comunes en Reuniones de Trabajo",
        items: [
            { example: "What do you think?", explanation: "¿Qué piensas?", exercise: "Usa 'What do you think?' para pedir una opinión.", ipa: "/wʌdə jə θɪŋk/", spanishPronunciation: "uarechuzink", pronunciationDetails: { stressed: ["What", "think"], contractions: [{ original: "What do you", contracted: "wadayu" }], omissions: ["La 't' de 'what' se enlaza con 'do' (flapped 't')", "La 'd' de 'do' se enlaza con 'you' (sonido 'ch' o 'j')", "La 'y' de 'you' se reduce o se omite"] } },
        ],
    },
};

// Configuración de la aplicación
const appConfig = {
    title: "English Learning App",
    description: "Aprende modismos, phrasal verbs y linked sounds.",
    professionalEnglishSections: [ // Renamed from 'sections' to avoid conflict
        { id: 'idioms', title: 'Idioms', dataKey: 'idioms', icon: BookOpen },
        { id: 'phrasalVerbs', title: 'Phrasal Verbs', dataKey: 'phrasalVerbs', icon: Zap },
        { id: 'linkedSounds', title: 'Linked Sounds', dataKey: 'linkedSounds', icon: Repeat2 },
    ],
};

// Configuración de Groq TTS y STT y Modelos LLM
const GROQ_TTS_MODEL = "playai-tts";
const GROQ_STT_MODEL = "whisper-large-v3";
const GEMINI_MODEL_NAME = "gemini-1.5-flash-latest"; // Used for Gemini

const AVAILABLE_GROQ_LLM_MODELS = [
    { id: "deepseek-r1-distill-llama-70b", name: "DeepSeek/Meta Distill Llama 70b" },
    { id: "llama-3.3-70b-versatile", name: "Meta Llama 3.3 70b Versatile" },
    { id: "qwen-qwq-32b", name: "Alibaba Qwen QWQ 32b" },
    { id: "meta-llama/llama-4-maverick-17b-128e-instruct", name: "Meta Llama 4 Maverick 17b Instruct" },
];
const DEFAULT_GROQ_LLM_MODEL = AVAILABLE_GROQ_LLM_MODELS[0].id; 


const GROQ_VOICES = [
    "Aaliyah-PlayAI", "Adelaide-PlayAI", "Angelo-PlayAI", "Arista-PlayAI", "Atlas-PlayAI",
    "Basil-PlayAI", "Briggs-PlayAI", "Calum-PlayAI", "Celeste-PlayAI", "Cheyenne-PlayAI",
    "Chip-PlayAI", "Cillian-PlayAI", "Deedee-PlayAI", "Eleanor-PlayAI", "Fritz-PlayAI",
    "Gail-PlayAI", "Indigo-PlayAI", "Jennifer-PlayAI", "Judy-PlayAI", "Mamaw-PlayAI",
    "Mason-PlayAI", "Mikail-PlayAI", "Mitch-PlayAI", "Nia-PlayAI", "Quinn-PlayAI",
    "Ruby-PlayAI", "Thunder-PlayAI"
];
const GROQ_TTS_DEFAULT_VOICE = "Fritz-PlayAI";

const groqVoiceGroups = [
    { title: "🎙️ Narration & Storytelling", description: "Perfectas para audiolibros, documentales y contenido extenso con articulación clara y expresión emocional sutil.", voices: [{ name: "Eleanor-PlayAI", description: "Voz cálida, pausada y envolvente." }, { name: "Adelaide-PlayAI", description: "Clara y expresiva, para narración." }, { name: "Fritz-PlayAI", description: "Estándar masculina, versátil." }] },
    { title: "💼 Business & Professional", description: "Ideal para vídeos corporativos, presentaciones, e-learning y materiales de formación que requieren autoridad y claridad.", voices: [{ name: "Mason-PlayAI", description: "Masculina profesional y clara." }, { name: "Jennifer-PlayAI", description: "Femenina autoritaria y profesional." },] },
    { title: "🗣️ Conversational & Casual", description: "Para podcasts, entrevistas y contenido interactivo que necesita fluidez y naturalidad.", voices: [{ name: "Aaliyah-PlayAI", description: "Femenina joven y conversacional." }, { name: "Calum-PlayAI", description: "Masculina amigable y casual." }, { name: "Mitch-PlayAI", description: "Masculina relajada y natural." }] },
    { title: "📢 Advertising & Marketing", description: "Voces energéticas y persuasivas para comerciales, lanzamientos de productos y campañas de marca.", voices: [{ name: "Ruby-PlayAI", description: "Femenina brillante y entusiasta." }, { name: "Briggs-PlayAI", description: "Masculina potente y persuasiva." }, { name: "Cheyenne-PlayAI", description: "Femenina enérgica para anuncios." }] },
    { title: "🎭 Character & Creative", description: "Voces diseñadas para videojuegos, animación y medios creativos con mucha personalidad y rango emocional.", voices: [{ name: "Nia-PlayAI", description: "Versátil, múltiples emociones." }, { name: "Chip-PlayAI", description: "Masculina peculiar para personajes." }, { name: "Angelo-PlayAI", description: "Masculina con rango emocional." }, { name: "Arista-PlayAI", description: "Femenina expresiva creativa." }, { name: "Basil-PlayAI", description: "Masculina distintiva." }, { name: "Celeste-PlayAI", description: "Femenina etérea o de personaje." }, { name: "Cillian-PlayAI", description: "Masculina con carácter." }, { name: "Gail-PlayAI", description: "Femenina madura." }, { name: "Indigo-PlayAI", description: "Andrógina o de personaje único." }, { name: "Judy-PlayAI", description: "Femenina clásica." }, { name: "Mamaw-PlayAI", description: "Personaje mayor o abuela." }, { name: "Mikail-PlayAI", description: "Masculina con toque exótico." }, { name: "Quinn-PlayAI", description: "Juvenil y enérgica." }, { name: "Thunder-PlayAI", description: "Masculina muy profunda." }, { name: "Atlas-PlayAI", description: "Masculina fuerte y autoritaria." }]
    }
];

const processedGroqVoiceGroups = (() => {
    const tempProcessedGroups = groqVoiceGroups.map(group => ({
        ...group,
        voices: group.voices.filter(voice => GROQ_VOICES.includes(voice.name))
    })).filter(group => group.voices.length > 0);
    const categorizedVoiceNames = new Set();
    tempProcessedGroups.forEach(group => { group.voices.forEach(voice => categorizedVoiceNames.add(voice.name)); });
    const uncategorizedVoices = GROQ_VOICES.filter(voiceName => !categorizedVoiceNames.has(voiceName))
        .map(voiceName => ({ name: voiceName, description: voiceName.replace('-PlayAI', '') }));
    if (uncategorizedVoices.length > 0) {
        tempProcessedGroups.push({ title: "🎶 Otras Voces", description: "Voces adicionales disponibles.", voices: uncategorizedVoices });
    }
    return tempProcessedGroups;
})();

// Componente para reproducir audio
const SpeakerButton = ({ text, voiceOption, groqApiKey, groqTtsModel, groqTtsVoice, elementId, onApiError }) => {
    const [playbackState, setPlaybackState] = useState('stopped'); // 'stopped', 'loading', 'playing', 'paused'
    const [speechSynthesisSupported, setSpeechSynthesisSupported] = useState(true);
    const audioRef = useRef(null);
    const audioBlobUrlRef = useRef(null);
    const [ttsError, setTtsError] = useState('');
    const uniqueId = elementId || `speaker-${Math.random().toString(36).substring(7)}`;

    useEffect(() => {
        if (typeof window === 'undefined' || !window.speechSynthesis) {
            setSpeechSynthesisSupported(false);
        }
        return () => {
            // Cleanup logic
            if (voiceOption === 'system' && typeof speechSynthesis !== 'undefined' && speechSynthesis.speaking && audioRef.current && audioRef.current.text === text) {
                speechSynthesis.cancel();
            } else if (audioRef.current instanceof Audio) {
                audioRef.current.pause();
                if (audioBlobUrlRef.current) {
                    URL.revokeObjectURL(audioBlobUrlRef.current);
                    audioBlobUrlRef.current = null;
                }
            }
            audioRef.current = null;
            setPlaybackState('stopped');
        };
    }, [voiceOption, text, groqTtsVoice, uniqueId]);


    const loadAndPlayAudio = async (isRestart = false) => {
        setTtsError('');
        setPlaybackState('loading');

        if (!isRestart) {
            // Stop other audios
            document.querySelectorAll('audio[data-playing="true"]').forEach(audio => {
                if (audio !== audioRef.current) {
                    audio.pause();
                    audio.removeAttribute('data-playing');
                }
            });
            if (typeof speechSynthesis !== 'undefined' && speechSynthesis.speaking) {
                if (!audioRef.current || (audioRef.current && audioRef.current.text !== text)) {
                    speechSynthesis.cancel();
                }
            }
        }

        if (voiceOption === 'system') {
            if (!speechSynthesisSupported) {
                setTtsError("La síntesis de voz del sistema no es compatible.");
                setPlaybackState('stopped'); return;
            }
            if (isRestart && audioRef.current && audioRef.current instanceof SpeechSynthesisUtterance) {
                speechSynthesis.cancel();
                setTimeout(() => { // Ensure cancellation is processed
                    speechSynthesis.speak(audioRef.current);
                    setPlaybackState('playing');
                }, 50);
                return;
            }
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            const voices = speechSynthesis.getVoices();
            utterance.voice = voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) || voices.find(v => v.default && v.lang.startsWith('en')) || voices.find(v => v.lang === 'en-US');
            audioRef.current = utterance;
            utterance.onstart = () => setPlaybackState('playing');
            utterance.onend = () => { setPlaybackState('stopped'); audioRef.current = null; };
            utterance.onpause = () => { if (speechSynthesis.speaking === false && speechSynthesis.paused === true) setPlaybackState('paused'); };
            utterance.onresume = () => setPlaybackState('playing');
            utterance.onerror = (e) => { console.error("Error de síntesis de voz del sistema:", e.error, e); setTtsError(`Error de voz del sistema: ${e.error || 'desconocido'}`); setPlaybackState('stopped'); audioRef.current = null; };
            speechSynthesis.speak(utterance);

        } else if (voiceOption === 'groq' || voiceOption === 'random') {
             if (!groqApiKey) {
                setTtsError("Groq API Key no configurada.");
                setPlaybackState('stopped');
                if(onApiError) onApiError("GroqTTS", "apiKeyConfigError");
                return;
            }
            if (isRestart && audioBlobUrlRef.current) {
                if (audioRef.current instanceof Audio) { audioRef.current.pause(); }
                const newAudio = new Audio(audioBlobUrlRef.current);
                audioRef.current = newAudio; newAudio.setAttribute('data-playing', 'true');
                newAudio.play().catch(e => { console.error("Error al reiniciar audio de Groq:", e); setTtsError("No se pudo reiniciar el audio."); setPlaybackState('stopped'); });
                newAudio.onplay = () => setPlaybackState('playing');
                newAudio.onpause = () => { if (!newAudio.ended) setPlaybackState('paused'); };
                newAudio.onended = () => { setPlaybackState('stopped'); newAudio.removeAttribute('data-playing'); };
                newAudio.onerror = (e) => { console.error("Error de reproducción (reinicio):", e); setTtsError("Error al reproducir (reinicio)."); setPlaybackState('stopped'); newAudio.removeAttribute('data-playing'); };
                return;
            }
            try {
                const response = await fetch('https://api.groq.com/openai/v1/audio/speech', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqApiKey}` },
                    body: JSON.stringify({ model: groqTtsModel, voice: groqTtsVoice, input: text, response_format: "wav" })
                });
                if (!response.ok) {
                    const errorStatus = response.status;
                    const errorText = await response.text();
                    console.error(`Groq TTS Error (${errorStatus}):`, errorText);
                    let displayErrorMessage = `Error de Groq TTS (${errorStatus}).`;
                    let extractedRetryTime = null;

                    try { 
                        const errorData = JSON.parse(errorText);
                        if (errorData.error && errorData.error.message) {
                            const match = errorData.error.message.match(/Please try again in (.*?)\./);
                            if (match && match[1]) extractedRetryTime = match[1];
                        }
                    } catch (e) { 
                        const match = errorText.match(/Please try again in (.*?)\./);
                        if (match && match[1]) extractedRetryTime = match[1];
                    }

                    if (errorStatus === 429) { // Rate limit
                        const retryMsgPart = extractedRetryTime ? `Por favor, intenta de nuevo en ${extractedRetryTime}.` : "Por favor, inténtalo más tarde.";
                        setTtsError(retryMsgPart);
                        if(onApiError) onApiError("GroqTTS", "rateLimit", extractedRetryTime);
                    } else if (errorStatus === 401) { // Unauthorized
                        setTtsError("Error de autenticación con Groq TTS. Verifica la API Key.");
                         if(onApiError) onApiError("GroqTTS", "authError");
                    }
                    else {
                        setTtsError(displayErrorMessage.substring(0,100)); 
                        if(onApiError) onApiError("GroqTTS", "otherError", `Status ${errorStatus}`);
                    }
                    setPlaybackState('stopped');
                    return;
                }
                const blob = await response.blob();
                if (audioBlobUrlRef.current) { URL.revokeObjectURL(audioBlobUrlRef.current); }
                audioBlobUrlRef.current = URL.createObjectURL(blob);

                const newAudio = new Audio(audioBlobUrlRef.current);
                audioRef.current = newAudio; newAudio.setAttribute('data-playing', 'true');
                newAudio.oncanplaythrough = () => newAudio.play().catch(e => { console.error("Error al reproducir audio de Groq:", e); setTtsError("No se pudo reproducir el audio."); setPlaybackState('stopped'); });
                newAudio.onplay = () => setPlaybackState('playing');
                newAudio.onpause = () => { if (!newAudio.ended) setPlaybackState('paused'); };
                newAudio.onended = () => { setPlaybackState('stopped'); newAudio.removeAttribute('data-playing'); };
                newAudio.onerror = (e) => { console.error("Error de reproducción de audio (Groq TTS):", e); setTtsError("Error al reproducir el audio de Groq TTS."); setPlaybackState('stopped'); newAudio.removeAttribute('data-playing'); };
            } catch (error) {
                console.error("Error al conectar con Groq TTS:", error);
                if (error.name === 'TypeError' && error.message.toLowerCase().includes("failed to fetch")) {
                    setTtsError("Error de red/CORS con Groq TTS. Intenta con la voz del sistema.");
                    if(onApiError) onApiError("GroqTTS", "networkError"); 
                } else if (!ttsError) { 
                     setTtsError(error.message?.includes("Límite de API") ? error.message : "Error al conectar con Groq TTS.");
                }
                setPlaybackState('stopped');
            }
        }
    };

    const handlePlayPause = () => {
        if (playbackState === 'playing') {
            if (voiceOption === 'system' && typeof speechSynthesis !== 'undefined' && speechSynthesis.speaking) {
                speechSynthesis.pause();
            } else if (audioRef.current instanceof Audio) {
                audioRef.current.pause();
            }
        } else if (playbackState === 'paused') {
            if (voiceOption === 'system' && typeof speechSynthesis !== 'undefined' && speechSynthesis.paused) {
                speechSynthesis.resume();
                setPlaybackState('playing');
            } else if (audioRef.current instanceof Audio) {
                audioRef.current.play().catch(e => { console.error("Error al reanudar audio:", e); setTtsError("No se pudo reanudar el audio."); setPlaybackState('stopped'); });
            }
        } else { 
            loadAndPlayAudio();
        }
    };

    const handleRestart = () => { loadAndPlayAudio(true); };

    const handleDownload = () => {
        if (audioBlobUrlRef.current && (voiceOption === 'groq' || voiceOption === 'random')) {
            const link = document.createElement('a');
            link.href = audioBlobUrlRef.current;
            const filename = `${text.substring(0, 20).replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${groqTtsVoice}.wav`;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            setTtsError("Audio no disponible para descarga.");
        }
    };


    let PlayPauseIcon = Play;
    if (playbackState === 'loading') PlayPauseIcon = Loader2;
    else if (playbackState === 'playing') PlayPauseIcon = Pause;

    return (
        <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handlePlayPause} disabled={playbackState === 'loading'} 
                className={cn(
                    "rounded-full text-white", 
                    playbackState === 'playing' ? "hover:text-gray-200" : "hover:text-gray-200"
                )} 
                aria-label={playbackState === 'playing' ? "Pausar" : "Reproducir"} >
                <PlayPauseIcon 
                    className={cn("w-5 h-5", playbackState === 'loading' && "animate-spin")} 
                    strokeWidth={2} 
                />
            </Button>
            {(playbackState !== 'stopped' && playbackState !== 'loading') && (
                <Button variant="ghost" size="icon" onClick={handleRestart} className="rounded-full text-white hover:text-gray-200" aria-label="Comenzar de nuevo" >
                    <Repeat2 className="w-5 h-5" strokeWidth={2} />
                </Button>
            )}
            {(voiceOption === 'groq' || voiceOption === 'random') && audioBlobUrlRef.current && playbackState !== 'loading' && (
                 <Button variant="ghost" size="icon" onClick={handleDownload} className="rounded-full text-white hover:text-gray-200" aria-label="Descargar audio">
                    <Download className="w-5 h-5" strokeWidth={2} />
                </Button>
            )}
            {ttsError && (<span className="text-red-400 text-xs ml-1 truncate max-w-[100px]">{ttsError}</span>)}
        </div>
    );
};

const LearningItem = ({ item, voiceOption, groqApiKey, geminiApiKey, selectedLlmProvider, selectedGroqLlmModel, groqTtsModel, groqTtsVoice, groqVoicesList, onApiError }) => {
    const [showExplanation, setShowExplanation] = useState(false);
    const [showExercise, setShowExercise] = useState(false);
    const [userAnswer, setUserAnswer] = useState('');
    const [aiFeedback, setAiFeedback] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showConversation, setShowConversation] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);
    const [currentChatMessage, setCurrentChatMessage] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);

    const [showPronunciationPractice, setShowPronunciationPractice] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const [recordedAudioURL, setRecordedAudioURL] = useState(null);
    const [isAssessingPronunciation, setIsAssessingPronunciation] = useState(false);
    const [pronunciationAnalysis, setPronunciationAnalysis] = useState(null);
    const [micError, setMicError] = useState('');

    const [unsplashImage, setUnsplashImage] = useState(null);
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [imageError, setImageError] = useState('');

    const [showMoreExplanation, setShowMoreExplanation] = useState(false);
    const [moreExplanation, setMoreExplanation] = useState('');
    const [isMoreExplanationLoading, setIsMoreExplanationLoading] = useState(false);
    const [moreExplanationError, setMoreExplanationError] = useState('');


    const chatEndRef = useRef(null);
    const [randomVoiceForThisItem, setRandomVoiceForThisItem] = useState(null);

    useEffect(() => {
        const fetchImage = async () => {
            if (!item.example || !UNSPLASH_ACCESS_KEY_CONST) {
                 if (!UNSPLASH_ACCESS_KEY_CONST) setImageError('Unsplash API Key no configurada.');
                return;
            }
            setIsImageLoading(true); setImageError(''); setUnsplashImage(null);
            let query = item.example;
            const keywords = ["ball rolling", "drawing board", "outside the box", "low-hanging fruit", "win-win", "call it a day", "set up meeting", "follow up", "bring up point", "touch base"];
            const foundKeyword = keywords.find(k => item.example.toLowerCase().includes(k));
            if (foundKeyword) query = foundKeyword;

            try {
                const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&client_id=${UNSPLASH_ACCESS_KEY_CONST}`);
                if (!response.ok) { throw new Error(`Error de Unsplash: ${response.status} ${response.statusText}`); }
                const data = await response.json();
                if (data.results && data.results.length > 0) { setUnsplashImage(data.results[0]); }
                else { setImageError('No se encontró imagen para esta frase.'); }
            } catch (error) { console.error("Error fetching image from Unsplash:", error); setImageError(`Error al cargar imagen: ${error.message}`);
            } finally { setIsImageLoading(false); }
        };
        if (item.example) fetchImage();
    }, [item.example]);


    useEffect(() => {
        if (voiceOption === 'random' && groqVoicesList?.length > 0) {
            if (!randomVoiceForThisItem || randomVoiceForThisItem.item !== item.example) {
                const randomIndex = Math.floor(Math.random() * groqVoicesList.length);
                setRandomVoiceForThisItem({ voice: groqVoicesList[randomIndex], item: item.example });
            }
        } else { setRandomVoiceForThisItem(null); }
    }, [voiceOption, item.example, groqVoicesList, randomVoiceForThisItem]);

    useEffect(() => { if (chatEndRef.current) { chatEndRef.current.scrollIntoView({ behavior: 'smooth' }); } }, [chatHistory]);

    const handleCheckExercise = async () => {
        setIsLoading(true); setAiFeedback('');
        const prompt = `Eres un tutor de inglés. El usuario ha recibido el siguiente ejercicio: "${item.exercise}". Su respuesta es: "${userAnswer}". Por favor, evalúa su respuesta. Proporciona comentarios constructivos, señala cualquier error y confirma si su respuesta es correcta. Mantén tu respuesta concisa y útil para un estudiante de inglés. Intenta usar algunos emoticonos relevantes y amigables en tu respuesta para que sea más cercana 😊 (por ejemplo: 👍, 🤔, 🎉, 💡).`;

        try {
            let responseData;
            if (selectedLlmProvider === 'gemini') {
                if (!geminiApiKey) { setAiFeedback("Gemini API Key no configurada."); setIsLoading(false); return; }
                const payload = { contents: [{ parts: [{ text: prompt }] }] };
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_NAME}:generateContent?key=${geminiApiKey}`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error?.message || `Error de Gemini (${response.status})`);
                responseData = result.candidates?.[0]?.content?.parts?.[0]?.text;
            } else { // groq
                if (!groqApiKey) { setAiFeedback("Groq API Key no configurada."); setIsLoading(false); if(onApiError) onApiError("GroqLLM", "apiKeyConfigError"); return; }
                const payload = { model: selectedGroqLlmModel, messages: [{ role: "user", content: prompt }] };
                const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqApiKey}` }, body: JSON.stringify(payload)
                });
                if (!response.ok) {
                    const errorResult = await response.json().catch(() => ({})); 
                    if (response.status === 429) onApiError("GroqLLM", "rateLimit");
                    else if (response.status === 401) onApiError("GroqLLM", "authError");
                    throw new Error(errorResult.error?.message || `Error de Groq (${response.status})`);
                }
                const result = await response.json();
                responseData = result.choices?.[0]?.message?.content;
            }

            if (responseData) { setAiFeedback(responseData); }
            else { setAiFeedback("Error al obtener la retroalimentación de la IA."); }

        } catch (error) {
            console.error(`Error calling ${selectedLlmProvider} API for exercise check:`, error);
            let userFriendlyError = `Error al conectar con ${selectedLlmProvider === 'gemini' ? 'Gemini' : 'Groq'}.`;
            if (error.name === 'TypeError' && error.message.toLowerCase().includes("failed to fetch")) {
                userFriendlyError = `Error de red/CORS con ${selectedLlmProvider === 'gemini' ? 'Gemini' : 'Groq'}. Intenta con otro proveedor o revisa tu conexión/clave API.`;
                if (selectedLlmProvider === 'groq') onApiError("GroqLLM", "networkError");
            } else {
                userFriendlyError += ` ${error.message}`;
            }
            setAiFeedback(userFriendlyError);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearExercise = () => { setUserAnswer(''); setAiFeedback(''); setIsLoading(false); };

    const handleSendChatMessage = async () => {
        if (!currentChatMessage.trim()) return;
        const newUserMessage = { role: "user", content: currentChatMessage };
        const updatedChatHistory = [...chatHistory, newUserMessage];
        setChatHistory(updatedChatHistory);
        setCurrentChatMessage('');
        setIsChatLoading(true);

        const basePrompt = `Eres un hablante nativo de inglés y un tutor paciente. Estamos practicando la frase/modismo/phrasal verb: '${item.example}'. Tu objetivo es mantener una conversación natural con el usuario, animándolo a usar esta frase. Después de cada respuesta del usuario, evalúa si usó la frase '${item.example}' de manera natural y correcta en el contexto. Si la usó, dale un breve refuerzo positivo. Si no la usó o la usó incorrectamente, ofrécele una sugerencia sutil o un ejemplo de cómo podría haberla usado. No reveles que eres una IA. Mantén tus respuestas concisas y conversacionales. Intenta usar algunos emoticonos relevantes y amigables en tu respuesta para que sea más cercana, por ejemplo 👍, 😉, 🤔, etc.`;
        
        try {
            let aiResponseContent;
            if (selectedLlmProvider === 'gemini') {
                if (!geminiApiKey) { setChatHistory(prev => [...prev, { role: "assistant", content: "Gemini API Key no configurada." }]); setIsChatLoading(false); return; }
                const geminiMessages = updatedChatHistory.map(msg => ({
                    role: msg.role === "user" ? "user" : "model", 
                    parts: [{text: msg.content}]
                }));
                const systemPromptForGemini = { role: "user", parts: [{text: basePrompt + "\n\nInicia la conversación o responde al último mensaje del usuario."}]};
                const finalGeminiContents = geminiMessages.length === 1 ? [systemPromptForGemini, geminiMessages[0]] : [systemPromptForGemini, ...geminiMessages];

                const payload = { contents: finalGeminiContents };
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_NAME}:generateContent?key=${geminiApiKey}`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
                });
                const result = await response.json();
                if (!response.ok) {
                    console.error("Gemini API Error Full Response:", result);
                    throw new Error(result.error?.message || `Error de Gemini (${response.status})`);
                }
                aiResponseContent = result.candidates?.[0]?.content?.parts?.[0]?.text;
            } else { // groq
                if (!groqApiKey) { setChatHistory(prev => [...prev, { role: "assistant", content: "Groq API Key no configurada." }]); setIsChatLoading(false); if(onApiError) onApiError("GroqLLM", "apiKeyConfigError"); return; }
                const messagesForGroq = [
                    {role: "system", content: basePrompt},
                    ...updatedChatHistory.map(msg => ({ role: msg.role, content: msg.content }))
                ];

                const payload = { model: selectedGroqLlmModel, messages: messagesForGroq };
                const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqApiKey}` }, body: JSON.stringify(payload)
                });
                const result = await response.json();
                 if (!response.ok) {
                    console.error("Groq API Error Full Response:", result);
                    if (response.status === 429) onApiError("GroqLLM", "rateLimit");
                    else if (response.status === 401) onApiError("GroqLLM", "authError");
                    throw new Error(result.error?.message || `Error de Groq (${response.status})`);
                }
                aiResponseContent = result.choices?.[0]?.message?.content;
            }

            if (aiResponseContent) {
                setChatHistory(prev => [...prev, { role: "assistant", content: aiResponseContent }]);
            } else {
                setChatHistory(prev => [...prev, { role: "assistant", content: "Lo siento, no pude generar una respuesta." }]);
            }
        } catch (error) {
            console.error(`Error during chat with ${selectedLlmProvider}:`, error);
            let userFriendlyError = `Hubo un error al conectar con ${selectedLlmProvider === 'gemini' ? 'Gemini' : 'Groq'}.`;
             if (error.name === 'TypeError' && error.message.toLowerCase().includes("failed to fetch")) {
                userFriendlyError = `Error de red/CORS al conectar con ${selectedLlmProvider === 'gemini' ? 'Gemini' : 'Groq'}. Intenta con otro proveedor o revisa tu conexión/clave API.`;
                if (selectedLlmProvider === 'groq') onApiError("GroqLLM", "networkError");
            } else {
                userFriendlyError += ` ${error.message}`;
            }
            setChatHistory(prev => [...prev, { role: "assistant", content: userFriendlyError }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleToggleRecording = async () => {
        setMicError(''); setPronunciationAnalysis(null); setRecordedAudioURL(null);
        if (isRecording) {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") { mediaRecorderRef.current.stop(); }
            setIsRecording(false);
        } else {
            try {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { setMicError("La API de MediaDevices no es compatible con este navegador."); return; }
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorderRef.current = new MediaRecorder(stream); audioChunksRef.current = [];
                mediaRecorderRef.current.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
                mediaRecorderRef.current.onstop = async () => {
                    if (audioChunksRef.current.length === 0) { console.warn("No se grabaron datos de audio."); setMicError("No se grabó audio. Intenta de nuevo."); setIsAssessingPronunciation(false); return; }
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                    const audioUrl = URL.createObjectURL(audioBlob); setRecordedAudioURL(audioUrl);
                    await assessPronunciationFromAudio(audioBlob);
                    stream.getTracks().forEach(track => track.stop()); // Release microphone
                };
                mediaRecorderRef.current.start(); setIsRecording(true);
            } catch (err) {
                console.error("Error al acceder al micrófono:", err);
                setMicError(`Error de micrófono: ${err.name === 'NotAllowedError' ? 'Permiso denegado.' : err.message}. Asegúrate de haber otorgado permiso.`);
                setIsRecording(false);
            }
        }
    };

    const assessPronunciationFromAudio = async (audioBlob) => {
        if (!groqApiKey) {
            setPronunciationAnalysis({ accuracyScore: 0, feedbackText: "Groq API Key no configurada para transcripción.", highlightedPhrase: item.example });
            setIsAssessingPronunciation(false);
             if(onApiError) onApiError("GroqSTT", "apiKeyConfigError");
            return;
        }
        if (!audioBlob || audioBlob.size === 0) { setMicError("No se pudo procesar el audio grabado (vacío)."); setIsAssessingPronunciation(false); return; }
        setIsAssessingPronunciation(true); setPronunciationAnalysis(null);
        try {
            const formData = new FormData(); formData.append('file', audioBlob, "recording.wav"); formData.append('model', GROQ_STT_MODEL); formData.append('language', 'en');
            const sttResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', { method: 'POST', headers: { 'Authorization': `Bearer ${groqApiKey}` }, body: formData });
            if (!sttResponse.ok) { 
                const errorData = await sttResponse.json().catch(() => ({ error: { message: sttResponse.statusText } })); 
                console.error("Error de Groq STT:", errorData); 
                if (sttResponse.status === 401) {
                    onApiError("GroqSTT", "authError");
                    throw new Error("Error de autenticación con Groq STT. Verifica la API Key.");
                } else if (sttResponse.status === 429) {
                     onApiError("GroqSTT", "rateLimit");
                     throw new Error("Límite de API alcanzado con Groq STT.");
                }
                throw new Error(`Error en STT: ${errorData.error?.message || sttResponse.statusText}`); 
            }
            const sttResult = await sttResponse.json(); const userTranscription = sttResult.text;

            if (!userTranscription || userTranscription.trim() === "") {
                setPronunciationAnalysis({ accuracyScore: 0, feedbackText: "No se pudo transcribir tu audio. Intenta hablar más claro o verifica tu micrófono.", highlightedPhrase: item.example });
                setIsAssessingPronunciation(false); return;
            }

            const prompt = `Eres un profesor de inglés especializado en fonética para hablantes de español. La frase objetivo que el usuario intentó pronunciar es: "${item.example}". La transcripción fonética (IPA) de la frase objetivo es: "${item.ipa || 'N/A'}". La transcripción del audio del usuario es: "${userTranscription}". Por favor, analiza la pronunciación del usuario. Proporciona una respuesta en formato JSON con los siguientes campos: "accuracyScore" (entero 0-100), "feedbackText" (comentarios constructivos), "highlightedPhrase" (frase objetivo con palabras problemáticas envueltas en <em></em>). Ejemplo JSON: { "accuracyScore": 75, "feedbackText": "Buen intento. 'think' sonó como 'sink'.", "highlightedPhrase": "<em>think</em> outside <em>the</em> box" }`;
            
            let analysisContent;
            if (selectedLlmProvider === 'gemini') {
                if (!geminiApiKey) { setPronunciationAnalysis({ accuracyScore: 0, feedbackText: "Gemini API Key no configurada para análisis.", highlightedPhrase: item.example }); setIsAssessingPronunciation(false); return; }
                const payload = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } };
                const llmResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_NAME}:generateContent?key=${geminiApiKey}`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
                });
                const result = await llmResponse.json();
                if (!llmResponse.ok) throw new Error(result.error?.message || `Error de Gemini (${llmResponse.status})`);
                analysisContent = result.candidates?.[0]?.content?.parts?.[0]?.text;
            } else { // groq
                if (!groqApiKey) { setPronunciationAnalysis({ accuracyScore: 0, feedbackText: "Groq API Key no configurada para análisis.", highlightedPhrase: item.example }); setIsAssessingPronunciation(false); if(onApiError) onApiError("GroqLLM", "apiKeyConfigError"); return; }
                const payload = { model: selectedGroqLlmModel, messages: [{ role: "user", content: prompt }], temperature: 0.2, response_format: { type: "json_object" } };
                const llmResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqApiKey}` }, body: JSON.stringify(payload)
                });
                const result = await llmResponse.json();
                if (!llmResponse.ok) {
                    if (llmResponse.status === 429) onApiError("GroqLLM", "rateLimit");
                     else if (llmResponse.status === 401) onApiError("GroqLLM", "authError");
                    throw new Error(result.error?.message || `Error de Groq (${llmResponse.status})`);
                }
                analysisContent = result.choices?.[0]?.message?.content;
            }

            if (analysisContent) {
                try {
                    const parsedAnalysis = JSON.parse(analysisContent);
                    setPronunciationAnalysis(parsedAnalysis);
                } catch (parseError) {
                    console.error(`Error al parsear JSON del LLM (${selectedLlmProvider}):`, parseError, analysisContent);
                    setPronunciationAnalysis({ accuracyScore: 0, feedbackText: "Error al procesar respuesta de IA.", highlightedPhrase: item.example });
                }
            } else {
                 setPronunciationAnalysis({ accuracyScore: 0, feedbackText: "No se recibió contenido del análisis de la IA.", highlightedPhrase: item.example });
            }

        } catch (error) {
            console.error(`Error en la evaluación de pronunciación con ${selectedLlmProvider}:`, error);
            let userFriendlyError = `Error: ${error.message}.`;
            if (error.name === 'TypeError' && error.message.toLowerCase().includes("failed to fetch")) {
                userFriendlyError = `Error de red/CORS al contactar el servicio de análisis. Intenta con otro proveedor o revisa tu conexión/clave API.`;
                 if (selectedLlmProvider === 'groq') onApiError("GroqLLM", "networkError");
            }
            setPronunciationAnalysis({ accuracyScore: 0, feedbackText: userFriendlyError, highlightedPhrase: item.example });
        }
        finally { setIsAssessingPronunciation(false); audioChunksRef.current = []; }
    };

    const handleExplainMore = async () => {
        if (showMoreExplanation && moreExplanation) {
            setShowMoreExplanation(false);
            return;
        }
        
        setShowMoreExplanation(true);
        setIsMoreExplanationLoading(true);
        setMoreExplanationError('');
        setMoreExplanation('');

        const prompt = `Eres un profesor de inglés experto y amigable. Explica en detalle la frase/modismo en inglés: "${item.example}".
        Proporciona la siguiente información de forma clara y concisa para un estudiante de inglés hispanohablante:
        1.  **Significado Principal:** Explica el significado de la frase de manera sencilla.
        2.  **Origen/Etimología (Opcional):** Si es breve, interesante y conocido, menciona su origen. Si no, omite esta parte.
        3.  **Ejemplos Adicionales (2-3):** Proporciona al menos dos ejemplos más de cómo se usa la frase en diferentes contextos (ej. formal, informal, pregunta, afirmación, en el trabajo, con amigos).
        4.  **Sinónimos o Alternativas:** Menciona 1 o 2 sinónimos comunes o formas alternativas de expresar la misma idea.
        5.  **Consejos de Uso/Errores Comunes:** Da algún consejo práctico para usarla correctamente o menciona errores comunes que los estudiantes (especialmente hispanohablantes) podrían cometer.
        Formatea tu respuesta usando Markdown para una buena legibilidad (por ejemplo, usando **negritas** para los títulos de cada sección y listas para los ejemplos o consejos). Intenta usar algunos emoticonos relevantes y amigables en tu respuesta para que sea más cercana 👍.`;

        try {
            let explanationText;
            if (selectedLlmProvider === 'gemini') {
                if (!geminiApiKey) { setMoreExplanationError("Gemini API Key no configurada."); setIsMoreExplanationLoading(false); return; }
                const payload = { contents: [{ parts: [{ text: prompt }] }] };
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_NAME}:generateContent?key=${geminiApiKey}`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error?.message || `Error de Gemini (${response.status})`);
                explanationText = result.candidates?.[0]?.content?.parts?.[0]?.text;
            } else { // groq
                if (!groqApiKey) { setMoreExplanationError("Groq API Key no configurada."); setIsMoreExplanationLoading(false); if(onApiError) onApiError("GroqLLM", "apiKeyConfigError"); return; }
                const payload = { model: selectedGroqLlmModel, messages: [{ role: "user", content: prompt }] };
                const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqApiKey}` }, body: JSON.stringify(payload)
                });
                const result = await response.json();
                if (!response.ok) {
                     if (response.status === 429) onApiError("GroqLLM", "rateLimit");
                     else if (response.status === 401) onApiError("GroqLLM", "authError");
                    throw new Error(result.error?.message || `Error de Groq (${response.status})`);
                }
                explanationText = result.choices?.[0]?.message?.content;
            }

            if (explanationText) {
                setMoreExplanation(explanationText);
            } else {
                setMoreExplanationError("No se pudo obtener una explicación de la IA en este momento.");
            }
        } catch (error) {
            console.error(`Error al llamar a ${selectedLlmProvider} para explicación:`, error);
            let userFriendlyError = `Error al conectar con ${selectedLlmProvider === 'gemini' ? 'Gemini' : 'Groq'}.`;
            if (error.name === 'TypeError' && error.message.toLowerCase().includes("failed to fetch")) {
                userFriendlyError = `Error de red/CORS al conectar con ${selectedLlmProvider === 'gemini' ? 'Gemini' : 'Groq'}. Intenta con otro proveedor o revisa tu conexión/clave API.`;
                 if (selectedLlmProvider === 'groq') onApiError("GroqLLM", "networkError");
            } else {
                userFriendlyError += ` ${error.message}`;
            }
            setMoreExplanationError(userFriendlyError);
        } finally {
            setIsMoreExplanationLoading(false);
        }
    };


    const currentGroqVoice = voiceOption === 'random' && randomVoiceForThisItem ? randomVoiceForThisItem.voice : groqTtsVoice;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <p className="text-lg font-semibold text-white" style={{ fontFamily: notoSans }}>
                        Ejemplo: "{highlightStressedWords(item.example, item.pronunciationDetails?.stressed)}"
                    </p>
                    <SpeakerButton
                        text={item.example}
                        voiceOption={voiceOption}
                        groqApiKey={groqApiKey}
                        groqTtsModel={groqTtsModel}
                        groqTtsVoice={currentGroqVoice}
                        elementId={`example-${item.example?.replace(/\s/g, '') || Math.random()}`}
                        onApiError={onApiError}
                    />
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowExplanation(!showExplanation)} className={cn("text-gray-300 hover:text-white hover:bg-gray-700", "border-gray-700", showExplanation ? "bg-gray-700 border-green-500 text-green-400" : "bg-gray-800")}>{showExplanation ? 'Ocultar Explicación' : 'Mostrar Explicación'}</Button>
            </div>

            <AnimatePresence>
                {isImageLoading && ( <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center items-center h-48 bg-gray-800/30 rounded-lg my-3"> <Loader2 className="w-8 h-8 text-white animate-spin" strokeWidth={1.5} /> </motion.div> )}
                {imageError && !isImageLoading && ( <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col justify-center items-center h-48 bg-red-900/20 text-red-400 rounded-lg my-3 p-4 text-center"> <AlertTriangle className="w-8 h-8 mb-2 text-white" strokeWidth={1.5}/> <span>{imageError}</span> </motion.div> )}
                {unsplashImage && !isImageLoading && !imageError && (
                    <motion.div initial={{ opacity: 0, y:10 }} animate={{ opacity: 1, y:0 }} exit={{ opacity: 0 }} className="my-3 p-2 bg-gray-800/30 rounded-lg shadow-md">
                        <img src={unsplashImage.urls.regular} alt={unsplashImage.alt_description || `Imagen relacionada con ${item.example}`} className="w-full h-auto max-h-72 object-contain rounded-md" onError={(e) => { e.target.style.display='none'; setImageError('Error al cargar la imagen de Unsplash.')}} />
                        <p className="text-xs text-gray-500 mt-1 text-right px-1"> Foto por <a href={`${unsplashImage.user.links.html}?utm_source=english_learning_app&utm_medium=referral`} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-400">{unsplashImage.user.name}</a> en <a href="https://unsplash.com/?utm_source=english_learning_app&utm_medium=referral" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-400">Unsplash</a></p>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showExplanation && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                        <p className="text-gray-300 mb-2" style={{ fontFamily: notoSans }}><span className="font-medium text-gray-200">Explicación:</span> {item.explanation}</p>
                        {item.ipa && <p className="text-gray-300 mb-2" style={{ fontFamily: notoSans }}><span className="font-medium text-gray-200">IPA:</span> {item.ipa}</p>}
                        {item.spanishPronunciation && <p className="text-gray-300 mb-2" style={{ fontFamily: notoSans }}><span className="font-medium text-gray-200">Pronunciación (Español):</span> {item.spanishPronunciation}</p>}
                        {item.pronunciationDetails && (
                            <div className="mt-4 pt-4 border-t border-gray-700">
                                <h4 className="font-semibold text-white mb-2" style={{ fontFamily: notoSans }}>Detalles de Pronunciación Nativa:</h4>
                                {item.pronunciationDetails.stressed?.length > 0 && <p className="text-gray-300 mb-1" style={{ fontFamily: notoSans }}><span className="font-medium text-gray-200">Acentuación:</span> Las palabras clave suelen ser: <span className="font-bold text-yellow-300">{item.pronunciationDetails.stressed.join(', ')}</span>.</p>}
                                {item.pronunciationDetails.contractions?.length > 0 && <div className="text-gray-300 mb-1" style={{ fontFamily: notoSans }}><span className="font-medium text-gray-200">Contracciones/Reducciones:</span><ul className="list-disc list-inside ml-4">{item.pronunciationDetails.contractions.map((c, i) => (<li key={i}>{c.original} se reduce a "{c.contracted}"</li>))}</ul></div>}
                                {item.pronunciationDetails.omissions?.length > 0 && <div className="text-gray-300" style={{ fontFamily: notoSans }}><span className="font-medium text-gray-200">Omisiones/Enlaces:</span><ul className="list-disc list-inside ml-4">{item.pronunciationDetails.omissions.map((o, i) => (<li key={i}>{o}</li>))}</ul></div>}
                                {(!item.pronunciationDetails.stressed?.length && !item.pronunciationDetails.contractions?.length && !item.pronunciationDetails.omissions?.length) && <p className="text-gray-400 italic" style={{ fontFamily: notoSans }}>No hay detalles de pronunciación nativa específicos para este ejemplo.</p>}
                            </div>
                        )}
                         <Button
                            variant="link"
                            onClick={handleExplainMore}
                            className="text-indigo-400 hover:text-indigo-300 p-0 mt-3 flex items-center gap-1"
                            disabled={isMoreExplanationLoading}
                        >
                            {isMoreExplanationLoading ? <Loader2 className="w-4 h-4 animate-spin text-white" strokeWidth={1.5}/> : <Sparkles className="w-4 h-4 text-white" strokeWidth={1.5}/>}
                            {showMoreExplanation ? 'Ocultar Explicación Detallada' : `Explícame Más con ${selectedLlmProvider === 'gemini' ? 'Gemini' : 'Groq'} ✨`}
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
             {/* More Explanation Section */}
             <AnimatePresence>
                {showMoreExplanation && showExplanation && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-indigo-900/30 p-4 rounded-lg border border-indigo-700 mt-2"
                    >
                        {isMoreExplanationLoading && (
                            <div className="flex items-center justify-center p-4">
                                <Loader2 className="w-6 h-6 text-white animate-spin" strokeWidth={1.5}/>
                                <span className="ml-2 text-indigo-300">Cargando explicación detallada...</span>
                            </div>
                        )}
                        {moreExplanationError && !isMoreExplanationLoading && (
                            <p className="text-red-400 text-sm">{moreExplanationError}</p>
                        )}
                        {moreExplanation && !isMoreExplanationLoading && !moreExplanationError && (
                            <div className="prose prose-sm prose-invert max-w-none text-gray-200" style={{ fontFamily: notoSans }}>
                                <ReactMarkdownWithTailwind markdown={moreExplanation} />
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>


            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-700">
                {item.example && <Button variant="secondary" size="sm" onClick={() => setShowConversation(!showConversation)} className={cn("bg-blue-700 hover:bg-blue-600 text-white flex items-center gap-1", showConversation ? "border border-blue-400" : "")}><MessageSquareText className="w-4 h-4" strokeWidth={1.5}/>Conversar ✨</Button>}
                {item.example && item.ipa &&
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {setShowPronunciationPractice(!showPronunciationPractice); setPronunciationAnalysis(null); setRecordedAudioURL(null); setMicError('');}}
                        className={cn("bg-teal-700 hover:bg-teal-600 text-white flex items-center gap-1", showPronunciationPractice ? "border border-teal-400" : "")}>
                        <Mic className="w-4 h-4" strokeWidth={1.5}/>Práctica Oral ✨
                    </Button>
                }
                {item.exercise && <Button variant="secondary" size="sm" onClick={() => setShowExercise(!showExercise)} className={cn("bg-purple-700 hover:bg-purple-600 text-white flex items-center gap-1", showExercise ? "border border-purple-400" : "")}><Lightbulb className="w-4 h-4" strokeWidth={1.5}/>Ejercicio</Button>}
            </div>

            <AnimatePresence>
                {showPronunciationPractice && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="bg-gray-800/50 p-4 rounded-lg border border-teal-700 space-y-4 mt-4">
                        <h4 className="font-semibold text-white mb-2" style={{ fontFamily: notoSans }}>Práctica Oral: "{item.example}"</h4>
                        <p className="text-gray-300 text-sm" style={{ fontFamily: notoSans }}>Graba tu voz pronunciando la frase. La IA evaluará tu pronunciación.</p>
                        {micError && <p className="text-red-400 text-sm bg-red-900/30 p-2 rounded-md">{micError}</p>}
                        <div className="flex items-center gap-4">
                            <Button onClick={handleToggleRecording} disabled={isAssessingPronunciation} className={cn("px-4 py-2 rounded-md font-semibold flex items-center gap-2 text-white", isRecording ? "bg-red-600 hover:bg-red-700" : "bg-teal-600 hover:bg-teal-700")}>
                                {isRecording ? <Radio className="w-5 h-5 animate-pulse" strokeWidth={1.5}/> : <Mic className="w-5 h-5" strokeWidth={1.5}/>}
                                {isRecording ? 'Detener Grabación' : (recordedAudioURL ? 'Grabar de Nuevo' : 'Iniciar Grabación')}
                            </Button>
                            {isAssessingPronunciation && <Loader2 className="w-6 h-6 animate-spin text-white" strokeWidth={1.5}/>}
                        </div>
                        {recordedAudioURL && !isAssessingPronunciation && (
                            <div className="mt-3">
                                <p className="text-sm text-gray-400 mb-1">Tu grabación:</p>
                                <audio src={recordedAudioURL} controls className="w-full h-10"/>
                            </div>
                        )}
                        {pronunciationAnalysis && !isAssessingPronunciation && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="bg-gray-700 p-4 rounded-lg border border-gray-600 mt-4 space-y-3">
                                <h5 className="font-semibold text-white">Resultado del Análisis:</h5>
                                <div className="flex items-center gap-2">
                                    <span className={cn("text-2xl font-bold", pronunciationAnalysis.accuracyScore >= 75 ? "text-green-400" : pronunciationAnalysis.accuracyScore >= 50 ? "text-yellow-400" : "text-red-400")}>
                                        {pronunciationAnalysis.accuracyScore}%
                                    </span>
                                    <span className="text-gray-300">de Precisión Estimada</span>
                                </div>
                                {pronunciationAnalysis.highlightedPhrase && <div>
                                    <p className="text-gray-300 font-medium mb-1">Frase con resaltado (estimado):</p>
                                    <p className="text-lg text-white p-2 bg-gray-800 rounded-md">{renderHighlightedPhrase(pronunciationAnalysis.highlightedPhrase)}</p>
                                </div>}
                                <div>
                                    <p className="text-gray-300 font-medium mb-1">Comentarios de la IA:</p>
                                    <p className="text-gray-200 text-sm whitespace-pre-wrap" style={{ fontFamily: notoSans }}>{pronunciationAnalysis.feedbackText}</p>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showConversation && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="bg-gray-800/50 p-4 rounded-lg border border-blue-700 space-y-4 mt-4">
                        <h4 className="font-semibold text-white mb-2" style={{ fontFamily: notoSans }}>Conversación con IA sobre "{item.example}"</h4>
                        <ScrollArea className="h-48 max-h-48 pr-4">
                            <div className="space-y-3">
                                {chatHistory.length === 0 && <p className="text-gray-400 italic">Inicia la conversación. Intenta usar "{item.example}" en tu respuesta.</p>}
                                {chatHistory.map((msg, idx) => (
                                    <div key={idx} className={cn( "p-2 rounded-lg flex items-start gap-2", msg.role === "user" ? "bg-blue-800/30 text-blue-200 ml-auto text-right flex-row-reverse max-w-[80%]" : "bg-gray-700/30 text-gray-200 mr-auto text-left max-w-[80%]" )}>
                                        <div className="flex-grow">
                                            <span className="font-bold">{msg.role === "user" ? "Tú" : "IA Tutor"}</span>: {msg.content}
                                        </div>
                                        {msg.role === "assistant" && (
                                            <SpeakerButton
                                                text={msg.content}
                                                voiceOption={voiceOption}
                                                groqApiKey={groqApiKey}
                                                groqTtsModel={GROQ_TTS_MODEL}
                                                groqTtsVoice={currentGroqVoice}
                                                elementId={`chat-${idx}-${item.example?.replace(/\s/g, '') || Math.random()}`}
                                                onApiError={onApiError}
                                            />
                                        )}
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>
                        </ScrollArea>
                        <div className="flex gap-2 mt-4">
                            <textarea className="flex-grow p-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" rows="2" placeholder="Escribe tu mensaje..." value={currentChatMessage} onChange={(e) => setCurrentChatMessage(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChatMessage(); } }} style={{ fontFamily: notoSans }} disabled={isChatLoading} />
                            <Button onClick={handleSendChatMessage} disabled={isChatLoading || !currentChatMessage.trim()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md flex items-center gap-2">{isChatLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" strokeWidth={1.5}/>}Enviar</Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>{showExercise && (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="bg-gray-800/50 p-4 rounded-lg border border-purple-700 space-y-4 mt-4"><p className="text-gray-300" style={{ fontFamily: notoSans }}><span className="font-medium text-gray-200">Ejercicio:</span> {item.exercise}</p><textarea className="w-full p-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" rows="3" placeholder="Escribe tu respuesta aquí..." value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} style={{ fontFamily: notoSans }} /><div className="flex gap-2"><Button onClick={handleCheckExercise} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md flex items-center gap-2">{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" strokeWidth={1.5}/>}{isLoading ? 'Comprobando...' : 'Comprobar Ejercicio'}</Button><Button variant="outline" onClick={handleClearExercise} disabled={isLoading} className="bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600 font-bold py-2 px-4 rounded-md">Limpiar</Button></div>{aiFeedback && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="bg-gray-700 p-4 rounded-lg border border-gray-600 mt-4 flex items-start gap-3"><MessageSquareText className="w-5 h-5 text-white mt-1" strokeWidth={1.5}/><p className="text-gray-200" style={{ fontFamily: notoSans }}><span className="font-medium text-purple-300">IA Tutor:</span> {aiFeedback}</p></motion.div>}</motion.div>)}</AnimatePresence>
        </motion.div>
    );
};

// Componente ReactMarkdown simple para renderizar Markdown
const ReactMarkdownWithTailwind = ({ markdown }) => {
    if (!markdown) return null;

    // Enhanced Markdown to HTML conversion
    let html = markdown
        // Headers
        .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-indigo-200 mt-3 mb-1" style="font-family: ' + notoSans + ';">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-indigo-100 mt-4 mb-2" style="font-family: ' + notoSans + ';">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-indigo-100 mt-4 mb-2" style="font-family: ' + notoSans + ';">$1</h1>')
        // Bold and Italic
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-indigo-100">$1</strong>') // Bold
        .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>') // Italic
        // Unordered lists
        .replace(/^- (.*$)/gim, '<li class="ml-5 list-disc text-gray-300" style={{ fontFamily: ' + notoSans + ';">$1</li>')
        // Paragraphs (handle newlines better)
        .replace(/\n\n/g, '</p><p class="text-gray-300 mb-2" style="font-family: ' + notoSans + ';">') // Double newline for new paragraph
        .replace(/\n/g, '<br />'); // Single newline for line break within paragraph

    // Wrap in a starting paragraph if not already
    if (!html.startsWith('<p') && !html.startsWith('<h')) {
        html = '<p class="text-gray-300 mb-2" style="font-family: ' + notoSans + ';">' + html;
    }
    // Close any open paragraph at the end
    if (!html.endsWith('</p>') && !html.endsWith('</h3>') && !html.endsWith('</h2>') && !html.endsWith('</h1>') && !html.endsWith('</li>')) {
        html += '</p>';
    }
    // Consolidate list items into <ul>
    html = html.replace(/(<li class="ml-5 list-disc text-gray-300".*?<\/li>)(?!<li)/gs, (match) => `<ul>${match}</ul>`);
    html = html.replace(/<\/ul><br \/><ul>/g, '</ul><ul>'); // Fix multiple ul tags
    html = html.replace(/<\/p><br \/><ul>/g, '</p><ul>'); // Fix p before ul
    html = html.replace(/<\/ul><br \/><p/g, '</ul><p'); // Fix ul before p

    return <div dangerouslySetInnerHTML={{ __html: html }} />;
};


const LearningSection = ({ section, data, voiceOption, groqApiKey, geminiApiKey, selectedLlmProvider, selectedGroqLlmModel, groqTtsModel, groqTtsVoice, groqVoicesList, onApiError }) => {
    const [generatedExamples, setGeneratedExamples] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationError, setGenerationError] = useState('');

    const handleGenerateNewExample = async () => {
        setIsGenerating(true); setGenerationError('');

        const typeOfPhrase = section.title.toLowerCase().includes("idiom") ? "idiom" :
                             section.title.toLowerCase().includes("phrasal verb") ? "phrasal verb" :
                             "connected speech example";

        let contextSpecificInstructions = "";
        if (section.id === 'idioms') {
            contextSpecificInstructions = "Enfócate en modismos útiles en el contexto de desarrollo web, diseño UX/UI, Figma, metodologías ágiles (scrum, kanban), reuniones de equipo de desarrollo, presentaciones de diseño, o feedback de código.";
        }

        const currentStaticExamples = dataFiles[section.dataKey]?.items.map(item => item.example) || [];
        const currentGeneratedExamplesText = generatedExamples.map(item => item.example);
        const allExistingExamples = [...currentStaticExamples, ...currentGeneratedExamplesText];
        const existingExamplesPrompt = allExistingExamples.length > 0 ? `Por favor, NO generes los siguientes ejemplos que ya existen: ${allExistingExamples.join(", ")}.` : "";

        let finalPrompt;
        let payload;
        let apiUrl;
        let headers;

        if (selectedLlmProvider === 'gemini') {
            if (!geminiApiKey) { setGenerationError("Gemini API Key no configurada."); setIsGenerating(false); return; }
            const geminiPromptStructure = `Eres un experto en fonética y pronunciación del inglés para hispanohablantes.
Genera UN NUEVO Y ÚNICO ejemplo de "${typeOfPhrase}" en inglés, relevante para reuniones de trabajo o entornos profesionales.
${contextSpecificInstructions}
${existingExamplesPrompt}
Proporciona la siguiente información estrictamente en formato JSON. El JSON debe ser un objeto único y no un array. No incluyas saltos de línea ni markdown DENTRO de los valores del JSON.
Claves requeridas:
- "example": (string) La frase o expresión en inglés.
- "explanation": (string) Una explicación clara en español.
- "exercise": (string) Un ejercicio práctico en español para el usuario.
- "ipa": (string) La transcripción fonética IPA.
- "spanishPronunciation": (string) Una aproximación fonética en español que refleje fielmente la pronunciación nativa, con palabras unidas y reducciones, SIN espacios entre las palabras que se unen. (Ej: "güenaisiyuaguén" para "When I see you again").
- "pronunciationDetails": (object) Un objeto con:
    - "stressed": (array de strings) Palabras acentuadas.
    - "contractions": (array de objects) Cada objeto con "original": (string) y "contracted": (string).
    - "omissions": (array de strings) Descripciones de sonidos/enlaces.
Asegúrate de que "spanishPronunciation" sea compacta y que el ejemplo sea realmente NUEVO y no uno de los ya listados si se proporcionó una lista.`;
            finalPrompt = geminiPromptStructure;
            payload = { contents: [{ parts: [{ text: finalPrompt }] }], generationConfig: { responseMimeType: "application/json" } };
            apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_NAME}:generateContent?key=${geminiApiKey}`;
            headers = { 'Content-Type': 'application/json' };
        } else { // groq
            if (!groqApiKey) { setGenerationError("Groq API Key no configurada."); setIsGenerating(false); if(onApiError) onApiError("GroqLLM", "apiKeyConfigError"); return; }
             const groqSpecificPrompt = `Tu tarea principal es generar un objeto JSON y nada más. No incluyas ningún texto, explicación o markdown fuera del objeto JSON.
El objeto JSON debe representar un ejemplo de aprendizaje de inglés y tener EXACTAMENTE las siguientes claves con los tipos de datos especificados:
"example": (string), "explanation": (string en español), "exercise": (string en español), "ipa": (string), "spanishPronunciation": (string), "pronunciationDetails": (object con sub-claves: "stressed" (array de strings), "contractions" (array de objetos, cada uno con "original" (string) y "contracted": (string)), y "omissions" (array de strings)).

Información para el contenido del JSON:
- Tipo de frase a generar: "${typeOfPhrase}"
${section.id === 'idioms' ? `- Contexto específico para modismos: "${contextSpecificInstructions}"` : ''}
- Ejemplos que YA EXISTEN y DEBES EVITAR: ${allExistingExamples.length > 0 ? `"${allExistingExamples.join("\", \"")}"` : '"Ninguno"'}
- El ejemplo generado debe ser NUEVO y ÚNICO.
- La "spanishPronunciation" debe ser compacta y útil para hispanohablantes.

Genera ahora el objeto JSON:`;
            finalPrompt = groqSpecificPrompt;
            payload = { model: selectedGroqLlmModel, messages: [{ role: "user", content: finalPrompt }], temperature: 0.3, response_format: { type: "json_object" } };
            apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
            headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqApiKey}` };
        }

        try {
            const response = await fetch(apiUrl, { method: 'POST', headers: headers, body: JSON.stringify(payload) });
            const result = await response.json(); // Attempt to parse JSON regardless of response.ok for error details

            if (!response.ok) {
                let errorMsg = `Error de ${selectedLlmProvider === 'gemini' ? 'Gemini' : 'Groq'} (${response.status})`;
                 if (result.error && result.error.message) {
                    errorMsg += `: ${result.error.message}`;
                } else if (typeof result === 'string') { 
                    errorMsg += `: ${result}`;
                } else if (result.message) { // Some APIs might put error message in result.message
                    errorMsg += `: ${result.message}`;
                }
                
                if (selectedLlmProvider === 'groq') {
                    if (response.status === 429) onApiError("GroqLLM", "rateLimit");
                    else if (response.status === 401) onApiError("GroqLLM", "authError");
                    else if (result.error?.type === 'failed_generation') {
                         console.error("Groq failed_generation details:", result.error);
                         errorMsg = `Groq falló al generar JSON. Modelo: ${selectedGroqLlmModel}. Detalles: ${result.error.message || 'Sin detalles adicionales.'}`;
                    }
                }
                throw new Error(errorMsg);
            }
            
            let responseText = selectedLlmProvider === 'gemini' ? result.candidates?.[0]?.content?.parts?.[0]?.text : result.choices?.[0]?.message?.content;

            if (responseText) {
                let jsonString = responseText;
                let parsedExample;
                try {
                    parsedExample = JSON.parse(jsonString);
                } catch (initialParseError) {
                    console.warn(`Direct JSON.parse failed for ${selectedLlmProvider}: ${initialParseError.message}. Raw text:`, responseText, "Attempting to extract from markdown.");
                    const jsonMatch = jsonString.match(/```json\s*([\s\S]*?)\s*```/s); // Added /s for multiline match
                    if (jsonMatch && jsonMatch[1]) {
                        jsonString = jsonMatch[1].trim();
                        try {
                            parsedExample = JSON.parse(jsonString);
                        } catch (e2) {
                            setGenerationError(`Error al procesar JSON extraído de ${selectedLlmProvider}.`);
                            console.error("JSON parsing error after extraction:", e2, "Extracted string:", jsonString, "Original response:", responseText);
                            setIsGenerating(false); return;
                        }
                    } else {
                        setGenerationError(`Respuesta de ${selectedLlmProvider} no es JSON válido y no se pudo extraer.`);
                        console.error("Failed to parse directly and no JSON markdown block found. Raw response:", responseText);
                        setIsGenerating(false); return;
                    }
                }
                
                if (parsedExample && parsedExample.example && parsedExample.explanation) {
                    const newExampleText = parsedExample.example.toLowerCase().trim();
                    const isDuplicate = allExistingExamples.some(ex => ex.toLowerCase().trim() === newExampleText);
                    if (isDuplicate) {
                        setGenerationError("La IA generó un ejemplo que ya existe. Por favor, intenta de nuevo para obtener uno diferente.");
                    } else {
                        setGeneratedExamples(prev => [...prev, parsedExample]);
                    }
                } else {
                    setGenerationError(`La IA (${selectedLlmProvider}) no devolvió un formato de ejemplo válido (faltan campos después del parseo).`);
                    console.error("AI returned invalid example format (missing fields after parsing):", parsedExample, "Original responseText:", responseText);
                }
            } else { 
                setGenerationError(`No se pudo generar un nuevo ejemplo en este momento. Respuesta vacía de la IA (${selectedLlmProvider}).`); 
            }
        } catch (error) { 
            console.error(`Error al llamar a ${selectedLlmProvider} para nuevo ejemplo:`, error); 
            let userFriendlyError = `Error al conectar con ${selectedLlmProvider === 'gemini' ? 'Gemini' : 'Groq'}.`;
            if (error.name === 'TypeError' && error.message.toLowerCase().includes("failed to fetch")) {
                 userFriendlyError = `Error de red/CORS al conectar con ${selectedLlmProvider === 'gemini' ? 'Gemini' : 'Groq'}. Intenta con otro proveedor o revisa tu conexión/clave API.`;
                 if(selectedLlmProvider === 'groq') onApiError("GroqLLM", "networkError");
            } else {
                 userFriendlyError += ` ${error.message}`;
            }
            setGenerationError(userFriendlyError); 
        }
        finally { setIsGenerating(false); }
    };


    return (
        <motion.section initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3"><section.icon className="w-6 h-6 text-white" strokeWidth={1.5} /><h2 className="text-2xl font-bold text-white" style={{ fontFamily: notoSans }}>{section.title}</h2></div>
                <Button onClick={handleGenerateNewExample} disabled={isGenerating} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md flex items-center gap-2">{isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" strokeWidth={1.5}/>}{isGenerating ? 'Generando...' : (<>Generar Nuevo Ejemplo <Sparkles className="ml-2 h-4 w-4 text-yellow-300" strokeWidth={1.5}/> </>)}</Button>
            </div>
            {generationError && <div className="bg-red-800/50 text-red-300 p-3 rounded-md border border-red-700" style={{ fontFamily: notoSans }}>Error: {generationError}</div>}
            <ScrollArea className="w-full rounded-md pr-4"> {/* Removed fixed height classes */}
                <div className="space-y-6">
                    <AnimatePresence>
                        {data.items.map((item, index) => (<LearningItem key={`static-${section.id}-${index}`} item={item} voiceOption={voiceOption} groqApiKey={groqApiKey} geminiApiKey={geminiApiKey} selectedLlmProvider={selectedLlmProvider} selectedGroqLlmModel={selectedGroqLlmModel} groqTtsModel={groqTtsModel} groqTtsVoice={groqTtsVoice} groqVoicesList={groqVoicesList} onApiError={onApiError} />))}
                        {generatedExamples.map((item, index) => (<LearningItem key={`generated-${section.id}-${index}-${item.example.replace(/\s/g, "")}`} item={item} voiceOption={voiceOption} groqApiKey={groqApiKey} geminiApiKey={geminiApiKey} selectedLlmProvider={selectedLlmProvider} selectedGroqLlmModel={selectedGroqLlmModel} groqTtsModel={groqTtsModel} groqTtsVoice={groqTtsVoice} groqVoicesList={groqVoicesList} onApiError={onApiError} />))}
                    </AnimatePresence>
                </div>
            </ScrollArea>
        </motion.section>
    );
};

const VoiceSelectionModal = ({ isOpen, onClose, voiceOption, setVoiceOption, selectedGroqVoice, setSelectedGroqVoice }) => {
    if (!isOpen) return null;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25 }} className="bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-lg border border-gray-700" onClick={(e) => e.stopPropagation()} style={{ fontFamily: notoSans }}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-white">Selección de Voz para Lectura</h2>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:text-gray-300"><X className="w-5 h-5" strokeWidth={1.5}/></Button>
                </div>
                <ScrollArea className="max-h-[70vh] pr-3">
                    <div className="space-y-4">
                        <Button variant={voiceOption === 'system' ? 'default' : 'outline'} onClick={() => { setVoiceOption('system'); onClose(); }} className={cn("w-full justify-start px-4 py-3 rounded-lg text-md font-semibold", voiceOption === 'system' ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white border border-gray-600")}>Voz del Sistema</Button>
                        <div>
                            <Button variant={voiceOption === 'groq' ? 'default' : 'outline'} onClick={() => setVoiceOption(voiceOption === 'groq' ? '' : 'groq')} className={cn("w-full justify-start px-4 py-3 rounded-lg text-md font-semibold mb-2", voiceOption === 'groq' ? "bg-purple-500 text-white hover:bg-purple-600" : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white border border-gray-600")}>Voz de Groq (Neural)</Button>
                            {voiceOption === 'groq' && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="pl-1 space-y-3">
                                    {processedGroqVoiceGroups.map((group) => (
                                        <div key={group.title} className="py-2">
                                            <h3 className="text-lg font-semibold text-purple-300 mb-1">{group.title}</h3>
                                            <p className="text-sm text-gray-400 mb-2">{group.description}</p>
                                            <div className="space-y-1">
                                                {group.voices.map((voice) => (
                                                    <Button key={voice.name} variant={selectedGroqVoice === voice.name ? 'secondary' : 'ghost'} onClick={() => { setSelectedGroqVoice(voice.name); setVoiceOption('groq'); onClose(); }} className={cn("w-full justify-start px-3 py-2 rounded-md text-sm text-left", selectedGroqVoice === voice.name ? "bg-purple-600 text-white font-semibold" : "text-gray-300 hover:bg-gray-700 hover:text-white")}>
                                                        <div className="flex flex-col items-start">
                                                            <span>{voice.name.replace('-PlayAI', '')}</span>
                                                            <span className="text-xs text-gray-400">{voice.description}</span>
                                                        </div>
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </div>
                        <Button variant={voiceOption === 'random' ? 'default' : 'outline'} onClick={() => { setVoiceOption('random'); onClose(); }} className={cn("w-full justify-start px-4 py-3 rounded-lg text-md font-semibold flex items-center gap-2", voiceOption === 'random' ? "bg-green-500 text-white hover:bg-green-600" : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white border border-gray-600")}><Shuffle className="w-5 h-5 text-white" strokeWidth={1.5}/>Voz Aleatoria (Groq)</Button>
                    </div>
                </ScrollArea>
            </motion.div>
        </motion.div>
    );
};

// Componente para la vista del Dashboard
const DashboardView = ({ onSelectSection }) => {
    const dashboardSections = [
        { id: 'generalCourse', title: '📚 Curso General', description: 'Aprende por nivel: A1, A2, B1, B2, C1.', icon: GraduationCap, targetView: 'generalCourseOnboarding' }, 
        { id: 'professionalEnglish', title: '💼 Inglés Profesional', description: 'Modismos, Phrasal Verbs, Sonidos Conectados.', icon: Briefcase, targetView: 'professionalEnglish' },
        { id: 'fundamentals', title: '🔤 Fundamentos', description: 'Alfabeto, Vocabulario Básico, Verbos.', icon: Type, targetView: 'fundamentals' },
        { id: 'pronunciation', title: '🎙 Pronunciación', description: 'TTS, STT, Evaluación, Descarga Audio.', icon: AudioWaveform, targetView: 'pronunciationPractice' },
        { id: 'aiPractice', title: '🧠 IA & Práctica', description: 'Chat IA, Generación de ejemplos, Repetición.', icon: Sparkles, targetView: 'aiPractice' },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8 text-center">
            <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400" style={{ fontFamily: notoSans }}>
                {appConfig.title}
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="text-gray-300 text-xl" style={{ fontFamily: notoSans }}>
                Selecciona el área en la que deseas estudiar:
            </motion.p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
                {dashboardSections.map((section) => {
                    const IconComponent = section.icon;
                    return (
                        <motion.div
                            key={section.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: Math.random() * 0.5 }}
                            whileHover={{ scale: 1.05, boxShadow: "0px 0px 15px rgba(168, 85, 247, 0.5)" }} 
                            className="bg-gray-800/70 p-6 rounded-xl border border-gray-700 shadow-lg cursor-pointer flex flex-col items-center text-center"
                            onClick={() => onSelectSection(section.targetView)}
                        >
                            <IconComponent className="w-12 h-12 text-purple-400 mb-4" strokeWidth={1.5} />
                            <h3 className="text-xl font-semibold text-white mb-2" style={{ fontFamily: notoSans }}>{section.title}</h3>
                            <p className="text-gray-400 text-sm" style={{ fontFamily: notoSans }}>{section.description}</p>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

// --- Onboarding Components ---
const OnboardingWelcomeStep = ({ onStart }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        exit={{ opacity: 0, y: -20 }}
        className="flex flex-col items-center justify-center text-center text-white p-8 min-h-[calc(100vh-200px)]" 
    >
        <Sparkles className="w-24 h-24 text-yellow-400 mb-8" strokeWidth={1}/>
        <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: notoSans }}>¡Hola!</h2>
        <p className="text-xl text-gray-300 mb-10" style={{ fontFamily: notoSans }}>
            Soy tu asistente de aprendizaje de inglés. ¿Listo para comenzar tu aventura? 🚀
        </p>
        <Button onClick={onStart} className="bg-green-500 hover:bg-green-600 text-white text-lg px-8 py-3">
            Comenzar
        </Button>
    </motion.div>
);

// Function to fetch image from Unsplash
const fetchUnsplashImage = async (keyword) => {
    if (!UNSPLASH_ACCESS_KEY_CONST) {
        console.warn("Unsplash API Key not configured.");
        return null;
    }
    try {
        const response = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(keyword)}&per_page=1&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY_CONST}`
        );
        if (!response.ok) {
            console.error(`Unsplash API error: ${response.status} ${response.statusText}`);
            return null;
        }
        const data = await response.json();
        return data.results?.[0]?.urls?.regular || null;
    } catch (error) {
        console.error("Error fetching image from Unsplash:", error);
        return null;
    }
};


const OnboardingChatStep = ({ onComplete, selectedLlmProvider, groqApiKey, geminiApiKey, selectedGroqLlmModel, onApiError }) => {
    const [chatMessages, setChatMessages] = useState([]);
    const [currentQuestionId, setCurrentQuestionId] = useState('levelTest'); 
    const [userInput, setUserInput] = useState('');
    const [isAiTyping, setIsAiTyping] = useState(false);
    const [userData, setUserData] = useState({ level: null, goal: null, time: null, testResults: [] });
    const chatContainerRef = useRef(null);
    const messageIdCounter = useRef(0); 
    const [usedQuestionIds, setUsedQuestionIds] = useState([]); 

    // Test-specific state
    const [isLevelTestActive, setIsLevelTestActive] = useState(false);
    const [currentTestQuestion, setCurrentTestQuestion] = useState(null); 
    const [testAnswers, setTestAnswers] = useState([]); 
    const [levelTestStage, setLevelTestStage] = useState('not_started');
    
    const QUESTIONS_PER_LEVEL = 5;
    const MAX_CONSECUTIVE_ERRORS_TO_STOP_TEST = 3; 
    const [currentTestLevelIndex, setCurrentTestLevelIndex] = useState(0);
    const [questionsAnsweredThisLevel, setQuestionsAnsweredThisLevel] = useState(0);
    const [consecutiveErrors, setConsecutiveErrors] = useState(0); 
    const MAX_GENERATION_ATTEMPTS = 3; 

    const BANNED_WORDS_FOR_QUESTIONS = [ 
        'favorite', 'like', 'love', 'enjoy', 'prefer', 
        'hobby', 'feel', 'think', 'opinion', 
        ' you ', ' your ', ' i ', ' me ', ' my ' 
    ];
    

    const onboardingQuestions = [
        { id: 'levelTest', text: `¿Te gustaría realizar una prueba de nivel completa para personalizar tu aprendizaje, o prefieres indicar tu nivel manualmente? 🤔 (La prueba consta de hasta ${LEVEL_ORDER.length * QUESTIONS_PER_LEVEL} preguntas, ${QUESTIONS_PER_LEVEL} por cada nivel desde A1 hasta C1. Se detendrá antes si se detectan ${MAX_CONSECUTIVE_ERRORS_TO_STOP_TEST} errores consecutivos).`, options: [{label:"Sí, hagamos la prueba completa", value: "test"}, {label:"Indicaré mi nivel manualmente", value: "manual"}] },
        { 
            id: 'levelManual', 
            text: "¡Entendido! Por favor, selecciona tu nivel actual de inglés:", 
            options: LEVEL_ORDER.map(level => ({ label: level, value: level })), 
            key: 'level' 
        },
        { id: 'manualLevelChoice', text: "Por favor, selecciona tu nivel actual:", options: LEVEL_ORDER.map(level => ({ label: level, value: level })), key: 'level' }, 
        { id: 'goal', text: "¿Cuál es tu objetivo principal al aprender inglés? 🎯", options: [{label:"Negocios 💼", value: "business"}, {label:"Viajes ✈️", value: "travel"}, {label:"Cultura general 🌍", value: "culture"}, {label:"Otro (especificar)", value: "other_goal"}] , key: 'goal'},
        { id: 'goalOther', text: "Interesante. ¿Podrías especificar cuál es ese otro objetivo?", inputType: 'text', key: 'goal' }, 
        { id: 'time', text: "¿Cuánto tiempo puedes dedicar al aprendizaje cada día? ⏱️", options: [{label:"15 minutos", value: "15min"}, {label:"30 minutos", value: "30min"}, {label:"1 hora", value: "1hr"}, {label:"Más de 1 hora", value: "plus1hr"}], key: 'time' },
    ];

    // Helper Callbacks (fewest internal dependencies first)
    const addMessage = useCallback((sender, text, options = null, questionIdForOptions = null, imageDetails = null) => {
        const newId = messageIdCounter.current++; 
        setChatMessages(prev => [...prev, { sender, text, options, id: newId, questionIdForOptions, imageDetails }]);
    }, []); 
    
    const callLlmApi = useCallback(async (prompt, isJsonExpected = false) => {
        let apiKeyToUse = selectedLlmProvider === 'gemini' ? geminiApiKey : groqApiKey;
        let apiUrl = selectedLlmProvider === 'gemini' ? 
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_NAME}:generateContent?key=${apiKeyToUse}` :
            'https://api.groq.com/openai/v1/chat/completions';

        let payload;
        if (selectedLlmProvider === 'gemini') {
            payload = { contents: [{ parts: [{ text: prompt }] }] };
            if (isJsonExpected) {
                payload.generationConfig = { responseMimeType: "application/json" };
            }
        } else { // groq
            payload = { model: selectedGroqLlmModel, messages: [{ role: "user", content: prompt }], temperature: 0.5 };
            if (isJsonExpected) {
                payload.response_format = { type: "json_object" };
            }
        }
        
        const headers = selectedLlmProvider === 'gemini' ? 
            { 'Content-Type': 'application/json' } :
            { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKeyToUse}` };

        const response = await fetch(apiUrl, { method: 'POST', headers, body: JSON.stringify(payload) });
        const result = await response.json();

        if (!response.ok) {
            let errorMsg = `Error de ${selectedLlmProvider} (${response.status})`;
            if (result.error && result.error.message) errorMsg += `: ${result.error.message}`;
            if (selectedLlmProvider === 'groq') {
                if (response.status === 429) onApiError("GroqLLM_Chat", "rateLimit");
                else if (response.status === 401) onApiError("GroqLLM_Chat", "authError");
            }
            throw new Error(errorMsg);
        }
        return selectedLlmProvider === 'gemini' ? result.candidates?.[0]?.content?.parts?.[0]?.text : result.choices?.[0]?.message?.content;
    }, [selectedLlmProvider, geminiApiKey, groqApiKey, selectedGroqLlmModel, onApiError]);

    const finishOnboarding = useCallback((finalUserData) => {
        setIsAiTyping(true);
        setTimeout(() => {
            addMessage('ai', "¡Perfecto! Gracias por toda la información. 👍 Con esto, puedo preparar un plan de estudio inicial para ti.");
            setIsAiTyping(false);
            setTimeout(() => {
                onComplete(finalUserData); 
            }, 1500);
        }, 1200);
    }, [addMessage, onComplete]);

    const suggestLevelBasedOnTest = useCallback(async () => {
        setLevelTestStage('suggestingLevel');
        setIsAiTyping(true);
        
        const performanceByLevel = LEVEL_ORDER.map(level => {
            const questionsForLevel = testAnswers.filter(a => a.level === level);
            const correctAnswers = questionsForLevel.filter(a => a.isCorrect).length;
            return { level, total: questionsForLevel.length, correct: correctAnswers };
        });

        const overallCorrect = testAnswers.filter(a => a.isCorrect).length;
        const overallTotal = testAnswers.length;

        const prompt = `El usuario ha completado una prueba de nivel.
        Desglose de rendimiento por nivel:
        ${performanceByLevel.map(p => `- Nivel ${p.level}: ${p.correct} de ${p.total} correctas.`).join("\n")}
        Rendimiento General: ${overallCorrect} de ${overallTotal} correctas.
        Errores consecutivos antes de detener (si aplica): ${consecutiveErrors}.

        Basado en este rendimiento detallado, sugiere un nivel de inglés inicial (A1, A2, B1, B2, C1) para este usuario.
        Considera lo siguiente:
        - Si el usuario tuvo un buen desempeño (ej. >= 60-70%) en un nivel, ese podría ser su nivel o podría estar listo para el siguiente.
        - Si el desempeño fue bajo en un nivel, el nivel anterior (o ese mismo nivel si es A1) es más apropiado.
        - Si la prueba se detuvo por ${MAX_CONSECUTIVE_ERRORS_TO_STOP_TEST} errores consecutivos en el nivel ${LEVEL_ORDER[currentTestLevelIndex]}, sugiere el nivel ${LEVEL_ORDER[Math.max(0, currentTestLevelIndex -1)]} o ${LEVEL_ORDER[currentTestLevelIndex]} si ya era A1.
        - Sé conservador. Es mejor empezar un poco por debajo y construir confianza.

        Luego, ofrece un mensaje amigable confirmando el nivel sugerido y preguntando si está de acuerdo o prefiere elegir otro.
        Devuelve un objeto JSON con: "suggestedLevel" (string, ej: "B1") y "confirmationMessage" (string, ej: "¡Excelente trabajo en la prueba! Basado en tus respuestas, creo que el nivel B1 sería un buen punto de partida para ti. ¿Qué te parece? 😊").`;
        
        try {
            const responseText = await callLlmApi(prompt, true);
            const suggestion = JSON.parse(responseText);
            
            const updatedUserData = { ...userData, level: suggestion.suggestedLevel, testResults: testAnswers };
            setUserData(updatedUserData);

            addMessage('ai', suggestion.confirmationMessage, [{label: "Sí, suena bien 👍", value: "confirm_level"}, {label: "Quiero elegir otro nivel", value: "manual_level_choice"}], 'levelSuggestion');
            setCurrentQuestionId('levelSuggestion');
        } catch (error) {
            console.error("Error sugiriendo nivel:", error);
            addMessage('ai', "No pude determinar un nivel automáticamente con tus resultados. ¿Podrías indicarme tu nivel actual? (Ej: A1, A2, B1)");
            setCurrentQuestionId('levelManual'); 
            const manualQ = onboardingQuestions.find(q => q.id === 'levelManual');
            if (manualQ) addMessage('ai', manualQ.text, manualQ.options, manualQ.id);

            const updatedUserDataOnError = { ...userData, level: null, testResults: testAnswers };
            setUserData(updatedUserDataOnError);
        } finally {
            setIsAiTyping(false);
            setIsLevelTestActive(false); 
            setLevelTestStage('completed');
        }
    }, [addMessage, callLlmApi, testAnswers, userData, setUserData, setCurrentQuestionId, setIsLevelTestActive, setLevelTestStage, onboardingQuestions, setIsAiTyping, consecutiveErrors, currentTestLevelIndex, LEVEL_ORDER, MAX_CONSECUTIVE_ERRORS_TO_STOP_TEST]);

    const cleanQuestionText = useCallback((text) => {
        if (typeof text !== 'string') return '';
        const prefixes = [
          /Pregunta\s+\d+\/\d+\s*\(Nivel\s+[A-C]\d\s*\):?/i,
          /Question\s+\d+\/\d+\s*\(Level\s+[A-C]\d\s*\):?/i,
          /^\s*Text:.*?\nQuestion:\s*/i, 
          /^\s*Question:\s*/i,
          /^\s*Pregunta:\s*/i,
          /^-{3,}\s*/, 
          /\[IMAGE:[^\]]+\]/gi 
        ];
        
        let cleaned = text;
        prefixes.forEach(regex => {
          cleaned = cleaned.replace(regex, '').trim();
        });
        
        cleaned = cleaned.replace(/^[A-D]\)\s*/gm, '').trim(); 
        
        return cleaned;
      }, []);

    const askNextTestQuestion = useCallback(async (levelIndexToAsk, questionNumInLevelToAsk, attempt = 1) => {
        if (attempt > MAX_GENERATION_ATTEMPTS) {
            addMessage('ai', "Lo siento, estoy teniendo problemas para generar una pregunta adecuada. Vamos a intentar determinar tu nivel con lo que tenemos.");
            setIsLevelTestActive(false);
            setLevelTestStage('suggestingLevel');
            suggestLevelBasedOnTest();
            setIsAiTyping(false);
            return;
        }

        setIsAiTyping(true);
        const currentLevelForTest = LEVEL_ORDER[levelIndexToAsk];
        const questionNumberActual = questionNumInLevelToAsk + 1; 

        const previousQuestionsForThisLevel = testAnswers
            .filter(a => a.level === currentLevelForTest)
            .map(a => `"${a.questionText.replace(/\n/g, " ").replace(/\[IMAGE:[^\]]+\]/gi, "").trim()}"`) 
            .join(", ");
        
        const allPreviousQuestionTexts = testAnswers
            .map(a => `"${a.questionText.replace(/\n/g, " ").replace(/\[IMAGE:[^\]]+\]/gi, "").trim()}"`)
            .join(", ");
        
        const usedQuestionIdentifiers = usedQuestionIds.length > 0 
            ? `Las siguientes combinaciones de ID de pregunta ya se han usado (NO REPETIR ESTOS IDs): ${usedQuestionIds.join(", ")}.`
            : "Ninguna pregunta usada todavía.";

        let levelSpecificInstructions = "";
        let imageInstruction = `8.  **PREGUNTAS CON IMAGEN (SOLO PARA NIVELES A1, A2, B1 SI ES NECESARIO):** Si la pregunta requiere una imagen para ser entendida (ej. "¿Qué es esto?") Y EL NIVEL ES A1, A2, o B1, incluye la etiqueta [IMAGE:palabra_clave_simple_en_ingles] dentro del campo "questionText". La "palabra_clave_simple_en_ingles" debe ser una o dos palabras que describan la imagen (ej. "key", "blue car", "running dog"). No describas la imagen textualmente en "questionText" más allá de esta etiqueta. **PARA NIVELES B2 y C1, NO USES PREGUNTAS CON IMAGEN.**`;
        
        let professionInstruction = `9. **PREGUNTAS SOBRE PROFESIONES (CRÍTICO):** Si la pregunta es sobre profesiones (ej: "What does she do?"), DEBES incluir un contexto claro en el campo "questionText" usando el formato: "Text: [Descripción clara de la actividad laboral]\\nQuestion: [Pregunta sobre la profesión]". Ejemplo: "Text: Maria works in a hospital. She helps sick people every day.\\nQuestion: What does Maria do?". Los distractores deben ser otras profesiones reales pero claramente incorrectas según el contexto.`;
        let locationInstruction = `10. **PREGUNTAS SOBRE UBICACIONES (CRÍTICO):** Si la pregunta es sobre lugares (ej: "Where should I go?"), DEBES incluir un contexto claro en el campo "questionText" usando el formato: "Text: [Situación específica que crea una necesidad]\\nQuestion: [Pregunta sobre dónde ir]". Ejemplo: "Text: I need to buy milk and eggs for breakfast.\\nQuestion: Where should I go?". Los distractores deben ser lugares físicos reales donde la necesidad NO se puede satisfacer.`;
        let hobbyInstruction = `11. **PREGUNTAS SOBRE HOBBIES (CRÍTICO):** Las preguntas sobre hobbies deben basarse en acciones observables y frecuencia. Usa la estructura: "Text: [Nombre] [actividad] [frecuencia].\\nQuestion: What is [Nombre]'s hobby?". Ejemplo: "Text: David cooks dinner every evening.\\nQuestion: What is David's hobby?"`;
        let subjectiveQuestionProhibition = `12. **PROHIBIDO PREGUNTAS SUBJETIVAS**: 
            - Nunca generes preguntas sobre preferencias personales (favorite, like, love, enjoy, prefer).
            - Evita preguntas con "you", "your", "I", "me", "my" en el contexto o pregunta.
            - Prohibido preguntas sobre sentimientos, opiniones o experiencias personales.
            - Ejemplos PROHIBIDOS: "What is your favorite...?" ❌, "Do you like...?" ❌, "How do you feel about...?" ❌, "What would you do...?" ❌`;
        let impersonalContextRule = `13. **CONTEXTO OBLIGATORIO IMPERSONAL**:
            - Todas las preguntas deben usar tercera persona (he, she, they, it) o ser impersonales.
            - El contexto debe describir hechos observables, no preferencias.
            - Ejemplo VÁLIDO: "Text: Tom plays football every weekend.\\nQuestion: What is Tom's hobby?" ✅`;


        if (currentLevelForTest === 'B2' || currentLevelForTest === 'C1') {
            levelSpecificInstructions = `**Instrucciones Específicas para Nivel ${currentLevelForTest}:**
            - Todas las preguntas DEBEN ser de comprensión lectora, gramática avanzada, vocabulario en contexto, o expresión escrita (ej. completar una frase compleja).
            - NO uses preguntas con imágenes. Enfócate en textos cortos (3-5 oraciones) para la comprensión lectora.
            - Para gramática, enfócate en tiempos verbales complejos, modales, condicionales y voz pasiva.
            - Para vocabulario, usa palabras de nivel ${currentLevelForTest} según el MCER.
            - NUNCA uses preguntas del tipo "¿Qué es esto?" o que requieran imágenes.
            - Las preguntas deben evaluar habilidades avanzadas de lectura y análisis.`;
            imageInstruction = "8. **NO USAR PREGUNTAS CON IMAGEN PARA NIVELES B2 y C1.**"; 
            professionInstruction = `9. **PREGUNTAS SOBRE PROFESIONES (CRÍTICO):** Si la pregunta es sobre profesiones, DEBES incluir un texto de contexto de 3-5 oraciones que describa las actividades o el entorno laboral de la persona. Formato: "Text: [Contexto detallado]\\nQuestion: [Pregunta sobre la profesión]". Los distractores deben ser otras profesiones reales pero claramente incorrectas según el contexto.`;
            locationInstruction = `10. **PREGUNTAS SOBRE UBICACIONES (CRÍTICO):** Si la pregunta es sobre lugares, DEBES incluir un contexto claro de 3-5 oraciones en "questionText" usando el formato: "Text: [Situación específica que crea una necesidad]\\nQuestion: [Pregunta sobre dónde ir]". Los distractores deben ser lugares físicos reales donde la necesidad NO se puede satisfacer.`;
        }
        
        const prompt = `Actúa como un experto en enseñanza de inglés como segunda lengua (ESL) y generador de contenido educativo basado en el MCER.
        Necesito que generes UNA pregunta tipo test para el nivel ${currentLevelForTest}. Esta es la pregunta número ${questionNumberActual} para este nivel (de ${QUESTIONS_PER_LEVEL} preguntas para este nivel).
        
        ${usedQuestionIdentifiers}
        Preguntas YA FORMULADAS para ESTE NIVEL ${currentLevelForTest} (DEBES EVITAR REPETIR ESTAS EXACTAMENTE O TEMÁTICAMENTE): ${previousQuestionsForThisLevel || 'Ninguna aún para este nivel.'}
        Todas las preguntas YA FORMULADAS en este test hasta ahora (INTENTA VARIAR LOS TEMAS GENERALES DE ESTAS): ${allPreviousQuestionTexts || 'Ninguna aún.'}

        ${levelSpecificInstructions}

        Sigue estas instrucciones ESTRICTAMENTE para la pregunta que vas a generar:
        1.  **UNICIDAD ABSOLUTA:** La pregunta generada DEBE SER DIFERENTE en contenido y estructura a todas las preguntas anteriores listadas. No repitas temas si ya se han preguntado varias veces (ej. no más preguntas sobre la hora si ya hubo 2-3).
        2.  **UNA SOLA RESPUESTA CORRECTA:** La pregunta debe tener solo una respuesta correcta inequívoca.
        3.  **DISTRACTORES CLARAMENTE INCORRECTOS:** Las otras tres opciones (distractores) deben ser plausibles pero CLARAMENTE incorrectas. No deben ser ambiguas ni subjetivas. Para profesiones, todos los distractores deben ser profesiones reales pero imposibles según el contexto. Para ubicaciones, los distractores deben ser lugares reales pero donde la necesidad NO se puede satisfacer.
            * EJEMPLO DE MALOS DISTRACTORES (confuso): Pregunta: "What is a common pet?" Opciones: ["A) Dog", "B) Cat", "C) Bird"] (Todas son mascotas comunes, esto es ambiguo).
            * EJEMPLO DE BUENOS DISTRACTORES (claro): Pregunta: "Which of these is a fruit?" Opciones: ["A) Carrot", "B) Apple", "C) Potato"] (Solo "Apple" es fruta).
        4.  **ENFOQUE DEL NIVEL Y VARIEDAD:** La pregunta debe centrarse en un aspecto clave del nivel ${currentLevelForTest} (vocabulario, gramática, comprensión, tiempos verbales, modales, conectores, etc.) Y DEBE SER DIFERENTE A LOS TEMAS DE LAS PREGUNTAS ANTERIORES.
        5.  **LENGUAJE NATURAL:** Usa un inglés natural y adecuado al nivel ${currentLevelForTest}.
        6.  **FORMATO DE PREGUNTA DE COMPRENSIÓN (SI APLICA):** Si la pregunta es de comprensión, el campo "questionText" en el JSON debe incluir un breve texto de contexto seguido de la pregunta. Formato: "Text: [Contexto aquí]\\nQuestion: [Pregunta aquí]".
        ${imageInstruction}
        ${professionInstruction}
        ${locationInstruction}
        ${hobbyInstruction}
        ${subjectiveQuestionProhibition}
        ${impersonalContextRule}
        14. **PREGUNTAS SOBRE LA HORA (CRÍTICO REVISADO):** Si la pregunta es sobre decir la hora (ej. "What time is it? [IMAGE:clock showing 2 o'clock]"), la opción correcta debe ser la forma gramaticalmente correcta de decir ESA HORA ESPECÍFICA. Las TRES opciones incorrectas deben ser FORMAS GRAMATICALMENTE INCORRECTAS de decir ESA MISMA HORA. Todas las opciones (correcta e incorrectas) deben referirse a la MISMA HORA.
        15. **VALIDACIÓN DE OPCIONES (GENERAL):** Todas las opciones deben ser relevantes al tipo de pregunta. Para preguntas de ubicación, todas las opciones deben ser lugares físicos reales. Solo una opción debe resolver completamente la necesidad del contexto. Las otras opciones deben ser lugares donde la necesidad NO se puede satisfacer.

        **CRÍTICO PARA EL CAMPO "questionText" EN EL JSON:**
        - El campo "questionText" debe contener SOLO el texto de la pregunta en sí (y el texto de contexto si es de comprensión, o la etiqueta [IMAGE:keyword] si es una pregunta de imagen para A1-B1).
        - NO incluyas: Número de pregunta (ej: "Pregunta 1/25"), Nivel (ej: "Nivel A1"), Guiones o separadores (ej: "---"), ni las palabras "Question:" o "Pregunta:" como prefijo del texto de la pregunta en sí.
        
        Devuelve un objeto JSON con la siguiente estructura exacta (solo el objeto JSON, sin explicaciones adicionales fuera del JSON):
        {
            "id": "test_${currentLevelForTest}_q${questionNumberActual}_${Math.random().toString(36).substring(2, 7)}",
            "questionText": "El texto completo de la pregunta (siguiendo las reglas CRÍTICAS de formato anteriores).",
            "questionType": "multiple-choice",
            "options": ["A) Opción A", "B) Opción B", "C) Opción C", "D) Opción D"],
            "correctAnswer": "C", 
            "explanation": "Breve explicación en español."
        }
        
        Ejemplo de JSON VÁLIDO para pregunta de comprensión de Nivel A1:
        {
            "id": "test_A1_q_comp1",
            "questionText": "Text: Lisa has a red car. She drives it to work every day.\\nQuestion: What color is Lisa’s car?",
            "questionType": "multiple-choice",
            "options": ["A) Blue", "B) Green", "C) Red", "D) Yellow"],
            "correctAnswer": "C",
            "explanation": "El texto dice 'Lisa has a red car', por lo tanto, el color de su coche es rojo."
        }
        Ejemplo de JSON VÁLIDO para pregunta sobre profesión con contexto (Nivel A2):
        {
            "id": "test_A2_q_profession1",
            "questionText": "Text: Sarah works with children every day. She teaches them math and science.\\nQuestion: What does Sarah do?",
            "questionType": "multiple-choice",
            "options": ["A) She's a doctor", "B) She's a pilot", "C) She's a teacher", "D) She's an engineer"],
            "correctAnswer": "C",
            "explanation": "El contexto menciona que enseña matemáticas y ciencias a niños, lo cual es característico de una maestra."
        }`;
        
        try {
            const responseText = await callLlmApi(prompt, true);
            let questionData = JSON.parse(responseText);

            const forbiddenPatterns = [
                /Pregunta\s+\d+\/\d+/i, /Question\s+\d+\/\d+/i, 
                /Nivel\s+[A-C]\d/i, /Level\s+[A-C]\d/i,
                /^-{3,}/
            ];
            const textToCheckForPrefixes = questionData.questionText.split('[IMAGE:')[0];
            const hasInvalidPrefix = forbiddenPatterns.some(pattern => pattern.test(textToCheckForPrefixes));

            const qTextLower = questionData.questionText.toLowerCase();
            const hasBannedWord = BANNED_WORDS_FOR_QUESTIONS.some(word => qTextLower.includes(word));
            const hasPersonalPronoun = /\b(you|your|i|me|my)\b/i.test(qTextLower); 

            let contextMissing = false;
            if ((qTextLower.includes("what does") && qTextLower.includes("do?")) || (qTextLower.includes("what is") && qTextLower.includes("hobby?")) || (qTextLower.includes("where should") && qTextLower.includes("go?"))) {
                if (!qTextLower.includes("context:") && !qTextLower.includes("text:")) {
                    contextMissing = true;
                }
            }
            
            if (hasInvalidPrefix || hasBannedWord || hasPersonalPronoun || contextMissing) {
                let warningMessage = `Pregunta rechazada (intento ${attempt}/${MAX_GENERATION_ATTEMPTS}), reintentando: `;
                if (hasInvalidPrefix) warningMessage += "Formato inválido (prefijo). ";
                if (hasBannedWord) warningMessage += "Palabra prohibida. ";
                if (hasPersonalPronoun) warningMessage += "Pronombre personal. ";
                if (contextMissing) warningMessage += "Falta contexto para pregunta de profesión/ubicación/hobby. ";
                console.warn(warningMessage, questionData.questionText);
                askNextTestQuestion(levelIndexToAsk, questionNumInLevelToAsk, attempt + 1); 
                return; 
            }
            
            questionData.level = currentLevelForTest; 
            let displayQuestionText = questionData.questionText;
            let imageDetailsForMessage = null;

            const imageMatch = questionData.questionText.match(/\[IMAGE:([^\]]+)\]/);
            if (imageMatch && (currentLevelForTest === 'A1' || currentLevelForTest === 'A2' || currentLevelForTest === 'B1')) {
                const keyword = imageMatch[1].trim();
                questionData.imageKeyword = keyword; 
                const imageUrl = await fetchUnsplashImage(keyword);
                questionData.imageUrl = imageUrl; 
                displayQuestionText = questionData.questionText.replace(/\[IMAGE:[^\]]+\]/, "").trim();
                if (imageUrl) {
                    imageDetailsForMessage = { url: imageUrl, alt: keyword };
                } else {
                    addMessage('ai', `(No se pudo cargar la imagen para "${keyword}". Por favor, responde basándote en el texto.)`);
                }
            } else if (imageMatch) { 
                 console.warn(`Pregunta para nivel ${currentLevelForTest} contenía etiqueta de imagen no permitida, eliminándola: ${questionData.questionText}`);
                 displayQuestionText = questionData.questionText.replace(/\[IMAGE:[^\]]+\]/, "").trim(); 
                 questionData.questionText = displayQuestionText; 
            }
            
            setUsedQuestionIds(prev => [...prev, questionData.id]); 
            setCurrentTestQuestion(questionData); 
            const cleanTextForDisplay = cleanQuestionText(displayQuestionText); 
            addMessage('ai', `Pregunta ${testAnswers.length + 1}/${LEVEL_ORDER.length * QUESTIONS_PER_LEVEL} (Nivel ${currentLevelForTest}):\n${cleanTextForDisplay}`, questionData.options?.map(opt => ({label: opt, value: opt.charAt(0)})), questionData.id, imageDetailsForMessage);
        } catch (error) {
            console.error("Error generando pregunta de prueba:", error);
            if (attempt < MAX_GENERATION_ATTEMPTS) {
                console.warn(`Intento ${attempt} fallido, reintentando...`);
                askNextTestQuestion(levelIndexToAsk, questionNumInLevelToAsk, attempt + 1);
            } else {
                addMessage('ai', "Lo siento, tuve un problema al generar la siguiente pregunta después de varios intentos. Vamos a intentar determinar tu nivel con las respuestas que tenemos hasta ahora.");
                setIsLevelTestActive(false); 
                setLevelTestStage('suggestingLevel');
                suggestLevelBasedOnTest();
            }
        } finally {
            if (attempt >= MAX_GENERATION_ATTEMPTS || !isLevelTestActive) { 
                 setIsAiTyping(false);
            }
        }
    }, [addMessage, callLlmApi, testAnswers, usedQuestionIds, setIsAiTyping, setCurrentTestQuestion, setIsLevelTestActive, setLevelTestStage, suggestLevelBasedOnTest, LEVEL_ORDER, QUESTIONS_PER_LEVEL, cleanQuestionText, setUsedQuestionIds, BANNED_WORDS_FOR_QUESTIONS]);
    
    const evaluateTestAnswer = useCallback(async (userAnswerText) => {
        setIsAiTyping(true);
        const prompt = `El usuario está respondiendo una pregunta de prueba de nivel.
        Pregunta: "${currentTestQuestion.questionText.replace(/\[IMAGE:[^\]]+\]/, '(Imagen de ' + currentTestQuestion.imageKeyword + ' presentada visualmente)')}" 
        Nivel de la pregunta: ${currentTestQuestion.level}
        ${currentTestQuestion.options ? `Opciones: ${currentTestQuestion.options.join(", ")}` : ""}
        Respuesta Correcta: "${currentTestQuestion.correctAnswer}" 
        Explicación de la respuesta correcta: "${currentTestQuestion.explanation}"
        Respuesta del Usuario: "${userAnswerText}" (Esta es la letra de la opción que el usuario seleccionó, ej: 'A', 'B', 'C', o 'D', o el texto para fill-in-the-blank)
        
        Evalúa si la respuesta del usuario coincide con la "Respuesta Correcta". Para opción múltiple, la respuesta del usuario es la letra. Para fill-in-the-blank, es el texto.
        Si es incorrecta, proporciona una explicación AMABLE y EMPÁTICA en español de la respuesta correcta, usando la explicación provista. Usa emoticonos para suavizar y animar (ej: "¡Casi! 😊 La respuesta correcta es...", "No te preocupes, ¡así aprendemos! 😉 La opción correcta era...").
        Si es correcta, da un breve refuerzo positivo como '¡Correcto! 👍' o '¡Muy bien! 🎉'.
        Devuelve un objeto JSON con: "isCorrect" (boolean) y "feedbackText" (string).`;

        try {
            const responseText = await callLlmApi(prompt, true);
            const evaluation = JSON.parse(responseText);
            
            let correctOptionText = currentTestQuestion.correctAnswer; 
            if (currentTestQuestion.options && currentTestQuestion.questionType === 'multiple-choice') {
                const correctOpt = currentTestQuestion.options.find(opt => opt.startsWith(currentTestQuestion.correctAnswer + ')'));
                if (correctOpt) {
                    correctOptionText = correctOpt;
                }
            }

            const feedbackMessage = `${evaluation.isCorrect ? "✅ ¡Correcto!" : `⚠️ ¡Casi! La respuesta correcta es: ${correctOptionText}`}\n\n${evaluation.feedbackText}`;
            addMessage('ai', feedbackMessage);
            
            const newAnswerDetail = { 
                questionId: currentTestQuestion.id, 
                questionText: currentTestQuestion.questionText, 
                level: currentTestQuestion.level,
                userAnswer: userAnswerText, 
                isCorrect: evaluation.isCorrect,
                correctAnswer: currentTestQuestion.correctAnswer,
                explanation: currentTestQuestion.explanation,
                imageUrl: currentTestQuestion.imageUrl, 
                imageKeyword: currentTestQuestion.imageKeyword
            };
            setTestAnswers(prevTestAnswers => [...prevTestAnswers, newAnswerDetail]);

            let newConsecutiveErrors = consecutiveErrors;
            if (evaluation.isCorrect) {
                newConsecutiveErrors = 0;
                setConsecutiveErrors(0);
            } else {
                newConsecutiveErrors = consecutiveErrors + 1;
                setConsecutiveErrors(newConsecutiveErrors);
            }

            if (newConsecutiveErrors >= MAX_CONSECUTIVE_ERRORS_TO_STOP_TEST) {
                addMessage('ai', `Parece que estamos encontrando algunas dificultades. ¡No te preocupes, es parte del proceso! 😊 Vamos a finalizar la prueba aquí para sugerirte un nivel adecuado.`);
                suggestLevelBasedOnTest(); 
                setIsAiTyping(false); 
                return; 
            }

            const newQuestionsAnsweredThisLevel = questionsAnsweredThisLevel + 1;
            let nextLevelIdx = currentTestLevelIndex;
            let nextQuestionNum = newQuestionsAnsweredThisLevel;

            if (newQuestionsAnsweredThisLevel >= QUESTIONS_PER_LEVEL) {
                nextLevelIdx = currentTestLevelIndex + 1;
                nextQuestionNum = 0; 
                if (nextLevelIdx < LEVEL_ORDER.length) {
                    addMessage('ai', `¡Muy bien! Hemos completado las preguntas del nivel ${LEVEL_ORDER[currentTestLevelIndex]}. Pasemos al nivel ${LEVEL_ORDER[nextLevelIdx]}.`);
                    setCurrentTestLevelIndex(nextLevelIdx);
                    setQuestionsAnsweredThisLevel(0);
                    await askNextTestQuestion(nextLevelIdx, 0); 
                } else {
                    addMessage('ai', `¡Fantástico! Has completado todas las ${LEVEL_ORDER.length * QUESTIONS_PER_LEVEL} preguntas de la prueba de nivel. 🎉 Voy a analizar tus resultados.`);
                    suggestLevelBasedOnTest(); 
                }
            } else {
                setQuestionsAnsweredThisLevel(newQuestionsAnsweredThisLevel);
                await askNextTestQuestion(currentTestLevelIndex, newQuestionsAnsweredThisLevel);
            }

        } catch (error) {
            console.error("Error evaluando respuesta de prueba:", error);
            addMessage('ai', "Hmm, tuve un problema evaluando tu respuesta. Vamos a continuar por ahora. 😊");
            const newQuestionsAnsweredThisLevelOnError = questionsAnsweredThisLevel + 1; 
            if (newQuestionsAnsweredThisLevelOnError >= QUESTIONS_PER_LEVEL) {
                const nextLevelIndexOnError = currentTestLevelIndex + 1;
                if (nextLevelIndexOnError < LEVEL_ORDER.length) {
                    setCurrentTestLevelIndex(nextLevelIndexOnError);
                    setQuestionsAnsweredThisLevel(0);
                    await askNextTestQuestion(nextLevelIndexOnError, 0);
                } else {
                    suggestLevelBasedOnTest();
                }
            } else {
                setQuestionsAnsweredThisLevel(newQuestionsAnsweredThisLevelOnError);
                await askNextTestQuestion(currentTestLevelIndex, newQuestionsAnsweredThisLevelOnError);
            }
        } finally {
            setIsAiTyping(false);
        }
    }, [addMessage, callLlmApi, currentTestQuestion, testAnswers, questionsAnsweredThisLevel, currentTestLevelIndex, consecutiveErrors, askNextTestQuestion, suggestLevelBasedOnTest, setIsAiTyping, setCurrentTestLevelIndex, setQuestionsAnsweredThisLevel, setTestAnswers, LEVEL_ORDER, QUESTIONS_PER_LEVEL, MAX_CONSECUTIVE_ERRORS_TO_STOP_TEST]);


    const startLevelTest = useCallback(async () => {
        setIsLevelTestActive(true);
        setLevelTestStage('asking');
        setTestAnswers([]); 
        setUsedQuestionIds([]); 
        setCurrentTestLevelIndex(0);
        setQuestionsAnsweredThisLevel(0);
        setConsecutiveErrors(0); 
        addMessage('ai', "¡Genial! Empecemos con la prueba de nivel. Serán 5 preguntas por cada nivel, desde A1 hasta C1. ¡Mucha suerte! ✨");
        await askNextTestQuestion(0, 0); 
    }, [askNextTestQuestion, addMessage, setIsLevelTestActive, setLevelTestStage, setTestAnswers, setCurrentTestLevelIndex, setQuestionsAnsweredThisLevel, setConsecutiveErrors, setUsedQuestionIds]);

    // Standard Onboarding Question Flow (after test or if test skipped)
    const askNextOnboardingQuestion = useCallback((updatedUserDataToUse) => {
        let nextQuestionIdToAsk = null;
        
        if (currentQuestionId === 'levelManual' || currentQuestionId === 'levelSuggestion' || currentQuestionId === 'manualLevelChoice') {
            nextQuestionIdToAsk = 'goal';
        } else if (currentQuestionId === 'goal') {
            nextQuestionIdToAsk = (updatedUserDataToUse.goal === 'other_goal' || updatedUserDataToUse.goal === 'other_goal_pending') ? 'goalOther' : 'time';
        } else if (currentQuestionId === 'goalOther') {
            nextQuestionIdToAsk = 'time';
        } else if (currentQuestionId === 'time') {
            finishOnboarding(updatedUserDataToUse);
            return; 
        } else {
            console.warn("askNextOnboardingQuestion called in an unexpected state for currentQuestionId:", currentQuestionId);
            finishOnboarding(updatedUserDataToUse); 
            return;
        }
        
        if (nextQuestionIdToAsk) {
            const nextQuestion = onboardingQuestions.find(q => q.id === nextQuestionIdToAsk);
            if (nextQuestion) {
                setIsAiTyping(true);
                setTimeout(() => {
                    addMessage('ai', nextQuestion.text, nextQuestion.options, nextQuestion.id);
                    setCurrentQuestionId(nextQuestion.id);
                    setIsAiTyping(false);
                }, 1000); 
            } else {
                 console.error("askNextOnboardingQuestion: Could not find the determined next question object for ID:", nextQuestionIdToAsk);
                 finishOnboarding(updatedUserDataToUse); 
            }
        } else {
            finishOnboarding(updatedUserDataToUse);
        }
    }, [currentQuestionId, addMessage, finishOnboarding, onboardingQuestions, setIsAiTyping, setCurrentQuestionId]); 

    // User Input Handlers
    const handleUserInput = useCallback((value, questionId, explicitLabel = null) => { 
        const userMessageText = explicitLabel || value;
        addMessage('user', userMessageText);

        let updatedLocalUserData = { ...userData }; 

        if (questionId === 'levelTest') {
            if (value === 'test') {
                startLevelTest();
            } else { // manual
                updatedLocalUserData.level = 'manual_entry_pending'; 
                setUserData(updatedLocalUserData);
                const manualQ = onboardingQuestions.find(q => q.id === 'levelManual'); 
                if (manualQ) {
                    setIsAiTyping(true);
                    setTimeout(() => {
                        addMessage('ai', manualQ.text, manualQ.options, manualQ.id);
                        setCurrentQuestionId(manualQ.id); 
                        setIsAiTyping(false);
                    }, 1000);
                }
            }
        } else if (questionId === 'levelManual') { 
            updatedLocalUserData.level = value; 
            setUserData(updatedLocalUserData);
            askNextOnboardingQuestion(updatedLocalUserData);
        } else if (questionId === 'levelSuggestion') { 
             if (value === 'confirm_level') {
                // userData.level is already set by suggestLevelBasedOnTest
             } else { // manual_level_choice
                updatedLocalUserData.level = 'manual_entry_pending';
                setUserData(updatedLocalUserData);
                const manualLevelQ = onboardingQuestions.find(q => q.id === 'manualLevelChoice');
                if (manualLevelQ) {
                    setIsAiTyping(true);
                    setTimeout(() => {
                        addMessage('ai', manualLevelQ.text, manualLevelQ.options, manualLevelQ.id);
                        setCurrentQuestionId(manualLevelQ.id);
                        setIsAiTyping(false);
                    }, 1000);
                }
                return; 
             }
             setUserData(updatedLocalUserData); 
             askNextOnboardingQuestion(updatedLocalUserData);
        } else if (questionId === 'manualLevelChoice') { 
            updatedLocalUserData.level = value; 
            setUserData(updatedLocalUserData);
            askNextOnboardingQuestion(updatedLocalUserData);
        } else if (questionId === 'goal') {
            if (value === 'other_goal') {
                updatedLocalUserData.goal = 'other_goal_pending'; 
                setUserData(updatedLocalUserData);
                const goalOtherQ = onboardingQuestions.find(q => q.id === 'goalOther');
                if (goalOtherQ) {
                     setIsAiTyping(true);
                    setTimeout(() => {
                        addMessage('ai', goalOtherQ.text, goalOtherQ.options, goalOtherQ.id);
                        setCurrentQuestionId(goalOtherQ.id);
                        setIsAiTyping(false);
                    }, 1000);
                }
            } else {
                updatedLocalUserData.goal = value; 
                setUserData(updatedLocalUserData);
                askNextOnboardingQuestion(updatedLocalUserData);
            }
        } else if (questionId === 'goalOther') { 
            updatedLocalUserData.goal = value; 
            setUserData(updatedLocalUserData);
            askNextOnboardingQuestion(updatedLocalUserData);
        } else if (questionId === 'time') {
            updatedLocalUserData.time = value;
            setUserData(updatedLocalUserData);
            finishOnboarding(updatedLocalUserData); 
        } else {
            console.warn("handleUserInput: Unhandled case or state mismatch.", { questionId, currentQuestionId, value });
            if (!isLevelTestActive) finishOnboarding(userData);
        }
    }, [
        addMessage, 
        userData, 
        currentQuestionId, 
        startLevelTest, 
        isLevelTestActive, 
        onboardingQuestions, 
        finishOnboarding, 
        askNextOnboardingQuestion, 
        setIsAiTyping, 
        setCurrentQuestionId,
        setUserData 
    ]); 
    
    const handleUserTextInputSubmit = useCallback(() => {
        if (!userInput.trim()) return;
        
        if(isLevelTestActive && levelTestStage === 'asking' && currentTestQuestion) {
            addMessage('user', userInput); 
            evaluateTestAnswer(userInput); 
        } else {
            const currentQInfo = onboardingQuestions.find(q => q.id === currentQuestionId);
            if (currentQInfo && currentQInfo.inputType === 'text') { 
                 handleUserInput(userInput, currentQInfo.id, userInput); 
            } else {
                 console.warn("Text input submitted but no current text question active in onboarding flow for ID:", currentQuestionId);
            }
        }
        setUserInput('');
    }, [userInput, setUserInput, isLevelTestActive, levelTestStage, currentTestQuestion, addMessage, evaluateTestAnswer, onboardingQuestions, currentQuestionId, handleUserInput]);


    // Initial AI message & Scroll to bottom
    const initialMessageSent = useRef(false);
    useEffect(() => {
        if (!initialMessageSent.current && chatMessages.length === 0 && !isLevelTestActive && currentQuestionId === 'levelTest') { 
            initialMessageSent.current = true; 
             setIsAiTyping(true);
            setTimeout(() => {
                const firstQuestion = onboardingQuestions.find(q => q.id === 'levelTest');
                if (firstQuestion) { 
                    addMessage('ai', firstQuestion.text, firstQuestion.options, firstQuestion.id);
                }
                setIsAiTyping(false);
            }, 1000);
        }
    }, [currentQuestionId, chatMessages.length, isLevelTestActive, addMessage, onboardingQuestions, setIsAiTyping]); 

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatMessages]);


    const currentDisplayQuestion = isLevelTestActive && currentTestQuestion ? currentTestQuestion : onboardingQuestions.find(q => q.id === currentQuestionId);

    return (
        <div className="flex flex-col h-[calc(100vh-150px)] max-w-2xl mx-auto bg-gray-800/50 shadow-2xl rounded-xl overflow-hidden border border-gray-700">
            <div ref={chatContainerRef} className="flex-grow p-6 space-y-4 overflow-y-auto">
                {chatMessages.map((msg) => {
                    const isCurrentTestMsgWithImage = msg.sender === 'ai' && 
                                                    isLevelTestActive && 
                                                    currentTestQuestion && 
                                                    currentTestQuestion.id === msg.questionIdForOptions && 
                                                    msg.imageDetails?.url; 
                    return (
                        <motion.div 
                            key={msg.id} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                                "flex flex-col max-w-[80%] p-3 rounded-xl",
                                msg.sender === 'ai' ? "bg-purple-600 text-white self-start" : "bg-blue-500 text-white self-end"
                            )}
                        >
                            {isCurrentTestMsgWithImage && (
                                <div className="my-3 flex justify-center">
                                    <img 
                                        src={msg.imageDetails.url} 
                                        alt={msg.imageDetails.alt || "Question image"} 
                                        className="max-h-40 rounded-xl border-4 border-white shadow-lg object-contain bg-gray-200" 
                                        onError={(e) => {
                                            e.target.style.display = 'none'; 
                                            const parentDiv = e.target.parentNode;
                                            if (parentDiv && !parentDiv.querySelector('.image-error-message')) { 
                                                const errorMsgElement = document.createElement('p');
                                                errorMsgElement.textContent = `(Error al cargar imagen para: ${msg.imageDetails.alt})`;
                                                errorMsgElement.className = 'text-xs text-red-300 text-center image-error-message';
                                                parentDiv.appendChild(errorMsgElement);
                                            }
                                        }}
                                    />
                                </div>
                            )}
                            <p style={{ fontFamily: notoSans }} className="whitespace-pre-wrap">
                                {typeof msg.text === 'string' ? msg.text : JSON.stringify(msg.text)}
                            </p>
                            {msg.options && !isAiTyping && 
                             ((!isLevelTestActive || (isLevelTestActive && currentTestQuestion && msg.questionIdForOptions === currentTestQuestion.id)) &&
                             (levelTestStage !== 'suggestingLevel' || msg.questionIdForOptions === 'levelSuggestion') || msg.questionIdForOptions === 'manualLevelChoice' || msg.questionIdForOptions === 'levelTest' || msg.questionIdForOptions === 'levelManual' || msg.questionIdForOptions === 'goal' || msg.questionIdForOptions === 'time' ) && 
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {msg.options.map(opt => (
                                        <Button 
                                            key={opt.value}
                                            onClick={() => {
                                                const qId = msg.questionIdForOptions || currentDisplayQuestion?.id;
                                                if (!qId) {
                                                    console.error("Button click: qId is undefined. msg:", msg, "currentDisplayQuestion:", currentDisplayQuestion);
                                                    return;
                                                }
                                                if (isLevelTestActive && currentTestQuestion && qId === currentTestQuestion.id) {
                                                     addMessage('user', opt.label); 
                                                     evaluateTestAnswer(opt.value); 
                                                } else {
                                                    handleUserInput(opt.value, qId, opt.label);
                                                }
                                            }}
                                            className="bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-1.5 rounded-lg"
                                        >
                                            {opt.label}
                                        </Button>
                                    ))}
                                </div>
                            }
                        </motion.div>
                    );
                })}
                {isAiTyping && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex self-start"
                    >
                        <div className="bg-purple-600 text-white p-3 rounded-xl flex items-center space-x-1">
                            <span className="text-sm" style={{ fontFamily: notoSans }}>Escribiendo</span>
                            <Loader2 className="w-4 h-4 animate-spin text-white" strokeWidth={2}/>
                        </div>
                    </motion.div>
                )}
            </div>
            {currentDisplayQuestion && (currentDisplayQuestion.inputType === 'text' && (!isLevelTestActive || (isLevelTestActive && currentTestQuestion && currentTestQuestion.questionType === 'fill-in-the-blank'))) && !isAiTyping && ( 
                 <motion.div 
                    initial={{ opacity: 0, y:10 }} 
                    animate={{ opacity: 1, y:0 }}
                    className="p-4 border-t border-gray-700 flex items-center gap-2 bg-gray-800"
                >
                    <input 
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleUserTextInputSubmit()}
                        placeholder="Escribe tu respuesta..."
                        className="flex-grow p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-400"
                        style={{ fontFamily: notoSans }}
                    />
                    <Button onClick={handleUserTextInputSubmit} className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg">
                        <Send className="w-5 h-5" strokeWidth={1.5}/>
                    </Button>
                </motion.div>
            )}
        </div>
    );
};

const OnboardingConfiguringStep = ({ onComplete }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete();
        }, 4000); // Simulate configuration time
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center text-center text-white p-8 min-h-[calc(100vh-200px)]"
        >
            <Settings2 className="w-24 h-24 text-purple-400 mb-8 animate-spin-slow" strokeWidth={1.5}/>
            <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: notoSans }}>Configurando tu ruta de estudio...</h2>
            <p className="text-lg text-gray-300" style={{ fontFamily: notoSans }}>
                Estamos ajustando todo a tus necesidades. ¡Un momento! ✨
            </p>
            <style>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow { animation: spin-slow 3s linear infinite; }
            `}</style>
        </motion.div>
    );
};

const GeneralCourseDashboard = ({ userData, onBackToMainDashboard, learningPath, isLearningPathLoading, generationError, onRestartOnboarding }) => {
    
    const formatUserGoal = (goal) => {
        if (!goal) return 'No especificado';
        
        // Predefined goals
        if (goal === 'business') return 'Inglés para Negocios 💼';
        if (goal === 'travel') return 'Inglés para Viajes ✈️';
        if (goal === 'culture') return 'Inglés para Cultura General 🌍';
        // No need to check for 'other_goal' here if it's always overwritten by custom text
        
        // Interpret custom goals
        const goalLower = goal.toLowerCase();
        
        if (goalLower.includes('desarrollador') || goalLower.includes('web') || goalLower.includes('program')) {
            return 'Desarrollo Web/UX 💻';
        }
        if (goalLower.includes('figma') || goalLower.includes('diseño') || goalLower.includes('prototipo')) {
            return 'Diseño UX/UI 🎨';
        }
        if (goalLower.includes('reunion') || goalLower.includes('laboral') || goalLower.includes('trabajo')) {
            return 'Comunicación profesional 💼';
        }
        
        // If no specific keywords, show a snippet
        const words = goal.split(' ');
        if (words.length > 5) {
            return words.slice(0, 5).join(' ') + '...';
        }
        return goal; // Return the custom goal as is if short or no keywords match
    };
    
    const getLessonIcon = (type) => {
        switch (type) {
            case 'lesson': return <FileText className="w-6 h-6 text-blue-300" strokeWidth={1.5}/>;
            case 'quiz': return <HelpCircle className="w-6 h-6 text-green-300" strokeWidth={1.5}/>;
            case 'milestone': return <Award className="w-6 h-6 text-yellow-300" strokeWidth={1.5}/>;
            default: return <BookOpen className="w-6 h-6 text-gray-300" strokeWidth={1.5}/>;
        }
    };
    
    return (
    <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="max-w-4xl mx-auto space-y-8 text-white p-6"
    >
        <div className="flex justify-between items-center">
            <Button onClick={onBackToMainDashboard} className="bg-gray-700 hover:bg-gray-600 text-white">
                <ArrowLeft className="mr-2 h-5 w-5" strokeWidth={1.5}/> Volver al Dashboard Principal
            </Button>
            <Button onClick={onRestartOnboarding} variant="outline" className="text-sm border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-gray-900">
                <RefreshCw className="mr-2 h-4 w-4" strokeWidth={2}/> Actualizar Preferencias
            </Button>
        </div>
        <div className="text-center mb-10">
            <UserCheck className="w-20 h-20 text-green-400 mx-auto mb-4" strokeWidth={1.5}/>
            <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: notoSans }}>¡Tu Plan de Estudio Personalizado! 🎉</h2>
            <p className="text-lg text-gray-300" style={{ fontFamily: notoSans }}>Basado en tus respuestas, aquí tienes un punto de partida:</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center mb-10">
            <Card className="p-6 bg-gray-800/80">
                <h3 className="text-xl font-semibold text-purple-400 mb-2">Nivel Asignado</h3>
                <p className="text-2xl font-bold">{userData?.level || 'No especificado'}</p>
            </Card>
            <Card className="p-6 bg-gray-800/80">
                <h3 className="text-xl font-semibold text-purple-400 mb-2">Objetivo Principal</h3>
                <p className="text-lg">{formatUserGoal(userData?.goal)}</p>
            </Card>
            <Card className="p-6 bg-gray-800/80">
                <h3 className="text-xl font-semibold text-purple-400 mb-2">Dedicación Diaria</h3>
                <p className="text-lg">{userData?.time || 'No especificado'}</p>
            </Card>
        </div>

        {isLearningPathLoading && (
            <div className="flex flex-col items-center justify-center text-white p-8">
                <Loader2 className="w-16 h-16 text-purple-400 animate-spin mb-4" strokeWidth={1.5}/>
                <p className="text-xl">Generando tu plan de estudio personalizado...</p>
            </div>
        )}
        {generationError && !isLearningPathLoading && (
             <div className="bg-red-800/50 text-red-300 p-4 rounded-md border border-red-700 text-center">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-white" strokeWidth={1.5}/>
                <p className="font-semibold">Error al generar la ruta de estudio:</p>
                <p className="text-sm">{generationError}</p>
            </div>
        )}

        {learningPath && learningPath.sections && !isLearningPathLoading && !generationError && (
            <div className="space-y-10">
                {learningPath.sections.map((section, sectionIndex) => (
                    <div key={section.sectionNumber} className="bg-gray-800/60 p-6 rounded-xl shadow-xl border border-gray-700">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-700">
                            <h3 className="text-2xl font-bold text-purple-300" style={{ fontFamily: notoSans }}>
                                SECCIÓN {section.sectionNumber}: {section.title}
                            </h3>
                            <Button variant="outline" size="sm" className="text-sm border-purple-400 text-purple-300 hover:bg-purple-500 hover:text-white">
                                <HelpCircle className="w-4 h-4 mr-2" strokeWidth={2}/> GUÍA
                            </Button>
                        </div>
                        <div className="space-y-4">
                            {section.lessons.map((lesson, lessonIndex) => (
                                <motion.div 
                                    key={lesson.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: lessonIndex * 0.1 }}
                                    className={cn(
                                        "flex items-center p-4 rounded-lg border cursor-pointer transition-all duration-300",
                                        lesson.completed ? "bg-green-600/30 border-green-500 hover:bg-green-600/50" : "bg-gray-700/50 border-gray-600 hover:bg-gray-600/70 hover:border-purple-400"
                                    )}
                                    // onClick={() => handleLessonClick(lesson.id)} // Placeholder for future functionality
                                >
                                    <div className={cn(
                                        "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center mr-4",
                                        lesson.completed ? "bg-green-500" : "bg-purple-500"
                                    )}>
                                        {lesson.completed ? <CheckCircle className="w-7 h-7 text-white" strokeWidth={2}/> : getLessonIcon(lesson.type)}
                                    </div>
                                    <div className="flex-grow">
                                        <h4 className="text-lg font-semibold text-white">{lesson.title}</h4>
                                        <p className="text-sm text-gray-300">{lesson.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        {sectionIndex < learningPath.sections.length -1 && (
                             <div className="text-center text-gray-500 py-4 mt-6 border-t border-gray-700">
                                Siguiente Sección: {learningPath.sections[sectionIndex+1].title} (se desbloqueará al completar esta)
                            </div>
                        )}
                         {sectionIndex === learningPath.sections.length -1 && (
                             <div className="text-center text-green-400 py-4 mt-6 border-t border-gray-700 font-semibold">
                                ¡Has completado la Sección {section.sectionNumber}! Próximamente más contenido.
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )}
         {learningPath && !learningPath.sections && !isLearningPathLoading && !generationError && (
            <p className="text-xl text-gray-400 text-center">No se pudo generar un plan de estudio. Intenta de nuevo.</p>
        )}
    </motion.div>
    );
};


const EnglishLearningApp = () => {
    const [currentView, setCurrentView] = useState('dashboard'); 
    const [selectedProfessionalSection, setSelectedProfessionalSection] = useState('idioms'); 
    const [professionalData, setProfessionalData] = useState(dataFiles.idioms); 

    const [voiceOption, setVoiceOption] = useState('random'); 
    const [selectedGroqVoice, setSelectedGroqVoice] = useState(GROQ_TTS_DEFAULT_VOICE);
    const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
    const [appNotification, setAppNotification] = useState(null);
    const appNotificationTimeoutRef = useRef(null);
    const [selectedLlmProvider, setSelectedLlmProvider] = useState('gemini'); 
    const [selectedGroqLlmModel, setSelectedGroqLlmModel] = useState(DEFAULT_GROQ_LLM_MODEL);
    const [currentGroqApiKeyIndex, setCurrentGroqApiKeyIndex] = useState(0);

    // Onboarding states
    const [isOnboardingActive, setIsOnboardingActive] = useState(false);
    const [onboardingStep, setOnboardingStep] = useState('welcome'); // 'welcome', 'chat', 'configuring'
    const [onboardingUserData, setOnboardingUserData] = useState(null); // Stores { level, goal, time, testResults }

    // Learning Path State
    const [learningPath, setLearningPath] = useState(null);
    const [isLearningPathLoading, setIsLearningPathLoading] = useState(false);
    const [learningPathError, setLearningPathError] = useState('');


    const handleApiError = (service, errorType, details = "") => {
        let message = "";
        let notificationType = "warning"; 

        if (service.startsWith("Groq")) {
            if (errorType === "rateLimit") {
                const previousKeyIndex = currentGroqApiKeyIndex;
                const nextKeyIndex = (currentGroqApiKeyIndex + 1) % GROQ_API_KEYS_ARRAY.length;
                setCurrentGroqApiKeyIndex(nextKeyIndex);
                message = `Límite de API Groq (Clave ${previousKeyIndex + 1}) alcanzado. Cambiando a Clave ${nextKeyIndex + 1}/${GROQ_API_KEYS_ARRAY.length}. Por favor, reintenta la acción.`;
                if (service === "GroqTTS") setVoiceOption('system'); 
            } else if (errorType === "networkError") {
                message = `Error de red/CORS con ${service}. Verifica tu conexión/clave API o la configuración CORS del servidor. Intenta usar Gemini o la voz del sistema.`;
                if (service === "GroqTTS") setVoiceOption('system');
            } else if (errorType === "authError") {
                message = `Error de autenticación con ${service}. Verifica la API Key actual (Clave ${currentGroqApiKeyIndex + 1}). Se usará la voz del sistema para TTS.`;
                 if (service === "GroqTTS") setVoiceOption('system');
            } else if (errorType === "apiKeyConfigError") {
                 message = `La API Key de ${service} no está configurada. Se usará la voz del sistema para TTS.`;
                 if (service === "GroqTTS") setVoiceOption('system');
            }
             else { 
                message = `Error con ${service}: ${details}. Se usará la voz del sistema para TTS si aplica.`;
                 if (service === "GroqTTS") setVoiceOption('system');
            }
        } else { 
            message = `Error con ${service}: ${details || errorType}`;
            notificationType = "error"; 
        }
        
        setAppNotification({
            type: notificationType,
            message: message
        });
        if (appNotificationTimeoutRef.current) {
            clearTimeout(appNotificationTimeoutRef.current);
        }
        appNotificationTimeoutRef.current = setTimeout(() => setAppNotification(null), 10000); 
    };
    
    const firstLlmLoad = useRef(true);
    useEffect(() => {
        if (firstLlmLoad.current) {
            firstLlmLoad.current = false;
            return;
        }
        const providerName = selectedLlmProvider === 'gemini' ? 'Gemini AI' : 'Groq AI';
        setAppNotification({
            type: 'info',
            message: `${providerName} ha sido seleccionado exitosamente.`
        });
        if (appNotificationTimeoutRef.current) {
            clearTimeout(appNotificationTimeoutRef.current);
        }
        appNotificationTimeoutRef.current = setTimeout(() => setAppNotification(null), 5000);
    }, [selectedLlmProvider]);


    useEffect(() => {
        if (currentView === 'professionalEnglish') {
            const currentSectionConfig = appConfig.professionalEnglishSections.find(s => s.id === selectedProfessionalSection);
            const sectionDataKey = currentSectionConfig ? currentSectionConfig.dataKey : 'idioms';
            const sectionData = dataFiles[sectionDataKey] || dataFiles.idioms; 
            setProfessionalData(sectionData);
        }
    }, [selectedProfessionalSection, currentView]);

    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700;800&display=swap');
            body { font-family: ${notoSans}; }
        `;
        document.head.appendChild(style);
        if (window.lucide) {
            window.lucide.createIcons();
        }
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    const handleStartOnboarding = () => {
        setIsOnboardingActive(true);
        setOnboardingStep('welcome');
        setCurrentView('onboarding'); 
    };

    const handleChatComplete = (data) => {
        // data now includes { level, goal, time, testResults }
        setOnboardingUserData(data);
        setOnboardingStep('configuring');
    };
    
    const generateAndSetLearningPath = async (userDataForPath) => {
        if (!userDataForPath) {
            setLearningPathError("No hay datos de usuario para generar la ruta.");
            return;
        }
        setIsLearningPathLoading(true);
        setLearningPathError('');
        setLearningPath(null);

        // Construct a summary of test performance if available
        let testPerformanceSummary = "El usuario no realizó la prueba de nivel o no hay resultados detallados.";
        if (userDataForPath.testResults && userDataForPath.testResults.length > 0) {
            const totalQuestions = userDataForPath.testResults.length;
            const correctAnswers = userDataForPath.testResults.filter(r => r.isCorrect).length;
            testPerformanceSummary = `El usuario respondió ${correctAnswers} de ${totalQuestions} preguntas correctamente en la prueba de nivel.`;
            
            const performanceByLevel = LEVEL_ORDER.map(level => {
                const questionsForLevel = userDataForPath.testResults.filter(a => a.level === level);
                if (questionsForLevel.length === 0) return null; // Skip if no questions for this level were answered (e.g., if test was cut short)
                const correctAnswersForLevel = questionsForLevel.filter(a => a.isCorrect).length;
                return `Nivel ${level}: ${correctAnswersForLevel} de ${questionsForLevel.length} correctas.`;
            }).filter(Boolean).join("\n"); // filter(Boolean) removes null entries

            if (performanceByLevel) {
                 testPerformanceSummary += "\nDesglose por nivel:\n" + performanceByLevel;
            }
        }


        const prompt = `Eres un diseñador instruccional experto en la enseñanza del inglés como segundo idioma. Basado en la siguiente información del usuario:
- Nivel de Inglés (sugerido/confirmado): ${userDataForPath.level || 'No especificado'}
- Objetivo Principal: ${userDataForPath.goal || 'General'}
- Tiempo de Dedicación Diario: ${userDataForPath.time || '30 minutos'}
- Resumen del Desempeño en la Prueba de Nivel: ${testPerformanceSummary}

Por favor, diseña la "Sección 1" de un plan de estudio de inglés personalizado. La sección debe tener un título general y entre 4 y 6 lecciones o actividades.
Considera el desempeño en la prueba de nivel para las primeras lecciones. Si el usuario mostró debilidades en áreas específicas de su nivel asignado (o del nivel anterior), las primeras lecciones deberían reforzar esos puntos antes de avanzar.
Devuelve tu respuesta ÚNICAMENTE como un objeto JSON con la siguiente estructura:
{
  "sections": [
    {
      "sectionNumber": 1,
      "title": "Un título descriptivo y motivador para la Sección 1 (ej: 'Construyendo tu Base en Inglés')",
      "lessons": [
        { "id": "s1l1", "title": "Título corto y claro para la Lección 1 (ej: 'Saludos Esenciales')", "type": "lesson", "completed": false, "description": "Breve descripción de lo que se aprenderá en esta lección (1-2 frases)." },
        { "id": "s1l2", "title": "Título para la Lección 2 (ej: 'Presentándote')", "type": "lesson", "completed": false, "description": "Breve descripción." },
        { "id": "s1q1", "title": "Quiz Rápido: Saludos y Presentaciones", "type": "quiz", "completed": false, "description": "Un quiz para revisar lo aprendido." },
        { "id": "s1l3", "title": "Lección 3 (ej: 'El Alfabeto y Deletreo')", "type": "lesson", "completed": false, "description": "Breve descripción." },
        { "id": "s1milestone", "title": "¡Felicidades! Hito de la Sección 1", "type": "milestone", "completed": false, "description": "Has completado los fundamentos de esta sección." }
      ]
    }
  ]
}
Asegúrate de que los títulos de las lecciones sean apropiados para el nivel del usuario y sus objetivos. Incluye una mezcla de tipos de lecciones (lesson, quiz, milestone). La descripción debe ser concisa.`;

        try {
            let responseText;
            if (selectedLlmProvider === 'gemini') {
                if (!GEMINI_API_KEY_CONST) { setLearningPathError("Gemini API Key no configurada."); setIsLearningPathLoading(false); return; }
                const payload = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } };
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_NAME}:generateContent?key=${GEMINI_API_KEY_CONST}`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error?.message || `Error de Gemini (${response.status})`);
                responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
            } else { // groq
                const currentGroqKey = GROQ_API_KEYS_ARRAY[currentGroqApiKeyIndex];
                if (!currentGroqKey) { setLearningPathError("Groq API Key no configurada."); setIsLearningPathLoading(false); onApiError("GroqLLM_Path", "apiKeyConfigError"); return; }
                const payload = { model: selectedGroqLlmModel, messages: [{ role: "user", content: prompt }], temperature: 0.5, response_format: { type: "json_object" } };
                const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentGroqKey}` }, body: JSON.stringify(payload)
                });
                const result = await response.json();
                if (!response.ok) {
                    if (response.status === 429) onApiError("GroqLLM_Path", "rateLimit");
                    else if (response.status === 401) onApiError("GroqLLM_Path", "authError");
                    throw new Error(result.error?.message || `Error de Groq (${response.status})`);
                }
                responseText = result.choices?.[0]?.message?.content;
            }

            if (responseText) {
                const parsedPath = JSON.parse(responseText);
                setLearningPath(parsedPath);
            } else {
                setLearningPathError("La IA no generó una ruta de estudio válida.");
            }
        } catch (error) {
            console.error("Error generando la ruta de aprendizaje:", error);
            setLearningPathError(`Error al generar ruta: ${error.message}`);
             if (error.name === 'TypeError' && error.message.toLowerCase().includes("failed to fetch") && selectedLlmProvider === 'groq') {
                onApiError("GroqLLM_Path", "networkError");
            }
        } finally {
            setIsLearningPathLoading(false);
        }
    };


    const handleConfigurationComplete = () => {
        setIsOnboardingActive(false);
        setCurrentView('generalCourseDashboard'); 
        if (onboardingUserData && !learningPath) { 
            generateAndSetLearningPath(onboardingUserData);
        }
    };

    const handleRestartOnboardingProcess = () => {
        setOnboardingUserData(null); 
        setLearningPath(null);     
        setLearningPathError('');   
        setIsOnboardingActive(true);
        setOnboardingStep('chat'); 
        // Reset chat specific states within OnboardingChatStep if it's re-rendered or via a prop
        // For simplicity, re-rendering OnboardingChatStep by changing a key or relying on its internal useEffects to reset might be easiest.
        // Or, pass a 'resetKey' prop to OnboardingChatStep and change it here.
        setCurrentView('onboarding');
    };


    const renderCurrentView = () => {
        if (isOnboardingActive) {
            if (onboardingStep === 'welcome') {
                return <OnboardingWelcomeStep onStart={() => setOnboardingStep('chat')} />;
            }
            if (onboardingStep === 'chat') {
                return <OnboardingChatStep 
                            key={onboardingUserData ? 'chat-active' : 'chat-reset'} // Force re-render if restarting
                            onComplete={handleChatComplete} 
                            selectedLlmProvider={selectedLlmProvider}
                            groqApiKey={GROQ_API_KEYS_ARRAY[currentGroqApiKeyIndex]}
                            geminiApiKey={GEMINI_API_KEY_CONST}
                            selectedGroqLlmModel={selectedGroqLlmModel}
                            onApiError={handleApiError}
                        />;
            }
            if (onboardingStep === 'configuring') {
                return <OnboardingConfiguringStep onComplete={handleConfigurationComplete} />;
            }
        }

        switch (currentView) {
            case 'dashboard':
                return <DashboardView onSelectSection={(targetView) => {
                    if (targetView === 'generalCourseOnboarding') {
                        if (onboardingUserData && learningPath) { 
                            setCurrentView('generalCourseDashboard');
                        } else { 
                            handleStartOnboarding();
                        }
                    } else {
                        setCurrentView(targetView);
                    }
                }} />;
            case 'professionalEnglish':
                const currentProfSectionConfig = appConfig.professionalEnglishSections.find(s => s.id === selectedProfessionalSection);
                return (
                    <div className="max-w-4xl mx-auto space-y-8">
                         <Button onClick={() => setCurrentView('dashboard')} className="mb-4 bg-gray-700 hover:bg-gray-600 text-white">
                            <ArrowLeft className="mr-2 h-5 w-5" strokeWidth={1.5}/> Volver al Dashboard
                        </Button>
                        <div className="flex flex-col md:flex-row gap-4 justify-center">
                            {appConfig.professionalEnglishSections.map((sectionItem) => { 
                                const Icon = sectionItem.icon;
                                return (<motion.div key={sectionItem.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}><Button variant={selectedProfessionalSection === sectionItem.id ? 'default' : 'outline'} onClick={() => setSelectedProfessionalSection(sectionItem.id)} className={cn("px-6 py-3 rounded-full text-lg font-semibold", selectedProfessionalSection === sectionItem.id ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg" : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700", "transition-all duration-300 flex items-center gap-2", "min-w-[180px]")} style={{ fontFamily: notoSans }}><Icon className="w-5 h-5 text-white" strokeWidth={1.5}/>{sectionItem.title}</Button></motion.div>);
                            })}
                        </div>
                        <Card className="bg-gray-900/90 border border-gray-800 shadow-xl backdrop-blur-md">
                            <CardHeader><CardTitle className="text-2xl text-white" style={{ fontFamily: notoSans }}>{professionalData.title}</CardTitle><CardDescription className="text-gray-400" style={{ fontFamily: notoSans }}>Explora y aprende sobre {professionalData.title.toLowerCase()}.</CardDescription></CardHeader>
                            <CardContent>
                                <LearningSection
                                    section={currentProfSectionConfig}
                                    data={professionalData} 
                                    voiceOption={voiceOption}
                                    groqApiKey={GROQ_API_KEYS_ARRAY[currentGroqApiKeyIndex]} 
                                    geminiApiKey={GEMINI_API_KEY_CONST}
                                    selectedLlmProvider={selectedLlmProvider}
                                    selectedGroqLlmModel={selectedGroqLlmModel}
                                    groqTtsModel={GROQ_TTS_MODEL}
                                    groqTtsVoice={selectedGroqVoice}
                                    groqVoicesList={GROQ_VOICES}
                                    onApiError={handleApiError}
                                />
                            </CardContent>
                        </Card>
                    </div>
                );
            case 'generalCourseDashboard':
                if (onboardingUserData && !learningPath && !isLearningPathLoading && !learningPathError) {
                    generateAndSetLearningPath(onboardingUserData);
                }
                return <GeneralCourseDashboard 
                            userData={onboardingUserData} 
                            onBackToMainDashboard={() => setCurrentView('dashboard')}
                            learningPath={learningPath}
                            isLearningPathLoading={isLearningPathLoading}
                            generationError={learningPathError}
                            onRestartOnboarding={handleRestartOnboardingProcess}
                        />;
            case 'generalCourse': 
            case 'fundamentals':
            case 'pronunciationPractice':
            case 'aiPractice':
                return (
                    <div className="max-w-4xl mx-auto space-y-8 text-center text-white">
                        <Button onClick={() => setCurrentView('dashboard')} className="mb-4 bg-gray-700 hover:bg-gray-600 text-white">
                             <ArrowLeft className="mr-2 h-5 w-5" strokeWidth={1.5}/> Volver al Dashboard
                        </Button>
                        <h2 className="text-3xl font-bold mt-8">Sección: {currentView}</h2>
                        <p className="text-xl text-gray-400">¡Esta sección está en desarrollo! Vuelve pronto. 🚧</p>
                    </div>
                );
            default:
                return <DashboardView onSelectSection={setCurrentView} />;
        }
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black p-4 md:p-8 relative" style={{ fontFamily: notoSans }}>
            <div className="absolute top-4 right-4 md:top-8 md:right-8 z-20 flex items-center gap-3">
                 <div className="relative">
                    <BrainCircuit className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white pointer-events-none" strokeWidth={1.5}/>
                    <select
                        value={selectedLlmProvider}
                        onChange={(e) => setSelectedLlmProvider(e.target.value)}
                        className="bg-gray-800/80 hover:bg-gray-700/90 text-white border border-purple-500/50 hover:border-purple-400 rounded-full shadow-lg backdrop-blur-sm pl-10 pr-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
                        aria-label="Seleccionar proveedor de IA"
                    >
                        <option value="gemini">Gemini AI</option>
                        <option value="groq">Groq AI</option>
                    </select>
                </div>
                {selectedLlmProvider === 'groq' && (
                    <div className="relative">
                        <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white pointer-events-none" strokeWidth={1.5}/>
                        <select
                            value={selectedGroqLlmModel}
                            onChange={(e) => setSelectedGroqLlmModel(e.target.value)}
                            className="bg-gray-800/80 hover:bg-gray-700/90 text-white border border-teal-500/50 hover:border-teal-400 rounded-full shadow-lg backdrop-blur-sm pl-10 pr-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-teal-400 cursor-pointer"
                            aria-label="Seleccionar modelo LLM de Groq"
                        >
                            {AVAILABLE_GROQ_LLM_MODELS.map(model => (
                                <option key={model.id} value={model.id}>{model.name}</option>
                            ))}
                        </select>
                    </div>
                )}
                <Button variant="outline" size="icon" onClick={() => setIsVoiceModalOpen(true)} className="bg-gray-800/80 hover:bg-gray-700/90 text-white hover:text-gray-300 border-purple-500/50 hover:border-purple-400 rounded-full w-12 h-12 shadow-lg backdrop-blur-sm" aria-label="Seleccionar voz"><Ear className="w-6 h-6" strokeWidth={1.5}/></Button>
            </div>

            {appNotification && (
                <motion.div
                    initial={{ opacity: 0, y: -30, x: "-50%" }}
                    animate={{ opacity: 1, y: 0, x: "-50%" }}
                    exit={{ opacity: 0, y: -30, x: "-50%" }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={cn(
                        "fixed top-5 left-1/2 p-3 rounded-md shadow-lg text-sm z-[100] flex items-center gap-2 w-auto max-w-md", 
                        appNotification.type === 'warning' ? "bg-yellow-500 text-yellow-900" : 
                        appNotification.type === 'info' ? "bg-blue-500 text-white" :
                        "bg-red-500 text-white" // Default error
                    )}
                    style={{transform: "translateX(-50%)"}} // Ensure it stays centered horizontally
                >
                    {appNotification.type === 'warning' ? <AlertTriangle className="w-5 h-5 flex-shrink-0 text-yellow-900" strokeWidth={1.5}/> : 
                     appNotification.type === 'info' ? <Info className="w-5 h-5 flex-shrink-0 text-white" strokeWidth={1.5}/> :
                     <AlertTriangle className="w-5 h-5 flex-shrink-0 text-white" strokeWidth={1.5}/> /* Default icon for error */
                    }
                    <span className="flex-grow">{appNotification.message}</span>
                    <Button variant="ghost" size="sm" onClick={() => setAppNotification(null)} 
                        className={cn("ml-2 p-1 h-auto", 
                            appNotification.type === 'warning' ? "hover:bg-black/20 text-yellow-900" : "hover:bg-white/20 text-white"
                        )}
                    ><X className="w-4 h-4" strokeWidth={1.5}/></Button>
                </motion.div>
            )}


            <VoiceSelectionModal isOpen={isVoiceModalOpen} onClose={() => setIsVoiceModalOpen(false)} voiceOption={voiceOption} setVoiceOption={setVoiceOption} selectedGroqVoice={selectedGroqVoice} setSelectedGroqVoice={setSelectedGroqVoice} />
            
            {renderCurrentView()}

        </div>
    );
};

export default EnglishLearningApp;
